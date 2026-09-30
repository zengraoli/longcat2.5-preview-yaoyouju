import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { ERR } from '../../common/utils/business-exception';

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
    // 记录今天的字段（能坐多久、睡眠、最担心、腿部变化）
    const logs = this.appDb
      .prepare(
        `SELECT s.sit_minutes AS sitMinutes, s.planned_activity_done AS plannedActivityDone,
                s.sleep_impact AS sleepImpact, s.top_worry AS topWorry, s.leg_change AS legChange,
                s.change_vs_yesterday AS changeVsYesterday, s.activities_done AS activitiesDone
         FROM SYMPTOM_LOG s JOIN CARE_EVENT e ON e.id = s.care_event_id
         WHERE e.episode_id = ? ORDER BY e.occurred_at DESC, s.rowid DESC LIMIT 1`,
      )
      .get(episodeId) as
      | {
          sitMinutes: number | null;
          plannedActivityDone: string | null;
          sleepImpact: number | null;
          topWorry: string | null;
          legChange: string | null;
          changeVsYesterday: string | null;
          activitiesDone: string | null;
        }
      | undefined;
    if (logs) {
      const parts: string[] = [];
      if (logs.changeVsYesterday) parts.push(`与昨天相比${logs.changeVsYesterday}`);
      if (logs.sitMinutes !== null) parts.push(`能坐约 ${logs.sitMinutes} 分钟`);
      if (logs.plannedActivityDone) parts.push(`计划活动：${logs.plannedActivityDone}`);
      if (logs.sleepImpact !== null) parts.push(`睡眠影响 ${logs.sleepImpact}/3`);
      if (logs.activitiesDone) parts.push(`今天做了：${logs.activitiesDone}`);
      if (logs.legChange && logs.legChange !== '尚未确认') parts.push(`腿部麻木或无力：${logs.legChange}`);
      if (parts.length > 0) {
        content.当前情况.push({ text: parts.join('；'), source: '自述' });
      }
      if (logs.topWorry) {
        content.当前情况.push({ text: `最担心：${logs.topWorry}`, source: '自述' });
      }
    }
    // 下一步：来自医嘱与红旗信号提示
    for (const e of events) {
      if (e.eventType === '医嘱' && e.rawText) {
        content.下一步.push({ text: e.rawText, source: '医生记录' });
      }
    }
    content.下一步.push({ text: '如症状持续或加重，请前往正规医疗机构就诊。' });
    // 复诊问题：来自问与解释中加入的问题（含自由提问会话与本会话关联本病程分析的问题）
    const questions = this.appDb
      .prepare(
        `SELECT q.question FROM QA_FOLLOWUP_QUESTION q
         JOIN QA_SESSION s ON s.id = q.session_id
         WHERE s.user_id = ?
           AND (s.analysis_id IS NULL OR s.analysis_id IN (SELECT id FROM ANALYSIS WHERE episode_id = ?))
         ORDER BY q.created_at ASC, q.rowid ASC`,
      )
      .all(userId, episodeId) as Array<{ question: string }>;
    content.复诊问题 = questions.map((q) => q.question);
    return content;
  }

  /** 把保存的用户纠正合并到实时内容上：同位置以保存为准，新增内容追加 */
  private mergeWithCorrections(live: SummaryContent, saved: SummaryContent): SummaryContent {
    const mergeSection = (
      liveItems: Array<{ text: string; source?: string; mark?: string }>,
      savedItems: unknown,
    ): Array<{ text: string; source?: string; mark?: string }> => {
      const savedArr = (Array.isArray(savedItems) ? savedItems : []).filter(
        (i): i is { text: string; source?: string; mark?: string } =>
          typeof i === 'object' && i !== null && typeof (i as { text?: unknown }).text === 'string',
      );
      const max = Math.max(liveItems.length, savedArr.length);
      const out: Array<{ text: string; source?: string; mark?: string }> = [];
      for (let i = 0; i < max; i++) {
        if (i < savedArr.length) {
          const s = savedArr[i];
          out.push({
            text: s.text,
            ...(s.source !== undefined ? { source: String(s.source) } : {}),
            ...(s.mark !== undefined ? { mark: String(s.mark) } : {}),
          });
        } else if (i < liveItems.length) {
          out.push(liveItems[i]);
        }
      }
      return out;
    };
    // 复诊问题：保存的顺序优先，新增问题追加在后面
    const savedQuestions = Array.isArray(saved.复诊问题)
      ? saved.复诊问题.filter((q): q is string => typeof q === 'string')
      : [];
    const mergedQuestions = [...savedQuestions];
    for (const q of live.复诊问题) {
      if (!mergedQuestions.includes(q)) mergedQuestions.push(q);
    }
    return {
      当前情况: mergeSection(live.当前情况, saved.当前情况),
      报告要点: mergeSection(live.报告要点, saved.报告要点),
      医嘱要点: mergeSection(live.医嘱要点, saved.医嘱要点),
      尚未确认: mergeSection(live.尚未确认, saved.尚未确认),
      下一步: mergeSection(live.下一步, saved.下一步),
      复诊问题: mergedQuestions,
    };
  }

  /** 预览（不保存）：实时生成，并合并已保存的用户纠正（新增记录/医嘱/问题会实时反映） */
  preview(userId: string, episodeId: string) {
    this.getEpisode(userId, episodeId);
    const live = this.generate(userId, episodeId);
    const existing = this.appDb
      .prepare('SELECT content FROM FOLLOWUP_SUMMARY WHERE episode_id = ?')
      .get(episodeId) as { content: string } | undefined;
    if (!existing) return live;
    return this.mergeWithCorrections(live, JSON.parse(existing.content) as SummaryContent);
  }

  /** 校验并清洗摘要内容：各段元素与复诊问题只接受字符串，避免非字符串原样写入 */
  private sanitize(content: SummaryContent): SummaryContent {
    const clean = (arr: unknown): Array<{ text: string; source?: string; mark?: string }> =>
      (Array.isArray(arr) ? arr : [])
        .filter(
          (item): item is { text: string; source?: string; mark?: string } =>
            typeof item === 'object' && item !== null && typeof (item as { text?: unknown }).text === 'string',
        )
        .map((item) => ({
          text: item.text,
          ...(item.source !== undefined ? { source: String(item.source) } : {}),
          ...(item.mark !== undefined ? { mark: String(item.mark) } : {}),
        }));
    const questions = Array.isArray(content.复诊问题)
      ? content.复诊问题.filter((q): q is string => typeof q === 'string')
      : [];
    return {
      当前情况: clean(content.当前情况),
      报告要点: clean(content.报告要点),
      医嘱要点: clean(content.医嘱要点),
      尚未确认: clean(content.尚未确认),
      下一步: clean(content.下一步),
      复诊问题: questions,
    };
  }

  /** 保存/更新摘要 */
  save(userId: string, episodeId: string, content: SummaryContent) {
    this.getEpisode(userId, episodeId);
    const sanitized = this.sanitize(content);
    // 校验内容非空
    const hasContent =
      sanitized.当前情况.length > 0 ||
      sanitized.报告要点.length > 0 ||
      sanitized.医嘱要点.length > 0 ||
      sanitized.尚未确认.length > 0 ||
      sanitized.下一步.length > 0 ||
      sanitized.复诊问题.length > 0;
    if (!hasContent) {
      throw ERR.CONFLICT('摘要内容为空，无法保存');
    }
    const existing = this.appDb
      .prepare('SELECT id FROM FOLLOWUP_SUMMARY WHERE episode_id = ?')
      .get(episodeId) as { id: string } | undefined;
    if (existing) {
      this.appDb.prepare('UPDATE FOLLOWUP_SUMMARY SET content = ? WHERE id = ?').run(
        JSON.stringify(sanitized),
        existing.id,
      );
      return { id: existing.id, episodeId, content: sanitized };
    }
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO FOLLOWUP_SUMMARY (id, episode_id, content, export_format, exported_at) VALUES (?, ?, ?, NULL, NULL)`,
      )
      .run(id, episodeId, JSON.stringify(sanitized));
    return { id, episodeId, content: sanitized };
  }

  /** 纠正摘要内容 */
  correct(userId: string, summaryId: string, content: SummaryContent) {
    const summary = this.getSummary(userId, summaryId);
    const sanitized = this.sanitize(content);
    this.appDb.prepare('UPDATE FOLLOWUP_SUMMARY SET content = ? WHERE id = ?').run(
      JSON.stringify(sanitized),
      summaryId,
    );
    return { id: summaryId, episodeId: summary.episodeId, content: sanitized };
  }

  /** 问题清单排序（只接受字符串数组，否则拒绝） */
  reorderQuestions(userId: string, summaryId: string, questions: unknown[]) {
    const summary = this.getSummary(userId, summaryId);
    const content = JSON.parse(summary.content) as SummaryContent;
    if (!Array.isArray(questions) || !questions.every((q) => typeof q === 'string')) {
      throw ERR.PARAM_INVALID('问题清单必须是字符串数组');
    }
    content.复诊问题 = questions;
    this.appDb.prepare('UPDATE FOLLOWUP_SUMMARY SET content = ? WHERE id = ?').run(
      JSON.stringify(content),
      summaryId,
    );
    return { id: summaryId, episodeId: summary.episodeId, content };
  }

  /** 导出：记录导出时间与格式；内容实时生成并合并用户纠正；文本复制必做，PDF 由前端打印生成 */
  export(userId: string, summaryId: string, format: '文本' | 'PDF' | '图片') {
    const summary = this.getSummary(userId, summaryId);
    // 导出内容 = 实时生成 + 已保存纠正（新增记录/医嘱/问题都会反映）
    const content = this.preview(userId, summary.episodeId);
    void summary;
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
    lines.push('');
    lines.push('未经医生核实 · 不含诊断结论 · 本摘要仅整理你已录入的信息，供复诊时参考。');
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
