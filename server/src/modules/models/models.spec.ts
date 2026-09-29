import Database from 'better-sqlite3';
import { initDatabase } from '../../database/seed';
import { AuditService } from '../audit/audit.service';
import { ModelsService } from './models.service';

describe('模型发布与评测', () => {
  let appDb: Database.Database;
  let identityDb: Database.Database;
  let models: ModelsService;

  beforeEach(() => {
    appDb = new Database(':memory:');
    identityDb = new Database(':memory:');
    appDb.pragma('journal_mode = WAL');
    appDb.pragma('foreign_keys = ON');
    initDatabase(appDb, identityDb);
    models = new ModelsService(appDb, new AuditService(appDb));
  });

  afterEach(() => {
    appDb.close();
    identityDb.close();
  });

  it('发布组合：候选 → 评测门禁 → 灰度 → 生效', () => {
    const release = models.createRelease('admin-tech', {
      modelName: 'local-mock-v2',
      promptVersion: 'prompt-p2',
      retrievalStrategy: 'keyword-v2',
      contentLibVersion: 'content-c2',
    });
    expect(release.status).toBe('候选');
    // 未运行评测时发布被拒绝
    expect(() => models.publish('admin-tech', release.id)).toThrow('评测门禁');
    // 运行评测
    const runs = models.runEval('admin-tech', release.id);
    expect(runs.length).toBe(4);
    // 左右侧混淆通过率 0.75 < 0.8 → 阻断发布
    const blocked = runs.find((r) => r.evalSetName === '左右侧混淆');
    expect(blocked?.result).toBe('阻断发布');
    expect(() => models.publish('admin-tech', release.id)).toThrow('阻断发布');
  });

  it('门禁全部通过时发布成功，可回滚', () => {
    const release = models.createRelease('admin-tech', {
      modelName: 'local-mock-v3',
      promptVersion: 'prompt-p3',
      retrievalStrategy: 'keyword-v3',
      contentLibVersion: 'content-c3',
    });
    // 手动把左右侧混淆的评测结果改为通过（模拟修复后重测）
    models.runEval('admin-tech', release.id);
    appDb.prepare("UPDATE EVAL_RUN SET result = '通过', metrics = '{\"通过率\":1}' WHERE model_release_id = ? AND eval_set_id = 'evalset-3'").run(release.id);
    const published = models.publish('admin-tech', release.id);
    expect(published.status).toBe('生效');
    const rolledBack = models.rollback('admin-tech', release.id);
    expect(rolledBack.status).toBe('已回滚');
  });

  it('失败用例去标识化', () => {
    const release = models.createRelease('admin-tech', {
      modelName: 'local-mock-v4',
      promptVersion: 'prompt-p4',
      retrievalStrategy: 'keyword-v4',
      contentLibVersion: 'content-c4',
    });
    const runs = models.runEval('admin-tech', release.id);
    const failed = runs.find((r) => r.result === '阻断发布');
    expect(failed).toBeTruthy();
    const metrics = failed?.metrics as { 失败用例: Array<Record<string, string>> };
    // 失败用例不包含真实用户信息
    const text = JSON.stringify(metrics.失败用例);
    expect(text).not.toMatch(/1\d{10}/);
    expect(text).toContain('去标识化用例');
  });
});
