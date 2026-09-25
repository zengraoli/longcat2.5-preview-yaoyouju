import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class EvidenceService {
  createDoc(dto: { title: string; sourceType: string; sourceUrl?: string; license?: string; verifiedAt?: string; chunks?: string[] }) {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO evidence_doc (id, title, source_type, source_url, license, verified_at, active) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, dto.title, dto.sourceType, dto.sourceUrl || null, dto.license || null, dto.verifiedAt || now, 1,
    );
    if (dto.chunks && dto.chunks.length > 0) {
      const insertChunk = db.prepare('INSERT INTO evidence_chunk (id, doc_id, content, embedding, position) VALUES (?, ?, ?, ?, ?)');
      dto.chunks.forEach((chunk, index) => {
        insertChunk.run(randomUUID(), id, chunk, null, index + 1);
      });
    }
    return { id, ...dto, active: true };
  }

  getAllDocs() {
    const db = getDb();
    return db.prepare('SELECT * FROM evidence_doc ORDER BY verified_at DESC').all();
  }

  getDoc(docId: string) {
    const db = getDb();
    const doc = db.prepare('SELECT * FROM evidence_doc WHERE id = ?').get(docId) as any | undefined;
    if (!doc) throw new NotFoundException('证据文档不存在');
    const chunks = db.prepare('SELECT * FROM evidence_chunk WHERE doc_id = ? ORDER BY position').all(docId);
    return { ...doc, chunks };
  }

  toggleDoc(dto: { docId: string; active: boolean }) {
    const db = getDb();
    const doc = db.prepare('SELECT * FROM evidence_doc WHERE id = ?').get(dto.docId);
    if (!doc) throw new NotFoundException('证据文档不存在');
    db.prepare('UPDATE evidence_doc SET active = ? WHERE id = ?').run(dto.active ? 1 : 0, dto.docId);
    return { toggled: true, docId: dto.docId, active: dto.active };
  }

  search(query: string) {
    const db = getDb();
    const docs = db.prepare('SELECT * FROM evidence_doc WHERE active = 1').all() as any[];
    const chunks = db.prepare(`
      SELECT ec.*, ed.title as doc_title FROM evidence_chunk ec
      JOIN evidence_doc ed ON ec.doc_id = ed.id
      WHERE ed.active = 1 AND ec.content LIKE ?
    `).all(`%${query}%`) as any[];

    const docIds = [...new Set(chunks.map((c) => c.doc_id))];
    const matchedDocs = docs.filter((d) => docIds.includes(d.id));

    return matchedDocs.map((doc) => ({
      ...doc,
      matchedChunks: chunks.filter((c) => c.doc_id === doc.id),
    }));
  }

  getDeactivationImpact(docId: string) {
    const db = getDb();
    const citations = db.prepare(`
      SELECT ac.*, a.id as analysis_id, a.episode_id FROM analysis_citation ac
      JOIN analysis a ON ac.analysis_id = a.id
      WHERE ac.evidence_doc_id = ?
    `).all(docId) as any[];

    const contentVersions = db.prepare(`
      SELECT cv.*, ci.title as content_title FROM content_version cv
      JOIN content_item ci ON cv.item_id = ci.id
      WHERE ci.id IN (
        SELECT target_id FROM review_record WHERE comment LIKE ?
      )
    `).all(`%${docId}%`) as any[];

    return {
      docId,
      affectedAnalyses: citations.length,
      affectedContentVersions: contentVersions.length,
      analysisIds: citations.map((c) => c.analysis_id),
    };
  }
}
