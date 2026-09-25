import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class AnalysisWorker implements OnModuleInit, OnModuleDestroy {
  private running = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  onModuleInit() {
    this.running = true;
    this.interval = setInterval(() => this.poll(), 3000);
  }

  onModuleDestroy() {
    this.running = false;
    if (this.interval) clearInterval(this.interval);
  }

  private poll() {
    if (!this.running) return;
    const db = getDb();
    const task = db.prepare("SELECT * FROM analysis_task WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1").get() as any | undefined;
    if (!task) return;

    this.processTask(task, db);
  }

  private processTask(task: any, db: any) {
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

      const sections = {
        known: keyTerms.length > 0 ? keyTerms : ['尚未确认'],
        explanation: [
          { text: `根据检查结果，${keyTerms.join('、')}等表现与椎间盘退行性改变相关。`, source: 'evidence-doc-1', evidenceId: 'evidence-doc-1' },
          { text: '大多数轻中度患者通过保守治疗可改善症状。', source: 'evidence-doc-2', evidenceId: 'evidence-doc-2' },
        ],
        unknown: rawText ? ['具体突出程度需结合临床评估', '保守治疗效果因人而异'] : ['尚未确认'],
        nextSteps: ['避免久坐，每30分钟起身活动', '可咨询医生是否需要物理治疗'],
        video: null,
      };

      const modelRelease = db.prepare("SELECT * FROM model_release WHERE status = '生效' ORDER BY created_at DESC LIMIT 1").get() as any | undefined;
      const analysisId = randomUUID();

      const insertAnalysis = db.prepare('INSERT INTO analysis (id, episode_id, version, model_release_id, sections, retrieval_snapshot, safety_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const getExistingVersion = db.prepare('SELECT MAX(version) as maxVer FROM analysis WHERE episode_id = ?').get(task.episode_id) as any;
      const nextVersion = (getExistingVersion?.maxVer || 0) + 1;

      insertAnalysis.run(
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
}
