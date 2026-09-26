import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class FeedbackService {
  createFeedback(userId: string, dto: {
    analysisId?: string;
    helpType?: string;
    unsolvedQuestion?: string;
    isErrorReport?: boolean;
    errorCategory?: string;
    errorDescription?: string;
    severity?: string;
  }) {
    const db = getDb();
    const id = randomUUID();

    const analysis = dto.analysisId
      ? db.prepare('SELECT * FROM analysis WHERE id = ?').get(dto.analysisId) as any | undefined
      : null;
    const modelRelease = analysis?.model_release_id
      ? db.prepare('SELECT * FROM model_release WHERE id = ?').get(analysis.model_release_id) as any | undefined
      : null;

    const contentVersion = db.prepare('SELECT * FROM content_version ORDER BY published_at DESC LIMIT 1').get() as any | undefined;
    const ruleSetVersion = 'RF-v1.0';

    db.prepare('INSERT INTO feedback (id, analysis_id, help_type, unsolved_question, is_error_report) VALUES (?, ?, ?, ?, ?)').run(
      id, dto.analysisId || null, dto.helpType || null, dto.unsolvedQuestion || null, dto.isErrorReport ? 1 : 0,
    );

    const reportRecord = db.prepare(`
      INSERT INTO error_report (id, feedback_id, severity, category, description, analysis_version, model_version, content_version, rule_set_version, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      id,
      dto.severity || 'medium',
      dto.errorCategory || null,
      dto.errorDescription || null,
      analysis?.version || null,
      modelRelease?.prompt_version || null,
      contentVersion ? `av-v${contentVersion.version}` : null,
      ruleSetVersion,
      'open',
      new Date().toISOString(),
    );

    return {
      id,
      isErrorReport: dto.isErrorReport,
      ...(dto.isErrorReport ? {
        errorReportId: reportRecord,
        attachedVersions: {
          analysisVersion: analysis?.version || null,
          modelVersion: modelRelease?.prompt_version || null,
          contentVersion: contentVersion ? `av-v${contentVersion.version}` : null,
          ruleSetVersion,
        },
      } : {}),
    };
  }

  getFeedbackList(filters?: { isErrorReport?: boolean; severity?: string }) {
    const db = getDb();
    let sql = 'SELECT * FROM feedback WHERE 1=1';
    const params: any[] = [];
    if (filters?.isErrorReport !== undefined) {
      sql += ' AND is_error_report = ?';
      params.push(filters.isErrorReport ? 1 : 0);
    }
    return db.prepare(sql + ' ORDER BY rowid DESC').all(...params);
  }

  getFeedbackById(feedbackId: string) {
    const db = getDb();
    const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(feedbackId) as any | undefined;
    if (!feedback) throw new NotFoundException('反馈不存在');

    let errorReport = null;
    if (feedback.is_error_report) {
      errorReport = db.prepare('SELECT * FROM error_report WHERE feedback_id = ?').get(feedbackId);
    }

    return { ...feedback, errorReport };
  }

  grantView(dto: { feedbackId: string; granteeId: string }) {
    const db = getDb();
    db.prepare('INSERT INTO feedback_view_grant (id, feedback_id, grantee_id, granted_at) VALUES (?, ?, ?, ?)').run(
      randomUUID(), dto.feedbackId, dto.granteeId, new Date().toISOString(),
    );
    return { granted: true };
  }

  hasViewGrant(feedbackId: string, granteeId: string): boolean {
    const db = getDb();
    const grant = db.prepare('SELECT * FROM feedback_view_grant WHERE feedback_id = ? AND grantee_id = ?').get(feedbackId, granteeId);
    return !!grant;
  }
}
