import { Inject, Injectable } from '@nestjs/common';
import Database from 'better-sqlite3';
import { APP_DB } from '../database/database.module';
import { EvidenceChunk } from './llm-adapter';

/** 证据检索：只在证据库内检索（关键词匹配，本地计算） */
@Injectable()
export class EvidenceRetrieval {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  /** 按关键词检索证据片段，只返回启用状态的证据 */
  search(query: string, limit = 8): EvidenceChunk[] {
    const tokens = (query.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z0-9/]{2,}/g) ?? []).filter(
      (t) => t.length >= 2,
    );
    if (tokens.length === 0) return [];
    const rows = this.appDb
      .prepare(
        `SELECT c.id, c.doc_id AS docId, d.title AS docTitle, d.source_type AS docSourceType,
                c.content, c.position
         FROM EVIDENCE_CHUNK c JOIN EVIDENCE_DOC d ON d.id = c.doc_id
         WHERE d.active = 1
         ORDER BY c.position ASC, c.rowid ASC`,
      )
      .all() as Array<{
      id: string;
      docId: string;
      docTitle: string;
      docSourceType: string;
      content: string;
      position: number;
    }>;
    const scored = rows
      .map((row) => {
        let score = 0;
        for (const token of tokens) {
          if (row.content.includes(token)) score += 1;
        }
        return { row, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored.map(({ row }) => ({
      id: row.id,
      docId: row.docId,
      docTitle: row.docTitle,
      docSourceType: row.docSourceType,
      content: row.content,
      position: row.position,
    }));
  }
}
