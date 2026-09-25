import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class EpisodeService {
  createEpisode(userId: string, dto: { title: string; onsetDate?: string; onsetCertainty?: string }) {
    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO episode (id, user_id, title, onset_date, onset_certainty, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, userId, dto.title, dto.onsetDate || null, dto.onsetCertainty || '尚未确认', 'active',
    );
    return { id, userId, title: dto.title, onsetDate: dto.onsetDate || null, onsetCertainty: dto.onsetCertainty || '尚未确认', status: 'active' };
  }

  getEpisodes(userId: string) {
    const db = getDb();
    return db.prepare('SELECT * FROM episode WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }

  getEpisode(episodeId: string, userId: string) {
    const db = getDb();
    const episode = db.prepare('SELECT * FROM episode WHERE id = ? AND user_id = ?').get(episodeId, userId);
    if (!episode) throw new NotFoundException('病程不存在');
    return episode;
  }

  createCareEvent(dto: { episodeId: string; eventType: string; occurredAt: string; sourceType: string; rawText?: string; verifyStatus?: string }) {
    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO care_event (id, episode_id, event_type, occurred_at, reported_at, source_type, raw_text, verify_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, dto.episodeId, dto.eventType, dto.occurredAt, new Date().toISOString(), dto.sourceType, dto.rawText || null, dto.verifyStatus || '尚未确认',
    );
    return { id, ...dto, reportedAt: new Date().toISOString(), verifyStatus: dto.verifyStatus || '尚未确认' };
  }

  getCareEvents(episodeId: string) {
    const db = getDb();
    return db.prepare('SELECT * FROM care_event WHERE episode_id = ? ORDER BY occurred_at DESC').all(episodeId);
  }

  updateCareEvent(eventId: string, userId: string, dto: { rawText?: string; verifyStatus?: string }) {
    const db = getDb();
    const event = db.prepare('SELECT ce.* FROM care_event ce JOIN episode e ON ce.episode_id = e.id WHERE ce.id = ? AND e.user_id = ?').get(eventId, userId);
    if (!event) throw new NotFoundException('事件不存在');
    db.prepare('UPDATE care_event SET raw_text = COALESCE(?, raw_text), verify_status = COALESCE(?, verify_status) WHERE id = ?').run(dto.rawText || null, dto.verifyStatus || null, eventId);
    return db.prepare('SELECT * FROM care_event WHERE id = ?').get(eventId);
  }

  deleteCareEvent(eventId: string, userId: string) {
    const db = getDb();
    const event = db.prepare('SELECT ce.* FROM care_event ce JOIN episode e ON ce.episode_id = e.id WHERE ce.id = ? AND e.user_id = ?').get(eventId, userId);
    if (!event) throw new NotFoundException('事件不存在');
    db.prepare('DELETE FROM care_event WHERE id = ?').run(eventId);
    return { deleted: true };
  }

  createSymptomLog(dto: { careEventId: string; sitMinutes?: number; plannedActivityDone?: string; sleepImpact?: number; topWorry?: string; legChange?: string }) {
    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO symptom_log (id, care_event_id, sit_minutes, planned_activity_done, sleep_impact, top_worry, leg_change) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, dto.careEventId, dto.sitMinutes ?? null, dto.plannedActivityDone || null, dto.sleepImpact ?? null, dto.topWorry || null, dto.legChange || '尚未确认',
    );
    return { id, careEventId: dto.careEventId, sitMinutes: dto.sitMinutes ?? null, plannedActivityDone: dto.plannedActivityDone || null, sleepImpact: dto.sleepImpact ?? null, topWorry: dto.topWorry || null, legChange: dto.legChange || '尚未确认' };
  }

  getTimeline(episodeId: string) {
    const db = getDb();
    const events = db.prepare(`
      SELECT ce.*, sl.sit_minutes, sl.planned_activity_done, sl.sleep_impact, sl.top_worry, sl.leg_change
      FROM care_event ce
      LEFT JOIN symptom_log sl ON ce.id = sl.care_event_id
      WHERE ce.episode_id = ?
      ORDER BY ce.occurred_at DESC
    `).all(episodeId);
    return events;
  }

  getTodayLog(userId: string) {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const episodes = db.prepare('SELECT id FROM episode WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as { id: string } | undefined;
    if (!episodes) return null;
    const log = db.prepare(`
      SELECT sl.* FROM symptom_log sl
      JOIN care_event ce ON sl.care_event_id = ce.id
      WHERE ce.episode_id = ? AND date(ce.occurred_at) = date(?)
      ORDER BY ce.occurred_at DESC LIMIT 1
    `).get(episodes.id, today);
    return log || null;
  }
}
