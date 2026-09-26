import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContentService {
  constructor(private readonly auditService: AuditService) {}

  private readonly VALID_TRANSITIONS: Record<string, string[]> = {
    '草稿': ['待医学审核'],
    '待医学审核': ['草稿', '已审定'],
    '已审定': ['已发布'],
    '已发布': ['已撤回或已下线', '更正中'],
    '更正中': ['待医学审核'],
    '已撤回或已下线': ['更正中'],
  };

  createContent(operatorId: string, dto: { type: string; title: string; applicableScope?: string; notApplicable?: string; script?: string; subtitleText?: string; evidenceIds?: string[] }) {
    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO content_item (id, type, title, applicable_scope, not_applicable, current_status, offline_switch) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, dto.type, dto.title, dto.applicableScope || null, dto.notApplicable || null, '草稿', 0,
    );
    this.auditService.log('system', 'content.created', id, { title: dto.title });
    return { id, ...dto, currentStatus: '草稿' };
  }

  submitForReview(dto: { contentId: string; evidenceIds: string[] }, operatorId?: string) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');
    if (content.current_status !== '草稿' && content.current_status !== '更正中') {
      throw new BadRequestException('只有草稿或更正中状态可提交审核');
    }
    db.prepare('UPDATE content_item SET current_status = ? WHERE id = ?').run('待医学审核', dto.contentId);
    this.auditService.log(operatorId || 'system', 'content.submitted', dto.contentId, { status: '待医学审核' });
    return { submitted: true, contentId: dto.contentId, status: '待医学审核' };
  }

  /** 已下线内容申请恢复：已撤回或已下线 → 更正中 */
  restore(dto: { contentId: string }, operatorId?: string) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');
    if (content.current_status !== '已撤回或已下线') throw new BadRequestException('只有已下线状态可申请恢复');
    db.prepare('UPDATE content_item SET current_status = ?, offline_switch = 0 WHERE id = ?').run('更正中', dto.contentId);
    this.auditService.log(operatorId || 'system', 'content.restore', dto.contentId, { status: '更正中' });
    return { restored: true, contentId: dto.contentId, status: '更正中' };
  }

  reviewDecision(dto: { contentId: string; decision: string; comment?: string; reviewerId?: string }) {
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

    this.auditService.log(dto.reviewerId || 'system', dto.decision === '通过' ? 'content.review.approved' : 'content.review.returned', dto.contentId, { decision: dto.decision });

    return { reviewed: true, contentId: dto.contentId, newStatus: nextStatus };
  }

  publish(dto: { contentId: string; reviewerId?: string }) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');
    if (content.current_status !== '已审定') throw new BadRequestException('只有已审定状态可发布');

    const version = Math.floor(Math.random() * 3) + 1;
    db.prepare('INSERT INTO content_version (id, item_id, version, script, asset_key, subtitle_text, model_asset_version, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      randomUUID(), dto.contentId, version, content.script || '', `assets/${dto.contentId}/v${version}`, content.subtitle_text || '', `av-v${version}`, new Date().toISOString(),
    );
    db.prepare('UPDATE content_item SET current_status = ? WHERE id = ?').run('已发布', dto.contentId);

    this.auditService.log(dto.reviewerId || 'system', 'content.published', dto.contentId, { version });

    return { published: true, contentId: dto.contentId, version };
  }

  offline(dto: { contentId: string; reason?: string; operatorId?: string }) {
    const db = getDb();
    const content = db.prepare('SELECT * FROM content_item WHERE id = ?').get(dto.contentId) as any | undefined;
    if (!content) throw new NotFoundException('内容不存在');

    db.prepare('UPDATE content_item SET current_status = ?, offline_switch = 1 WHERE id = ?').run('已撤回或已下线', dto.contentId);
    this.auditService.log(dto.operatorId || 'system', 'content.offline', dto.contentId, { reason: dto.reason });

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

  /**
   * 后台内容库列表：含最新版本与最近审核记录。
   */
  getAllContent() {
    const db = getDb();
    const items = db.prepare('SELECT * FROM content_item ORDER BY rowid DESC').all() as any[];
    return items.map((item) => {
      const latestVersion = db.prepare('SELECT * FROM content_version WHERE item_id = ? ORDER BY version DESC LIMIT 1').get(item.id) as any | undefined;
      const latestReview = db.prepare('SELECT * FROM review_record WHERE target_id = ? ORDER BY reviewed_at DESC LIMIT 1').get(item.id) as any | undefined;
      return {
        ...item,
        latestVersion: latestVersion ? `v${latestVersion.version}` : null,
        reviewer: latestReview?.reviewer_id || null,
        reviewDecision: latestReview?.decision || null,
      };
    });
  }

  /** 用户端内容详情：仅已发布内容 */
  getPublishedContentById(contentId: string) {
    const db = getDb();
    const content = db.prepare("SELECT * FROM content_item WHERE id = ? AND current_status = '已发布' AND offline_switch = 0").get(contentId) as any | undefined;
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
