import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';

export const EVENT_TYPES = ['报告', '症状', '医嘱', '行动', '结局'] as const;
export const SOURCE_TYPES = ['自述', '报告原文', '医生记录'] as const;
export const VERIFY_STATUSES = ['已确认', '尚未确认', '有冲突'] as const;

export interface CareEventView {
  id: string;
  episodeId: string;
  eventType: string;
  occurredAt: string;
  reportedAt: string;
  sourceType: string;
  rawText: string | null;
  verifyStatus: string;
}

export interface SymptomLogView {
  id: string;
  careEventId: string;
  sitMinutes: number | '尚未确认';
  plannedActivityDone: string | '尚未确认';
  sleepImpact: number | '尚未确认';
  topWorry: string | '尚未确认';
  legChange: string | '尚未确认';
}

/** 缺失字段统一返回"尚未确认"语义，而不是空或"无" */
function orUnknown<T>(value: T | null): T | '尚未确认' {
  return value === null || value === undefined ? '尚未确认' : value;
}

@Injectable()
export class EpisodesService {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  listEpisodes(userId: string) {
    return this.appDb
      .prepare(
        `SELECT id, user_id AS userId, title, onset_date AS onsetDate,
                onset_certainty AS onsetCertainty, status
         FROM EPISODE WHERE user_id = ? ORDER BY rowid DESC`,
      )
      .all(userId);
  }

