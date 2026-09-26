import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class FollowupService {
  generatePreview(userId: string, episodeId: string) {
    const db = getDb();

    const episode = db.prepare('SELECT * FROM episode WHERE id = ? AND user_id = ?').get(episodeId, userId);
    if (!episode) throw new NotFoundException('病程不存在');

    const events = db.prepare('SELECT * FROM care_event WHERE episode_id = ? ORDER BY occurred_at DESC').all(episodeId) as any[];
    const reports = db.prepare(`
      SELECT r.* FROM report r
      JOIN care_event ce ON r.care_event_id = ce.id
      WHERE ce.episode_id = ?
      ORDER BY r.report_date DESC
    `).all(episodeId) as any[];
    const analyses = db.prepare('SELECT * FROM analysis WHERE episode_id = ? ORDER BY version DESC LIMIT 1').get(episodeId) as any | undefined;
    const symptomLogs = db.prepare(`
      SELECT sl.* FROM symptom_log sl
      JOIN care_event ce ON sl.care_event_id = ce.id
      WHERE ce.episode_id = ?
      ORDER BY ce.occurred_at DESC LIMIT 7
    `).all(episodeId) as any[];

    const selfReported = events.filter((e) => e.source_type === '自述' && e.event_type !== '医嘱' && e.event_type !== '变化确认' && e.event_type !== '主要困惑');
    const reportItems = events.filter((e) => e.source_type === '报告原文');
    // 医生建议：医生的记录 + 用户录入的医嘱（自述转述）
    const doctorRecords = events.filter((e) => e.source_type === '医生记录' || e.event_type === '医嘱');

    const sections = {
      chiefComplaint: {
        title: '主诉与病程',
        selfReported: selfReported.map((e) => e.raw_text),
        onsetDate: (episode as any).onset_date || '尚未确认',
      },
      examinationFindings: {
        title: '检查与检验',
        reports: reports.map((r) => ({
          date: r.report_date,
          text: r.raw_text,
          verifyStatus: '尚未确认',
        })),
      },
      diagnosisAndAssessment: {
        title: '诊断与评估',
        doctorRecords: doctorRecords.map((e) => ({
          text: e.raw_text,
          verifyStatus: e.verify_status,
        })),
        latestAnalysis: analyses ? (() => {
          const s = typeof (analyses as any).sections === 'string' ? JSON.parse((analyses as any).sections) : (analyses as any).sections;
          return s.known;
        })() : '尚未确认',
      },
      symptomsAndChanges: {
        title: '症状变化',
        recentLogs: symptomLogs.map((sl) => ({
          date: '尚未确认',
          sitMinutes: sl.sit_minutes ?? '尚未确认',
          topWorry: sl.top_worry ?? '尚未确认',
          legChange: sl.leg_change || '尚未确认',
        })),
      },
      concerns: {
        title: '担心与顾虑',
        topWorries: symptomLogs.filter((sl) => sl.top_worry).map((sl) => sl.top_worry),
      },
      questionsForDoctor: {
        title: '想问医生的问题',
        // 仅收录用户实际记录的担心与分析中的未知项；无记录时为空
        questions: [],
      },
    };

    return { episodeId, generatedAt: new Date().toISOString(), sections };
  }

  exportSummary(userId: string, dto: { episodeId: string; format: string }) {
    const db = getDb();
    const preview = this.generatePreview(userId, dto.episodeId);

    const textContent = Object.values(preview.sections)
      .map((section: any) => {
        const lines = [`## ${section.title}`];
        if (section.selfReported) lines.push(...section.selfReported.map((t: string) => `- ${t}`));
        if (section.onsetDate) lines.push(`发病日期: ${section.onsetDate}`);
        if (section.reports) lines.push(...section.reports.map((r: any) => `- [${r.date}] ${r.text} (${r.verifyStatus})`));
        if (section.doctorRecords) lines.push(...section.doctorRecords.map((r: any) => `- ${r.text} (${r.verifyStatus})`));
        if (section.latestAnalysis) lines.push(`分析已知: ${section.latestAnalysis.join('、')}`);
        if (section.recentLogs) lines.push(...section.recentLogs.map((l: any) => `- 坐${l.sitMinutes}分钟, 担心: ${l.topWorry}, 腿部变化: ${l.legChange}`));
        if (section.topWorries) lines.push(...section.topWorries.map((t: string) => `- ${t}`));
        if (section.questions) lines.push(...section.questions.map((q: string) => `- ${q}`));
        return lines.join('\n');
      })
      .join('\n\n');

    const id = randomUUID();
    db.prepare('INSERT INTO followup_summary (id, episode_id, content, export_format, exported_at) VALUES (?, ?, ?, ?, ?)').run(
      id, dto.episodeId, textContent, dto.format, new Date().toISOString(),
    );

    return { id, content: textContent, format: dto.format, exportedAt: new Date().toISOString() };
  }
}
