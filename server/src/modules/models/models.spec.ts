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
    // 未运行评测时发布被拒绝（4001 评测门禁未通过）
    expect(() => models.publish('admin-tech', release.id, ['model:release'])).toThrow('评测门禁');
    // 运行评测
    const runs = models.runEval('admin-tech', release.id);
    expect(runs.length).toBe(4);
    // 手动构造一个失败用例演示门禁阻断
    appDb.prepare("UPDATE EVAL_RUN SET result = '阻断发布', metrics = '{\"通过率\":0.75}' WHERE model_release_id = ? AND eval_set_id = 'evalset-3'").run(release.id);
    expect(() => models.publish('admin-tech', release.id, ['model:release'])).toThrow('阻断发布');
  });

  it('门禁全部通过时发布成功（双人确认），可回滚', () => {
    // 清除种子里的不通过用例（模拟全部修复后重测），使门禁全部通过
    appDb.prepare("DELETE FROM EVAL_CASE WHERE result = '不通过'").run();
    // 先发布一个“好”版本 A（可回滚的目标）
    const releaseA = models.createRelease('admin-tech', {
      modelName: 'local-mock-v3',
      promptVersion: 'prompt-p2',
      retrievalStrategy: 'keyword-v2',
      contentLibVersion: 'content-c3',
    });
    models.runEval('admin-tech', releaseA.id);
    models.publish('admin-tech', releaseA.id, ['model:release']);
    const publishedA = models.publish('admin-super', releaseA.id, ['model:confirm']);
    expect(publishedA.status).toBe('生效');
    // 再发布版本 B（A 被归档）
    const release = models.createRelease('admin-tech', {
      modelName: 'local-mock-v4',
      promptVersion: 'prompt-p2',
      retrievalStrategy: 'keyword-v2',
      contentLibVersion: 'content-c4',
    });
    models.runEval('admin-tech', release.id);
    // 技术负责人发起
    const first = models.publish('admin-tech', release.id, ['model:release']);
    expect(first.status).toBe('待第二人确认');
    // 同一操作人不能确认
    expect(() => models.publish('admin-tech', release.id, ['model:release', 'model:confirm'])).toThrow('双人确认');
    // 超管确认 → 生效
    const published = models.publish('admin-super', release.id, ['model:confirm']);
    expect(published.status).toBe('生效');
    // 回滚 B：技术发起 + 超管确认 → 恢复 A 为生效
    const rbFirst = models.rollback('admin-tech', release.id, ['model:release']);
    expect(rbFirst.status).toBe('待第二人确认');
    const rolledBack = models.rollback('admin-super', release.id, ['model:confirm']);
    expect(rolledBack.status).toBe('已回滚');
    expect(rolledBack.restored).toBe(releaseA.id);
    // 回滚后只有 A 一个生效版本
    const activeCount = (
      appDb.prepare("SELECT COUNT(*) AS c FROM MODEL_RELEASE WHERE status = '生效'").get() as { c: number }
    ).c;
    expect(activeCount).toBe(1);
  });

  it('未评测的候选不能被回滚激活', () => {
    // release-1 是生效版本；新建一个未评测的候选
    const candidate = models.createRelease('admin-tech', {
      modelName: 'local-mock-v4',
      promptVersion: 'prompt-p4',
      retrievalStrategy: 'keyword-v4',
      contentLibVersion: 'content-c4',
    });
    // 回滚生效版本：没有“已通过全部评测”的其他版本（候选未评测）→ 拒绝
    expect(() => models.rollback('admin-tech', 'release-1', ['model:release'])).toThrow('没有可回滚');
    expect(candidate.status).toBe('候选');
  });

  it('失败用例去标识化', () => {
    const release = models.createRelease('admin-tech', {
      modelName: 'local-mock-v4',
      promptVersion: 'prompt-p4',
      retrievalStrategy: 'keyword-v4',
      contentLibVersion: 'content-c4',
    });
    models.runEval('admin-tech', release.id);
    // 手动构造一个失败用例
    appDb.prepare("UPDATE EVAL_RUN SET result = '阻断发布', metrics = '{\"失败用例\":[{\"用例\":\"去标识化用例\",\"期望\":\"不作诊断\",\"实际\":\"给出了诊断性表述\",\"判定\":\"不通过\"}]}' WHERE model_release_id = ? AND eval_set_id = 'evalset-3'").run(release.id);
    const runs = models.listEvalRuns(release.id);
    const failed = runs.find((r) => r.result === '阻断发布');
    expect(failed).toBeTruthy();
    const metrics = (failed?.metrics ?? {}) as { 失败用例?: Array<Record<string, string>> };
    // 失败用例不包含真实用户信息
    const text = JSON.stringify(metrics.失败用例);
    expect(text).not.toMatch(/1\d{10}/);
    expect(text).toContain('去标识化用例');
  });
});
