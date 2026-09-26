import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

export interface ExtractedTerm {
  term: string;
  position: string;
  index: number;
}

@Injectable()
export class ReportService {
  private readonly MEDICAL_TERMS = [
    'L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2',
    '椎间盘突出', '椎间盘退变', '椎管狭窄', '硬膜囊受压',
    '神经根受压', '椎体滑脱', '终板炎', '许莫氏结节',
    '中央型', '旁中央型', '极外侧型',
    'T2加权', 'T1加权', '信号减低', '信号增高',
    '膨出', '突出', '脱出', '游离',
    '肌力下降', '反射异常', '感觉减退',
  ];

  extractTerms(rawText: string): ExtractedTerm[] {
    const results: ExtractedTerm[] = [];
    for (const term of this.MEDICAL_TERMS) {
      let index = rawText.indexOf(term);
      while (index !== -1) {
        const context = rawText.substring(Math.max(0, index - 5), index + term.length + 5);
        results.push({ term, position: context, index });
        index = rawText.indexOf(term, index + term.length);
      }
    }
    return results.sort((a, b) => a.index - b.index);
  }

  createReport(dto: { careEventId: string; reportDate: string; rawText: string; sourceType: string }) {
    const db = getDb();
    const id = randomUUID();
    const extractedTerms = this.extractTerms(dto.rawText);
    db.prepare('INSERT INTO report (id, care_event_id, report_date, raw_text, extracted_terms, oss_key) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, dto.careEventId, dto.reportDate, dto.rawText, JSON.stringify(extractedTerms), null,
    );
    const careEvent = db.prepare('SELECT episode_id FROM care_event WHERE id = ?').get(dto.careEventId) as { episode_id: string } | undefined;
    db.prepare('UPDATE care_event SET raw_text = ?, verify_status = ? WHERE id = ?').run(dto.rawText, '尚未确认', dto.careEventId);
    return { id, careEventId: dto.careEventId, reportDate: dto.reportDate, extractedTerms, episodeId: careEvent?.episode_id };
  }

  ocrExtract(dto: { careEventId: string; reportDate: string }) {
    const db = getDb();
    const id = randomUUID();
    const mockText = '腰椎MRI：L4/5椎间盘中央型突出，硬膜囊及双侧神经根受压，椎管轻度狭窄。';
    const extractedTerms = this.extractTerms(mockText);
    db.prepare('INSERT INTO report (id, care_event_id, report_date, raw_text, extracted_terms, oss_key) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, dto.careEventId, dto.reportDate, mockText, JSON.stringify(extractedTerms), 'mock-ocr-key',
    );
    return { id, careEventId: dto.careEventId, reportDate: dto.reportDate, rawText: mockText, extractedTerms };
  }

  verifyReport(reportId: string, dto: { verifyStatus: string; extractedTerms: { term: string; position: string }[] }) {
    const db = getDb();
    const report = db.prepare('SELECT * FROM report WHERE id = ?').get(reportId) as { id: string; care_event_id: string } | undefined;
    if (!report) throw new NotFoundException('报告不存在');
    db.prepare('UPDATE report SET extracted_terms = ? WHERE id = ?').run(JSON.stringify(dto.extractedTerms), reportId);
    db.prepare('UPDATE care_event SET verify_status = ? WHERE id = ?').run(dto.verifyStatus, report.care_event_id);
    return { verified: true, reportId, verifyStatus: dto.verifyStatus };
  }

  getReportsByEpisode(episodeId: string) {
    const db = getDb();
    return db.prepare(`
      SELECT r.* FROM report r
      JOIN care_event ce ON r.care_event_id = ce.id
      WHERE ce.episode_id = ?
      ORDER BY r.report_date DESC
    `).all(episodeId);
  }

  getReport(reportId: string) {
    const db = getDb();
    const report = db.prepare('SELECT * FROM report WHERE id = ?').get(reportId);
    if (!report) throw new NotFoundException('报告不存在');
    return report;
  }

  getStructuredInfo(reportId: string) {
    const db = getDb();
    const report = db.prepare(`
      SELECT r.*, ce.event_type, ce.source_type, ce.verify_status, ce.occurred_at, ce.raw_text as care_event_text
      FROM report r
      JOIN care_event ce ON r.care_event_id = ce.id
      WHERE r.id = ?
    `).get(reportId) as any | undefined;
    if (!report) throw new NotFoundException('报告不存在');
    const extractedTerms = typeof report.extracted_terms === 'string' ? JSON.parse(report.extracted_terms) : report.extracted_terms;
    const hasConflict = report.verify_status === '有冲突';
    return {
      reportId: report.id,
      reportDate: report.report_date,
      rawText: report.raw_text,
      sourceType: report.source_type,
      eventType: report.event_type,
      occurredAt: report.occurred_at,
      verifyStatus: report.verify_status,
      extractedTerms,
      hasConflict,
      requiresConfirmation: hasConflict,
    };
  }
}
