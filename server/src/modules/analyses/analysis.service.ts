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

    return {
      taskId: id,
      status: 'queued',
      personalizedEnabled,
      safetyMessage: safetyResult.passed ? null : safetyResult.message,
    };
  }

  async getAnalysis(taskOrAnalysisId: string) {
    const db = getDb();
    const task = db.prepare('SELECT * FROM analysis_task WHERE id = ?').get(taskOrAnalysisId) as any | undefined;
    if (!task) throw new NotFoundException('分析任务不存在');

    if (task.status === 'queued' || task.status === 'processing') {
      return { taskId: task.id, status: task.status, createdAt: task.created_at };
    }

    if (task.status === 'failed') {
      return { taskId: task.id, status: 'failed', message: task.error_message };
    }

    const analysis = db.prepare('SELECT * FROM analysis WHERE episode_id = ? ORDER BY version DESC LIMIT 1').get(task.episode_id) as any | undefined;
    if (!analysis) throw new NotFoundException('分析结果不存在');

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
