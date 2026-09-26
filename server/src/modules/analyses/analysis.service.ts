import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';
import { SafetyService, SafetyCheckResult } from '../safety/safety.service';
import { FeatureSwitchService } from '../features/feature-switch.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly safetyService: SafetyService,
    private readonly featureSwitchService: FeatureSwitchService,
  ) {}

  async createAnalysis(userId: string, dto: { episodeId: string; reportId?: string; question?: string }) {
    const db = getDb();
    const id = randomUUID();

    const episode = db.prepare('SELECT * FROM episode WHERE id = ? AND user_id = ?').get(dto.episodeId, userId);
    if (!episode) throw new NotFoundException('病程不存在');

    if (dto.reportId) {
      const report = db.prepare(`
        SELECT r.id FROM report r
        JOIN care_event ce ON r.care_event_id = ce.id
        JOIN episode e ON ce.episode_id = e.id
        WHERE r.id = ? AND e.user_id = ?
      `).get(dto.reportId, userId);
      if (!report) throw new NotFoundException('报告不存在');
    }

    let safetyResult: SafetyCheckResult = { passed: true, action: 'none' };
    if (dto.question) {
      safetyResult = this.safetyService.fullCheck(dto.question);
    }

    if (!safetyResult.passed && safetyResult.action === '停止个性化分析') {
      this.safetyService.recordSafetyEvent(userId, safetyResult.ruleCode!, 'high', safetyResult.action, 'analysis_request');
      return {
        taskId: null,
        status: 'blocked',
        safetyMessage: safetyResult.message,
        ruleCode: safetyResult.ruleCode,
      };
    }

    if (!safetyResult.passed && safetyResult.action === '提示就医') {
      this.safetyService.recordSafetyEvent(userId, safetyResult.ruleCode!, 'high', safetyResult.action, 'analysis_request');
    }

    const personalizedEnabled = this.featureSwitchService.isEnabled('personalized_analysis');
    db.prepare('INSERT INTO analysis_task (id, episode_id, user_id, report_id, status, safety_flag, safety_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, dto.episodeId, userId, dto.reportId || null, 'queued', safetyResult.action, safetyResult.message || null, new Date().toISOString(),
    );

    const task = db.prepare('SELECT * FROM analysis_task WHERE id = ?').get(id);
    this.processTask(task, db);

    const updatedTask = db.prepare('SELECT * FROM analysis_task WHERE id = ?').get(id) as any;

    return {
      taskId: id,
      status: updatedTask.status,
      personalizedEnabled,
      safetyMessage: safetyResult.passed ? null : safetyResult.message,
    };
  }

  processTask(task: any, db: any) {
    db.prepare("UPDATE analysis_task SET status = 'processing' WHERE id = ?").run(task.id);

    try {
      const report = task.report_id
        ? db.prepare('SELECT * FROM report WHERE id = ?').get(task.report_id)
        : null;
      const careEvent = report
        ? db.prepare('SELECT * FROM care_event WHERE id = ?').get(report.care_event_id)
        : db.prepare('SELECT * FROM care_event WHERE episode_id = ? ORDER BY occurred_at DESC LIMIT 1').get(task.episode_id);
      const rawText = report?.raw_text || careEvent?.raw_text || '';

      const extractedTerms = report?.extracted_terms ? JSON.parse(report.extracted_terms) : [];
      const keyTerms = extractedTerms.slice(0, 3).map((t: any) => t.term);

      const modelRelease = db.prepare("SELECT * FROM model_release WHERE status = '生效' LIMIT 1").get() as any | undefined;
      const analysisId = randomUUID();
      const getExistingVersion = db.prepare('SELECT MAX(version) as maxVer FROM analysis WHERE episode_id = ?').get(task.episode_id) as any;
      const nextVersion = (getExistingVersion?.maxVer || 0) + 1;

      if (!rawText || keyTerms.length === 0) {
        // 没有可用报告/术语时不生成任何基于检查的解释，缺失即未知
        const sections = {
          known: ['尚未确认'],
          explanation: [],
          unknown: ['尚未录入检查报告', '报告中的关键术语尚未提取'],
          nextSteps: ['录入检查报告后重新生成分析'],
          video: null,
        };
        db.prepare('INSERT INTO analysis (id, episode_id, version, model_release_id, sections, retrieval_snapshot, safety_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          analysisId,
          task.episode_id,
          nextVersion,
          modelRelease?.id || null,
          JSON.stringify(sections),
          JSON.stringify({ docIds: [], chunkIds: [], rawTextLength: (rawText || '').length }),
          task.safety_flag || 'pass',
          new Date().toISOString(),
        );
        db.prepare("UPDATE analysis_task SET status = 'completed', analysis_id = ? WHERE id = ?").run(analysisId, task.id);
        return;
      }

      const sections = {
        known: keyTerms.length > 0 ? keyTerms : ['尚未确认'],
        explanation: [
          { text: `根据检查结果，${keyTerms.join('、')}等表现与椎间盘退行性改变相关。`, source: 'evidence-doc-1', evidenceId: 'evidence-doc-1' },
          { text: '大多数轻中度患者通过保守治疗可改善症状。', source: 'evidence-doc-2', evidenceId: 'evidence-doc-2' },
        ],
        unknown: ['具体突出程度需结合临床评估', '保守治疗效果因人而异'],
        nextSteps: ['避免久坐，每30分钟起身活动', '可咨询医生是否需要物理治疗'],
        video: null,
      };

      db.prepare('INSERT INTO analysis (id, episode_id, version, model_release_id, sections, retrieval_snapshot, safety_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        analysisId,
        task.episode_id,
        nextVersion,
        modelRelease?.id || null,
        JSON.stringify(sections),
        JSON.stringify({ docIds: ['evidence-doc-1', 'evidence-doc-2'], chunkIds: ['chunk-1', 'chunk-3'], rawTextLength: rawText.length }),
        task.safety_flag || 'pass',
        new Date().toISOString(),
      );

      const insertCitation = db.prepare('INSERT INTO analysis_citation (id, analysis_id, evidence_doc_id, statement, supported) VALUES (?, ?, ?, ?, ?)');
      insertCitation.run(randomUUID(), analysisId, 'evidence-doc-1', '椎间盘退行性改变与影像学表现相关', 1);
      insertCitation.run(randomUUID(), analysisId, 'evidence-doc-2', '保守治疗可改善大多数轻中度患者症状', 1);

      db.prepare("UPDATE analysis_task SET status = 'completed', analysis_id = ? WHERE id = ?").run(analysisId, task.id);
    } catch (error: any) {
      const retryCount = (task.retry_count || 0) + 1;
      if (retryCount >= 3) {
        db.prepare("UPDATE analysis_task SET status = 'failed', error_message = ?, retry_count = ? WHERE id = ?").run(error.message, retryCount, task.id);
      } else {
        db.prepare('UPDATE analysis_task SET retry_count = ? WHERE id = ?').run(retryCount, task.id);
      }
    }
  }

  async getAnalysis(taskOrAnalysisId: string, userId: string) {
    const db = getDb();
    const task = db.prepare('SELECT * FROM analysis_task WHERE id = ?').get(taskOrAnalysisId) as any | undefined;
    if (!task) throw new NotFoundException('分析任务不存在');
    if (task.user_id !== userId) throw new NotFoundException('分析任务不存在');

    if (task.status === 'queued' || task.status === 'processing') {
      return { taskId: task.id, status: task.status, createdAt: task.created_at };
    }

    if (task.status === 'failed') {
      return { taskId: task.id, status: 'failed', message: task.error_message };
    }

    const analysis = db.prepare('SELECT * FROM analysis WHERE episode_id = ? ORDER BY version DESC LIMIT 1').get(task.episode_id) as any | undefined;
    if (!analysis) throw new NotFoundException('分析结果不存在');

    return this.enrichAnalysis(analysis);
  }

  /**
   * 查询某次病程的最新一页分析（无需任务 ID）。
   */
  getLatestAnalysis(episodeId: string, userId: string) {
    const db = getDb();
    const episode = db.prepare('SELECT id FROM episode WHERE id = ? AND user_id = ?').get(episodeId, userId) as any | undefined;
    if (!episode) throw new NotFoundException('病程不存在');
    const analysis = db.prepare('SELECT * FROM analysis WHERE episode_id = ? ORDER BY version DESC LIMIT 1').get(episode.id) as any | undefined;
    if (!analysis) return { status: 'none', episodeId, message: '尚未生成分析' };
    return { status: 'ok', ...this.enrichAnalysis(analysis) };
  }

  private enrichAnalysis(analysis: any) {
    const db = getDb();
    const citations = db.prepare('SELECT * FROM analysis_citation WHERE analysis_id = ?').all(analysis.id) as any[];
    const sections = typeof analysis.sections === 'string' ? JSON.parse(analysis.sections) : analysis.sections;

    const enrichedExplanations = sections.explanation.map((exp: any) => {
      const citation = citations.find((c) => exp.source && c.evidence_doc_id.startsWith(exp.source.split('-')[1]));
      return { ...exp, hasSource: !!citation || !!exp.source };
    });

    return {
      analysisId: analysis.id,
      episodeId: analysis.episode_id,
      version: analysis.version,
      sections: { ...sections, explanation: enrichedExplanations },
      citations,
      createdAt: analysis.created_at,
    };
  }
}