  createEpisode(userId: string, title: string, onsetDate: string | null, onsetCertainty: string) {
    const id = crypto.randomUUID();
    this.appDb
      .prepare('INSERT INTO EPISODE (id, user_id, title, onset_date, onset_certainty, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, userId, title, onsetDate, onsetCertainty, 'active');
    return { id };
  }

  getEpisode(userId: string, episodeId: string) {
    const episode = this.appDb
      .prepare('SELECT id, title, onset_date AS onsetDate, onset_certainty AS onsetCertainty, status FROM EPISODE WHERE id = ? AND user_id = ?')
      .get(episodeId, userId);
    if (!episode) throw new NotFoundException('病程不存在');
    return episode;
  }

  /** 更新病程（标题 / 开始日期 / 确定程度） */
  updateEpisode(
    userId: string,
    episodeId: string,
    input: { title?: string; onsetDate?: string | null; onsetCertainty?: string },
  ) {
    this.getEpisode(userId, episodeId);
    if (input.title !== undefined && !input.title.trim()) {
      throw new ForbiddenException('病程名称不能为空');
    }
    this.appDb
      .prepare(
        `UPDATE EPISODE SET title = COALESCE(?, title), onset_date = CASE WHEN ? IS NULL THEN onset_date ELSE ? END,
         onset_certainty = COALESCE(?, onset_certainty) WHERE id = ?`,
      )
      .run(input.title ?? null, input.onsetDate, input.onsetDate, input.onsetCertainty ?? null, episodeId);
    return this.getEpisode(userId, episodeId);
  }

  listEvents(userId: string, episodeId: string): CareEventView[] {
    this.getEpisode(userId, episodeId);
    return this.appDb
      .prepare(
        `SELECT id, episode_id AS episodeId, event_type AS eventType, occurred_at AS occurredAt,
                reported_at AS reportedAt, source_type AS sourceType, raw_text AS rawText, verify_status AS verifyStatus
         FROM CARE_EVENT WHERE episode_id = ? ORDER BY occurred_at ASC, rowid ASC`,
      )
      .all(episodeId) as CareEventView[];
  }

  addEvent(
    userId: string,
    episodeId: string,
    input: {
      eventType: string;
      occurredAt: string;
      sourceType: string;
      rawText?: string | null;
      verifyStatus?: string;
    },
  ): CareEventView {
    this.getEpisode(userId, episodeId);
    if (!EVENT_TYPES.includes(input.eventType as never)) {
      throw new ForbiddenException('事件类型不合法');
    }
    if (!SOURCE_TYPES.includes(input.sourceType as never)) {
      throw new ForbiddenException('来源类型不合法');
    }
    const verifyStatus = input.verifyStatus ?? '尚未确认';
    if (!VERIFY_STATUSES.includes(verifyStatus as never)) {
      throw new ForbiddenException('核实状态不合法');
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.appDb
      .prepare(
        `INSERT INTO CARE_EVENT (id, episode_id, event_type, occurred_at, reported_at, source_type, raw_text, verify_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, episodeId, input.eventType, input.occurredAt, now, input.sourceType, input.rawText ?? null, verifyStatus);
    return this.appDb
      .prepare(
        `SELECT id, episode_id AS episodeId, event_type AS eventType, occurred_at AS occurredAt,
                reported_at AS reportedAt, source_type AS sourceType, raw_text AS rawText, verify_status AS verifyStatus
         FROM CARE_EVENT WHERE id = ?`,
      )
      .get(id) as CareEventView;
  }

  /** 用户可纠正自己的记录（原文与核实状态） */
  correctEvent(userId: string, eventId: string, input: { rawText?: string; verifyStatus?: string }) {
    const event = this.appDb
      .prepare('SELECT episode_id AS episodeId FROM CARE_EVENT WHERE id = ?')
      .get(eventId) as { episodeId: string } | undefined;
    if (!event) throw new NotFoundException('记录不存在');
    this.getEpisode(userId, event.episodeId);
    if (input.verifyStatus !== undefined && !VERIFY_STATUSES.includes(input.verifyStatus as never)) {
      throw new ForbiddenException('核实状态不合法');
    }
    this.appDb
      .prepare(
        `UPDATE CARE_EVENT SET raw_text = COALESCE(?, raw_text), verify_status = COALESCE(?, verify_status) WHERE id = ?`,
      )
      .run(input.rawText ?? null, input.verifyStatus ?? null, eventId);
    return this.appDb
      .prepare(
        `SELECT id, episode_id AS episodeId, event_type AS eventType, occurred_at AS occurredAt,
                reported_at AS reportedAt, source_type AS sourceType, raw_text AS rawText, verify_status AS verifyStatus
         FROM CARE_EVENT WHERE id = ?`,
      )
      .get(eventId) as CareEventView;
  }

  /** 用户可删除自己的记录（级联删除关联的报告与症状记录） */
  deleteEvent(userId: string, eventId: string) {
    const event = this.appDb
      .prepare('SELECT episode_id AS episodeId FROM CARE_EVENT WHERE id = ?')
      .get(eventId) as { episodeId: string } | undefined;
    if (!event) throw new NotFoundException('记录不存在');
    this.getEpisode(userId, event.episodeId);
    // 先删关联数据，再删事件
    this.appDb.prepare('DELETE FROM REPORT WHERE care_event_id = ?').run(eventId);
    this.appDb.prepare('DELETE FROM SYMPTOM_LOG WHERE care_event_id = ?').run(eventId);
    this.appDb.prepare('DELETE FROM CARE_EVENT WHERE id = ?').run(eventId);
    return { deleted: true };
  }

  /** 时间线：病程事件按时间排列 */
  timeline(userId: string, episodeId: string) {
    const events = this.listEvents(userId, episodeId);
    const logs = this.appDb
      .prepare(
        `SELECT s.id, s.care_event_id AS careEventId, s.sit_minutes AS sitMinutes,
                s.planned_activity_done AS plannedActivityDone, s.sleep_impact AS sleepImpact,
                s.top_worry AS topWorry, s.leg_change AS legChange, e.occurred_at AS occurredAt
         FROM SYMPTOM_LOG s JOIN CARE_EVENT e ON e.id = s.care_event_id
         WHERE e.episode_id = ? ORDER BY e.occurred_at ASC, s.rowid ASC`,
      )
      .all(episodeId) as Array<{
      id: string;
      careEventId: string;
      sitMinutes: number | null;
      plannedActivityDone: string | null;
      sleepImpact: number | null;
      topWorry: string | null;
      legChange: string | null;
      occurredAt: string;
    }>;
    return {
      events,
      symptomLogs: logs.map((l) => ({
        id: l.id,
        careEventId: l.careEventId,
        occurredAt: l.occurredAt,
        sitMinutes: orUnknown(l.sitMinutes),
        plannedActivityDone: orUnknown(l.plannedActivityDone),
        sleepImpact: orUnknown(l.sleepImpact),
        topWorry: orUnknown(l.topWorry),
        legChange: orUnknown(l.legChange),
      })),
    };
  }

  /** 记录今天：允许跳过，缺失为"尚未确认"，不复用昨日答案 */
  addSymptomLog(
    userId: string,
    episodeId: string,
    input: {
      occurredAt: string;
      sitMinutes?: number | null;
      plannedActivityDone?: string | null;
      sleepImpact?: number | null;
      topWorry?: string | null;
      legChange?: string | null;
      changeVsYesterday?: string | null;
      activitiesDone?: string | null;
    },
  ): SymptomLogView {
    this.getEpisode(userId, episodeId);
    // 每条症状记录挂在一个"症状"类型的病程事件上
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();
    this.appDb
      .prepare(
        `INSERT INTO CARE_EVENT (id, episode_id, event_type, occurred_at, reported_at, source_type, raw_text, verify_status)
         VALUES (?, ?, '症状', ?, ?, '自述', NULL, '尚未确认')`,
      )
      .run(eventId, episodeId, input.occurredAt, now);
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO SYMPTOM_LOG (id, care_event_id, sit_minutes, planned_activity_done, sleep_impact, top_worry, leg_change, change_vs_yesterday, activities_done)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        eventId,
        input.sitMinutes ?? null,
        input.plannedActivityDone ?? null,
        input.sleepImpact ?? null,
        input.topWorry ?? null,
        input.legChange ?? null,
        input.changeVsYesterday ?? null,
        input.activitiesDone ?? null,
      );
    return {
      id,
      careEventId: eventId,
      sitMinutes: orUnknown(input.sitMinutes ?? null),
      plannedActivityDone: orUnknown(input.plannedActivityDone ?? null),
      sleepImpact: orUnknown(input.sleepImpact ?? null),
      topWorry: orUnknown(input.topWorry ?? null),
      legChange: orUnknown(input.legChange ?? null),
    };
  }

  /** 更新症状记录字段（如工作台确认“腿部麻木或无力”） */
  updateSymptomLog(
    userId: string,
    episodeId: string,
    logId: string,
    input: { legChange?: string },
  ): SymptomLogView {
    this.getEpisode(userId, episodeId);
    const log = this.appDb
      .prepare(
        `SELECT s.id FROM SYMPTOM_LOG s JOIN CARE_EVENT e ON e.id = s.care_event_id
         WHERE s.id = ? AND e.episode_id = ?`,
      )
      .get(logId, episodeId) as { id: string } | undefined;
    if (!log) throw new NotFoundException('记录不存在');
    if (input.legChange !== undefined && !['有', '没有', '尚未确认'].includes(input.legChange)) {
      throw new ForbiddenException('腿部变化取值不合法');
    }
    this.appDb
      .prepare('UPDATE SYMPTOM_LOG SET leg_change = COALESCE(?, leg_change) WHERE id = ?')
      .run(input.legChange ?? null, logId);
    return this.listSymptomLogs(userId, episodeId).find((l) => l.id === logId) ?? ({} as SymptomLogView);
  }

  listSymptomLogs(userId: string, episodeId: string): SymptomLogView[] {
    this.getEpisode(userId, episodeId);
    const logs = this.appDb
      .prepare(
        `SELECT s.id, s.care_event_id AS careEventId, s.sit_minutes AS sitMinutes,
                s.planned_activity_done AS plannedActivityDone, s.sleep_impact AS sleepImpact,
                s.top_worry AS topWorry, s.leg_change AS legChange
         FROM SYMPTOM_LOG s JOIN CARE_EVENT e ON e.id = s.care_event_id
         WHERE e.episode_id = ? ORDER BY e.occurred_at DESC, s.rowid DESC`,
      )
      .all(episodeId) as Array<{
      id: string;
      careEventId: string;
      sitMinutes: number | null;
      plannedActivityDone: string | null;
      sleepImpact: number | null;
      topWorry: string | null;
      legChange: string | null;
    }>;
    return logs.map((l) => ({
      id: l.id,
      careEventId: l.careEventId,
      sitMinutes: orUnknown(l.sitMinutes),
      plannedActivityDone: orUnknown(l.plannedActivityDone),
      sleepImpact: orUnknown(l.sleepImpact),
      topWorry: orUnknown(l.topWorry),
      legChange: orUnknown(l.legChange),
    }));
  }
}
