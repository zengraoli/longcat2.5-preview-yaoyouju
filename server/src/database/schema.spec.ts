import Database from 'better-sqlite3';
import { initDatabase } from './seed';
import { decryptField } from './crypto';

function tmpDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

describe('数据模型与种子数据', () => {
  it('启动时自动建表并写入种子数据，重复启动不重复写入', () => {
    const appDb = tmpDb();
    const identityDb = tmpDb();
    initDatabase(appDb, identityDb);
    initDatabase(appDb, identityDb); // 第二次调用

    const count = (sql: string) => (appDb.prepare(sql).get() as { c: number }).c;
    expect(count('SELECT COUNT(*) AS c FROM USER')).toBe(2);
    expect(count('SELECT COUNT(*) AS c FROM EPISODE')).toBe(2);
    expect(count('SELECT COUNT(*) AS c FROM CARE_EVENT')).toBe(5);
    expect(count('SELECT COUNT(*) AS c FROM REPORT')).toBe(2);
    expect(count('SELECT COUNT(*) AS c FROM ANALYSIS')).toBe(1);
    expect(count('SELECT COUNT(*) AS c FROM ANALYSIS_CITATION')).toBe(3);
    expect(count('SELECT COUNT(*) AS c FROM CONTENT_ITEM')).toBe(10);
    expect(count('SELECT COUNT(*) AS c FROM EVIDENCE_DOC')).toBe(6);
    expect(count('SELECT COUNT(*) AS c FROM EVIDENCE_CHUNK')).toBeGreaterThanOrEqual(10);
    expect(count('SELECT COUNT(*) AS c FROM ROLE')).toBe(5);
    expect(count('SELECT COUNT(*) AS c FROM ADMIN_USER')).toBe(5);
    expect(count('SELECT COUNT(*) AS c FROM FEATURE_SWITCH')).toBe(4);
    expect(count('SELECT COUNT(*) AS c FROM EVAL_SET')).toBe(1);
    expect(count('SELECT COUNT(*) AS c FROM MODEL_RELEASE')).toBe(1);
    expect(count('SELECT COUNT(*) AS c FROM CONSENT')).toBe(4);
    expect(count('SELECT COUNT(*) AS c FROM FOLLOWUP_SUMMARY')).toBe(1);
    appDb.close();
    identityDb.close();
  });

  it('身份库中的手机号为密文，可解密还原', () => {
    const appDb = tmpDb();
    const identityDb = tmpDb();
    initDatabase(appDb, identityDb);

    const row = identityDb.prepare('SELECT * FROM IDENTITY_PROFILE LIMIT 1').get() as {
      user_id: string;
      phone_enc: string;
      real_name_enc: string;
    };
    expect(row.phone_enc).not.toMatch(/^1\d{10}$/);
    expect(row.phone_enc).not.toContain('13800000001');
    expect(decryptField(row.phone_enc)).toMatch(/^1\d{10}$/);
    expect(decryptField(row.real_name_enc)).toBe('演示甲');
    appDb.close();
    identityDb.close();
  });

  it('内容库覆盖各审核状态', () => {
    const appDb = tmpDb();
    const identityDb = tmpDb();
    initDatabase(appDb, identityDb);
    const rows = appDb
      .prepare('SELECT current_status AS s FROM CONTENT_ITEM')
      .all() as Array<{ s: string }>;
    const statuses = new Set(rows.map((r) => r.s));
    for (const s of ['草稿', '待审', '已审定', '已发布', '已撤回']) {
      expect(statuses.has(s)).toBe(true);
    }
    appDb.close();
    identityDb.close();
  });
});
