import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { extractTerms, mockOcr } from './terms';

export interface ReportView {
  id: string;
  careEventId: string;
  reportDate: string | null;
  rawText: string;
  extractedTerms: Array<{ term: string; position: number }>;
  sourceType: string;
  verifyStatus: string;
}

export interface VerifyView {
  reportId: string;
  source: { type: string; rawText: string };
  time: { reportDate: string | null; occurredAt: string };
  verifyStatus: string;
  terms: Array<{ term: string; position: number }>;
  conflicts: string[];
  note: string;
}

@Injectable()
export class ReportsService {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  /** 录入报告：粘贴文字为主，记录来源类型与报告日期，抽取术语 */
  createReport(
    userId: string,
    input: { careEventId: string; reportDate?: string | null; sourceType: string; rawText: string },
  ): ReportView {
    const event = this.appDb
      .prepare(
        `SELECT e.id, e.episode_id AS episodeId, ep.user_id AS userId
         FROM CARE_EVENT e JOIN EPISODE ep ON ep.id = e.episode_id WHERE e.id = ?`,
      )
      .get(input.careEventId) as { id: string; episodeId: string; userId: string } | undefined;
    if (!event || event.userId !== userId) {
      throw new NotFoundException('病程事件不存在');
    }
    const terms = extractTerms(input.rawText);
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO REPORT (id, care_event_id, report_date, raw_text, extracted_terms, oss_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.careEventId,
        input.reportDate ?? null,
        input.rawText,
        JSON.stringify(terms),
        `oss/reports/${id}.txt`,
      );
    return {
      id,
      careEventId: input.careEventId,
      reportDate: input.reportDate ?? null,
      rawText: input.rawText,
      extractedTerms: terms,
      sourceType: input.sourceType,
      verifyStatus: '尚未确认',
    };
  }

  /** 拍照提取走模拟 OCR：返回示例文本，可据此录入；传入病程事件时校验归属 */
  ocr(userId: string, careEventId?: string) {
    if (careEventId) {
      const event = this.appDb
        .prepare(
          `SELECT e.id FROM CARE_EVENT e JOIN EPISODE ep ON ep.id = e.episode_id
           WHERE e.id = ? AND ep.user_id = ?`,
        )
        .get(careEventId, userId) as { id: string } | undefined;
      if (!event) {
        throw new NotFoundException('病程事件不存在');
      }
    }
    return mockOcr();
  }

  getReport(userId: string, reportId: string): ReportView {
    const report = this.appDb
      .prepare(
        `SELECT r.id, r.care_event_id AS careEventId, r.report_date AS reportDate, r.raw_text AS rawText,
                r.extracted_terms AS extractedTerms, e.source_type AS sourceType, e.verify_status AS verifyStatus
         FROM REPORT r
         JOIN CARE_EVENT e ON e.id = r.care_event_id
         JOIN EPISODE ep ON ep.id = e.episode_id
         WHERE r.id = ? AND ep.user_id = ?`,
      )
      .get(reportId, userId) as
      | {
          id: string;
          careEventId: string;
          reportDate: string | null;
          rawText: string;
          extractedTerms: string;
          sourceType: string;
          verifyStatus: string;
        }
      | undefined;
    if (!report) throw new NotFoundException('报告不存在');
    return {
      id: report.id,
      careEventId: report.careEventId,
      reportDate: report.reportDate,
      rawText: report.rawText,
      extractedTerms: JSON.parse(report.extractedTerms ?? '[]'),
      sourceType: report.sourceType,
      verifyStatus: report.verifyStatus,
    };
  }

  /** 结构化核对：来源、时间、核实状态；冲突项必须由用户确认 */
  verify(userId: string, reportId: string): VerifyView {
    const report = this.getReport(userId, reportId);
    const event = this.appDb
      .prepare('SELECT occurred_at AS occurredAt, verify_status AS verifyStatus FROM CARE_EVENT WHERE id = ?')
      .get(report.careEventId) as { occurredAt: string; verifyStatus: string };
    const conflicts: string[] = [];
    if (!report.reportDate) {
      conflicts.push('报告日期尚未确认');
    }
    if (report.verifyStatus === '尚未确认') {
      conflicts.push('报告内容尚未确认');
    }
    if (report.verifyStatus === '有冲突') {
      conflicts.push('报告内容存在冲突，需要用户确认');
    }
    return {
      reportId: report.id,
      source: { type: report.sourceType, rawText: report.rawText },
      time: { reportDate: report.reportDate, occurredAt: event.occurredAt },
      verifyStatus: report.verifyStatus,
      terms: report.extractedTerms,
      conflicts,
      note: '冲突项需要用户确认后才能进入分析；缺失信息显示"尚未确认"，不默认为阴性。',
    };
  }

  /** 用户确认报告（解决冲突） */
  confirm(userId: string, reportId: string, verifyStatus: '已确认' | '有冲突') {
    const report = this.getReport(userId, reportId);
    this.appDb
      .prepare('UPDATE CARE_EVENT SET verify_status = ? WHERE id = ?')
      .run(verifyStatus, report.careEventId);
    return this.verify(userId, reportId);
  }
}
