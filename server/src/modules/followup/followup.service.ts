import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';

export interface SummarySection {
  text: string;
  source?: string;
  mark?: string;
}

export interface SummaryContent {
  当前情况: SummarySection[];
  报告要点: SummarySection[];
  医嘱要点: SummarySection[];
  尚未确认: SummarySection[];
  下一步: SummarySection[];
  复诊问题: string[];
}

function emptyContent(): SummaryContent {
  return { 当前情况: [], 报告要点: [], 医嘱要点: [], 尚未确认: [], 下一步: [], 复诊问题: [] };
}

@Injectable()
export class FollowupService {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  /** 生成复诊摘要：固定六段，区分自述/报告原文/医生记录，保留未核实项 */
  generate(userId: string, episodeId: string): SummaryContent {
    this.getEpisode(userId, episodeId);
    const events = this.appDb
      .prepare(
        `SELECT event_type AS eventType, source_type AS sourceType, raw_text AS rawText, verify_status AS verifyStatus
         FROM CARE_EVENT WHERE episode_id = ? ORDER BY occurred_at ASC, rowid ASC`,
      )
      .all(episodeId) as Array<{
      eventType: string;
      sourceType: string;
      rawText: string | null;
      verifyStatus: string;
    }>;
    const content = emptyContent();
    for (const e of events) {
      if (!e.rawText) continue;
      if (e.eventType === '报告') {
        content.报告要点.push({ text: e.rawText, source: e.sourceType });
      } else if (e.eventType === '医嘱') {
        content.医嘱要点.push({ text: e.rawText, source: e.sourceType });
      } else {
        content.当前情况.push({ text: e.rawText, source: e.sourceType });
      }
      if (e.verifyStatus === '尚未确认') {
        content.尚未确认.push({ text: e.rawText, mark: '未经核实' });
      }
    }
    // 下一步：来自医嘱与红旗信号提示
    for (const e of events) {
      if (e.eventType === '医嘱' && e.rawText) {
        content.下一步.push({ text: e.rawText, source: '医生记录' });
      }
    }
    content.下一步.push({ text: '如症状持续或加重，请前往正规医疗机构就诊。' });
    // 复诊问题：来自问与解释中加入的问题
    const questions = this.appDb
      .prepare(
        `SELECT q.question FROM QA_FOLLOWUP_QUESTION q
         JOIN QA_SESSION s ON s.id = q.session_id
         JOIN ANALYSIS a ON a.id = s.analysis_id
         WHERE a.episode_id = ? ORDER BY q.created_at ASC, q.rowid ASC`,
      )
      .all(episodeId) as Array<{ question: string }>;
    content.复诊问题 = questions.map((q) => q.question);
    return content;
  }

  /** 预览（不保存） */
  preview(userId: string, episodeId: string) {
    return this.generate(userId, episodeId);
  }

  /** 保存/更新摘要 */
  save(userId: string, episodeId: string, content: SummaryContent) {
    this.getEpisode(userId, episodeId);
    const existing = this.appDb
      .prepare('SELECT id FROM FOLLOWUP_SUMMARY WHERE episode_id = ?')
      .get(episodeId) as { id: string } | undefined;
    if (existing) {
      this.appDb.prepare('UPDATE FOLLOWUP_SUMMARY SET content = ? WHERE id = ?').run(
        JSON.stringify(content),
        existing.id,
      );
      return { id: existing.id, episodeId, content };
    }
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO FOLLOWUP_SUMMARY (id, episode_id, content, export_format, exported_at) VALUES (?, ?, ?, NULL, NULL)`,
      )
      .run(id, episodeId, JSON.stringify(content));
    return { id, episodeId, content };
  }

  /** 纠正摘要内容 */
  correct(userId: string, summaryId: string, content: SummaryContent) {
    const summary = this.getSummary(userId, summaryId);
    this.appDb.prepare('UPDATE FOLLOWUP_SUMMARY SET content = ? WHERE id = ?').run(
      JSON.stringify(content),
      summaryId,
    );
    return { id: summaryId, episodeId: summary.episodeId, content };
  }

  /** 问题清单排序 */
  reorderQuestions(userId: string, summaryId: string, questions: string[]) {
    const summary = this.getSummary(userId, summaryId);
    const content = JSON.parse(summary.content) as SummaryContent;
    content.复诊问题 = questions;
    this.appDb.prepare('UPDATE FOLLOWUP_SUMMARY SET content = ? WHERE id = ?').run(
      JSON.stringify(content),
      summaryId,
    );
    return { id: summaryId, episodeId: summary.episodeId, content };
  }

  /** 导出：记录导出时间与格式；文本复制必做，PDF 由前端打印生成 */
  export(userId: string, summaryId: string, format: '文本' | 'PDF' | '图片') {
    const summary = this.getSummary(userId, summaryId);
    const content = JSON.parse(summary.content) as SummaryContent;
    const text = this.renderText(content);
    this.appDb
      .prepare('UPDATE FOLLOWUP_SUMMARY SET export_format = ?, exported_at = ? WHERE id = ?')
      .run(format, new Date().toISOString(), summaryId);
    return {
      id: summaryId,
      episodeId: summary.episodeId,
      format,
      exportedAt: new Date().toISOString(),
      text,
      note: format === 'PDF' ? 'PDF 通过浏览器打印生成，本接口返回文本内容。' : undefined,
    };
  }

  /** 渲染纯文本（六段固定结构） */
  renderText(content: SummaryContent): string {
    const lines: string[] = [];
    lines.push('【当前情况】');
    for (const s of content.当前情况) lines.push(`- ${s.text}（${s.source ?? '自述'}）`);
    lines.push('【报告要点】');
    for (const s of content.报告要点) lines.push(`- ${s.text}（${s.source ?? '报告原文'}）`);
    lines.push('【医嘱要点】');
    for (const s of content.医嘱要点) lines.push(`- ${s.text}（${s.source ?? '医生记录'}）`);
    lines.push('【尚未确认】');
    for (const s of content.尚未确认) lines.push(`- ${s.text}（${s.mark ?? '未经核实'}）`);
    lines.push('【下一步】');
    for (const s of content.下一步) lines.push(`- ${s.text}${s.source ? `（${s.source}）` : ''}`);
    lines.push('【复诊问题】');
    for (const q of content.复诊问题) lines.push(`- ${q}`);
    return lines.join('\n');
  }

  private getEpisode(userId: string, episodeId: string) {
    const episode = this.appDb
      .prepare('SELECT id FROM EPISODE WHERE id = ? AND user_id = ?')
      .get(episodeId, userId) as { id: string } | undefined;
    if (!episode) throw new NotFoundException('病程不存在');
    return episode;
  }

  private getSummary(userId: string, summaryId: string) {
    const summary = this.appDb
      .prepare(
        `SELECT id, episode_id AS episodeId, content FROM FOLLOWUP_SUMMARY WHERE id = ?`,
      )
      .get(summaryId) as { id: string; episodeId: string; content: string } | undefined;
    if (!summary) throw new NotFoundException('摘要不存在');
    const episode = this.appDb
      .prepare('SELECT id FROM EPISODE WHERE id = ? AND user_id = ?')
      .get(summary.episodeId, userId) as { id: string } | undefined;
    if (!episode) throw new NotFoundException('摘要不存在');
    return summary;
  }
}
