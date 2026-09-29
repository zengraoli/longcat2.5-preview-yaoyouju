import Database from 'better-sqlite3';
import { initDatabase } from '../../database/seed';
import { AuditService } from '../audit/audit.service';
import { EvidenceService } from './evidence.service';

describe('医学证据库', () => {
  let appDb: Database.Database;
  let identityDb: Database.Database;
  let evidence: EvidenceService;

  beforeEach(() => {
    appDb = new Database(':memory:');
    identityDb = new Database(':memory:');
    appDb.pragma('journal_mode = WAL');
    appDb.pragma('foreign_keys = ON');
    initDatabase(appDb, identityDb);
    evidence = new EvidenceService(appDb, new AuditService(appDb));
  });

  afterEach(() => {
    appDb.close();
    identityDb.close();
  });

  it('创建证据文档并切分入库，管线状态可查', () => {
    const doc = evidence.create('admin-tech', {
      title: '测试证据',
      sourceType: '指南',
      content: '第一条。第二条。第三条。',
    });
    expect(doc.chunkCount).toBe(3);
    const pipeline = evidence.pipelineStatus();
    const target = pipeline.find((p: { docId: string }) => p.docId === doc.id);
    expect(target?.status).toBe('已入库');
    expect(target?.chunkCount).toBe(3);
  });

  it('本地检索只返回启用证据', () => {
    const doc = evidence.create('admin-tech', {
      title: '腰椎证据',
      sourceType: '审核科普',
      content: 'L5/S1 是腰椎和骶椎的编号。',
    });
    const hits = evidence.search('L5/S1');
    expect(hits.length).toBeGreaterThan(0);
    // 停用后不再被检索到（被停用文档的片段不在结果中）
    evidence.deactivate('admin-tech', doc.id);
    const after = evidence.search('L5/S1');
    expect(after.find((h: { docId: string }) => h.docId === doc.id)).toBeUndefined();
  });

  it('停用影响预览：列出引用该证据的内容与分析', () => {
    const doc = evidence.create('admin-tech', {
      title: '引用测试证据',
      sourceType: '研究',
      content: '影像学表现与症状并不完全一致。',
    });
    // 种子分析 analysis-1 引用了 doc-research-2，这里验证影响预览能列出
    const impact = evidence.impactPreview('doc-research-2');
    expect(impact.analyses.length).toBeGreaterThan(0);
    expect(impact.analyses[0].analysisId).toBe('analysis-1');
  });

  it('来源类型校验', () => {
    expect(() =>
      evidence.create('admin-tech', { title: 'x', sourceType: '博客', content: '内容' }),
    ).toThrow('来源类型');
  });
});
