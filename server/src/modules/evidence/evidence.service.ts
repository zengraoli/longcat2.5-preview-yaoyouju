import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';

export interface EvidenceDocView {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string | null;
  license: string | null;
  verifiedAt: string | null;
  active: boolean;
  chunkCount: number;
}

@Injectable()
export class EvidenceService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly audit: AuditService,
  ) {}

  /** 证据文档列表 */
  list(): EvidenceDocView[] {
    return this.appDb
      .prepare(
        `SELECT d.id, d.title, d.source_type AS sourceType, d.source_url AS sourceUrl, d.license,
                d.verified_at AS verifiedAt, d.active,
                (SELECT COUNT(*) FROM EVIDENCE_CHUNK c WHERE c.doc_id = d.id) AS chunkCount
         FROM EVIDENCE_DOC d ORDER BY d.rowid ASC`,
      )
      .all()
      .map((r: { id: string; title: string; sourceType: string; sourceUrl: string | null; license: string | null; verifiedAt: string | null; active: number; chunkCount: number }) => ({
        id: r.id,
        title: r.title,
        sourceType: r.sourceType,
        sourceUrl: r.sourceUrl,
        license: r.license,
        verifiedAt: r.verifiedAt,
        active: !!r.active,
        chunkCount: r.chunkCount,
      }));
  }

  /** 创建证据文档并切分入库（按句切分） */
  create(actorId: string, input: {
    title: string;
    sourceType: string;
    sourceUrl?: string;
    license?: string;
    verifiedAt?: string;
    content: string;
  }) {
    if (!['指南', '研究', '审核科普'].includes(input.sourceType)) {
      throw new ConflictException('来源类型必须是：指南 / 研究 / 审核科普');
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.appDb
      .prepare(
        `INSERT INTO EVIDENCE_DOC (id, title, source_type, source_url, license, verified_at, active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
      )
      .run(id, input.title, input.sourceType, input.sourceUrl ?? null, input.license ?? null, input.verifiedAt ?? now.slice(0, 10));
    this.splitAndStore(id, input.content);
    this.audit.record({ actorId, action: 'evidence:create', target: id, diff: { title: input.title } });
    return { id, chunkCount: this.chunkCount(id) };
  }

  /** 切分入库管线状态（可查） */
  pipelineStatus() {
    return this.list().map((doc) => ({
      docId: doc.id,
      title: doc.title,
      status: doc.chunkCount > 0 ? '已入库' : '待切分',
      chunkCount: doc.chunkCount,
    }));
  }

  /** 停用影响预览：列出引用该证据的内容与分析 */
  impactPreview(docId: string) {
    const doc = this.appDb
      .prepare('SELECT id, title FROM EVIDENCE_DOC WHERE id = ?')
      .get(docId) as { id: string; title: string } | undefined;
    if (!doc) throw new NotFoundException('证据文档不存在');
    // 引用该证据的分析（通过 ANALYSIS_CITATION）
    const analyses = this.appDb
      .prepare(
        `SELECT DISTINCT c.analysis_id AS analysisId, a.episode_id AS episodeId
         FROM ANALYSIS_CITATION c JOIN ANALYSIS a ON a.id = c.analysis_id
         WHERE c.evidence_doc_id = ?`,
      )
      .all(docId) as Array<{ analysisId: string; episodeId: string }>;
    // 引用该证据的内容（通过 CONTENT_VERSION.based_on）
    const contents = this.appDb
      .prepare(
        `SELECT DISTINCT v.item_id AS itemId, i.title
         FROM CONTENT_VERSION v JOIN CONTENT_ITEM i ON i.id = v.item_id
         WHERE v.based_on = ?`,
      )
      .all(docId) as Array<{ itemId: string; title: string }>;
    return {
      docId,
      title: doc.title,
      analyses,
      contents,
      note: '停用后该证据不再被检索到，以上引用不会自动删除，但分析流水线不会再引用它。',
    };
  }

  /** 停用证据（不再被检索到） */
  deactivate(actorId: string, docId: string) {
    const doc = this.appDb
      .prepare('SELECT id FROM EVIDENCE_DOC WHERE id = ?')
      .get(docId) as { id: string } | undefined;
    if (!doc) throw new NotFoundException('证据文档不存在');
    this.appDb.prepare('UPDATE EVIDENCE_DOC SET active = 0 WHERE id = ?').run(docId);
    this.audit.record({ actorId, action: 'evidence:deactivate', target: docId });
    return { id: docId, active: false };
  }

  /** 核实 / 重新启用证据（记录核实日期并恢复启用） */
  verify(actorId: string, docId: string) {
    const doc = this.appDb
      .prepare('SELECT id FROM EVIDENCE_DOC WHERE id = ?')
      .get(docId) as { id: string } | undefined;
    if (!doc) throw new NotFoundException('证据文档不存在');
    this.appDb
      .prepare('UPDATE EVIDENCE_DOC SET active = 1, verified_at = ? WHERE id = ?')
      .run(new Date().toISOString().slice(0, 10), docId);
    this.audit.record({ actorId, action: 'evidence:verify', target: docId });
    return { id: docId, active: true };
  }

  /** 本地检索：只检索启用状态的证据 */
  search(query: string, limit = 8) {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return [];
    const rows = this.appDb
      .prepare(
        `SELECT c.id, c.doc_id AS docId, d.title AS docTitle, c.content, c.position
         FROM EVIDENCE_CHUNK c JOIN EVIDENCE_DOC d ON d.id = c.doc_id
         WHERE d.active = 1 ORDER BY c.position ASC, c.rowid ASC`,
      )
      .all() as Array<{ id: string; docId: string; docTitle: string; content: string; position: number }>;
    return rows
      .map((row) => {
        let score = 0;
        for (const token of tokens) {
          if (row.content.includes(token)) score += 1;
        }
        return { row, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ row }) => ({ id: row.id, docId: row.docId, docTitle: row.docTitle, content: row.content, position: row.position }));
  }

  /**
   * 分词：长中文串（如“报告里的术语是什么意思”）拆成 2–3 字滑窗 token，
   * 避免整句作为一个 token 导致检索不到任何证据。
   */
  private tokenize(query: string): string[] {
    const raw = (query.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z0-9/]{2,}/g) ?? []).filter((t) => t.length >= 2);
    const tokens: string[] = [];
    for (const run of raw) {
      if (/^[A-Za-z0-9/]+$/.test(run)) {
        tokens.push(run);
        continue;
      }
      if (run.length <= 4) {
        tokens.push(run);
        continue;
      }
      for (let i = 0; i + 2 <= run.length; i++) {
        tokens.push(run.slice(i, i + 2));
        if (i + 3 <= run.length) tokens.push(run.slice(i, i + 3));
      }
    }
    return tokens;
  }

  /** 按句切分并入库 */
  private splitAndStore(docId: string, content: string) {
    const sentences = content
      .split(/(?<=[。；;])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const insert = this.appDb.prepare(
      'INSERT INTO EVIDENCE_CHUNK (id, doc_id, content, position) VALUES (?, ?, ?, ?)',
    );
    sentences.forEach((sentence, index) => {
      insert.run(crypto.randomUUID(), docId, sentence, index);
    });
  }

  private chunkCount(docId: string): number {
    return (this.appDb.prepare('SELECT COUNT(*) AS c FROM EVIDENCE_CHUNK WHERE doc_id = ?').get(docId) as { c: number }).c;
  }
}
