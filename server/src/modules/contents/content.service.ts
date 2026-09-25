import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class ContentService {
  private readonly VALID_TRANSITIONS: Record<string, string[]> = {
    '草稿': ['待医学审核'],
    '待医学审核': ['草稿', '已审定'],
    '已审定': ['已发布'],
    '已发布': ['已撤回或已下线', '更正中'],
    '更正中': ['待医学审核'],
    '已撤回或已下线': ['更正中'],
  };

  createContent(dto: { type: string; title: string; applicableScope?: string; notApplicable?: string; script?: string; subtitleText?: string; evidenceIds?: string[] }) {
    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO content_item (id, type, title, applicable_scope, not_applicable, current_status, offline_switch) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, dto.type, dto.title, dto.applicableScope || null, dto.notApplicable || null, '草稿', 0,
    );
    return { id, ...dto, currentStatus: '草稿' };
  }

  submitForReview(dto: { contentId: string; evidenceIds: string[] }) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');
    if (content.current_status !== '草稿') throw new BadRequestException('只有草稿状态可提交审核');
    db.prepare('UPDATE content_item SET current_status = ? WHERE id = ?').run('待医学审核', dto.contentId);
    return { submitted: true, contentId: dto.contentId, status: '待医学审核' };
  }

  reviewDecision(dto: { contentId: string; decision: string; comment?: string; reviewerId: string }) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');

    const validNext = this.VALID_TRANSITIONS[content.current_status] || [];
    let nextStatus: string;
    if (dto.decision === '通过') {
      nextStatus = '已审定';
    } else if (dto.decision === '退回') {
      nextStatus = '草稿';
    } else {
      throw new BadRequestException('无效的审核决定');
    }

    if (!validNext.includes(nextStatus)) {
      throw new BadRequestException(`非法流转: ${content.current_status} -> ${nextStatus}`);
    }

    db.prepare('UPDATE content_item SET current_status = ? WHERE id = ?').run(nextStatus, dto.contentId);
    db.prepare('INSERT INTO review_record (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      randomUUID(), dto.contentId, 'content_item', dto.reviewerId, dto.decision, '医学准确性', dto.comment || null, new Date().toISOString(),
    );

    return { reviewed: true, contentId: dto.contentId, newStatus: nextStatus };
  }

  publish(dto: { contentId: string; reviewerId: string }) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');
    if (content.current_status !== '已审定') throw new BadRequestException('只有已审定状态可发布');

    const version = Math.floor(Math.random() * 3) + 1;
    db.prepare('INSERT INTO content_version (id, item_id, version, script, asset_key, subtitle_text, model_asset_version, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      randomUUID(), dto.contentId, version, content.script || '', `assets/${dto.contentId}/v${version}`, content.subtitle_text || '', `av-v${version}`, new Date().toISOString(),
    );
    db.prepare('UPDATE content_item SET current_status = ? WHERE id = ?').run('已发布', dto.contentId);

    db.prepare('INSERT INTO audit_log (id, actor_id, action, target, diff, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), dto.reviewerId, 'content.published', dto.contentId, JSON.stringify({ version }), new Date().toISOString(),
    );

    return { published: true, contentId: dto.contentId, version };
  }

  offline(dto: { contentId: string; reason?: string; operatorId: string }) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');

    db.prepare('UPDATE content_item SET current_status = ?, offline_switch = 1 WHERE id = ?').run('已撤回或已下线', dto.contentId);
    db.prepare('INSERT INTO audit_log (id, actor_id, action, target, diff, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), dto.operatorId, 'content.offline', dto.contentId, JSON.stringify({ reason: dto.reason }), new Date().toISOString(),
    );

    const citations = db.prepare(`
      SELECT DISTINCT a.episode_id FROM analysis a
      JOIN analysis_citation ac ON a.id = ac.analysis_id
      WHERE ac.evidence_doc_id IN (SELECT value FROM json_each(?))
    `).all(JSON.stringify([dto.contentId]));

    return { offline: true, contentId: dto.contentId, affectedEpisodes: citations.length };
  }

  getPublishedContent() {
    const db = getDb();
    return db.prepare("SELECT * FROM content_item WHERE current_status = '已发布' AND offline_switch = 0").all();
  }

  getContentById(contentId: string) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');
    const versions = db.prepare('SELECT * FROM content_version WHERE item_id = ? ORDER BY version DESC').all(contentId);
    const reviews = db.prepare('SELECT * FROM review_record WHERE target_id = ? ORDER BY reviewed_at DESC').all(contentId);
    return { ...content, versions, reviews };
  }

  getRecommendations(userId: string) {
    const db = getDb();
    const published = db.prepare("SELECT * FROM content_item WHERE current_status = '已发布' AND offline_switch = 0").all() as any[];
    return published.map((item) => ({
      ...item,
      recommendReason: '基于您的病情推荐',
    }));
  }
}
