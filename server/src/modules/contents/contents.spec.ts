import Database from 'better-sqlite3';
import { initDatabase } from '../../database/seed';
import { AuditService } from '../audit/audit.service';
import { ContentsService } from './contents.service';
import { transition } from './state-machine';

describe('内容审核状态机（单元）', () => {
  it('合法流转', () => {
    expect(transition('草稿', '提交审核')).toBe('待审');
    expect(transition('待审', '通过')).toBe('已审定');
    expect(transition('待审', '退回')).toBe('草稿');
    expect(transition('已审定', '发布')).toBe('已发布');
    expect(transition('已发布', '撤回')).toBe('已撤回');
    expect(transition('已发布', '下线')).toBe('已下线');
    expect(transition('已发布', '更正')).toBe('更正中');
    expect(transition('更正中', '提交审核')).toBe('待审');
    expect(transition('已撤回', '更正')).toBe('更正中');
    expect(transition('已下线', '更正')).toBe('更正中');
  });

  it('非法流转返回 null', () => {
    expect(transition('草稿', '发布')).toBeNull();
    expect(transition('待审', '发布')).toBeNull();
    expect(transition('已发布', '提交审核')).toBeNull();
    expect(transition('已撤回', '发布')).toBeNull();
    expect(transition('已下线', '发布')).toBeNull();
  });
});

describe('内容库与审核流程', () => {
  let appDb: Database.Database;
  let identityDb: Database.Database;
  let contents: ContentsService;
  const actor1 = 'admin-ops';
  const actor2 = 'admin-clinical';

  beforeEach(() => {
    appDb = new Database(':memory:');
    identityDb = new Database(':memory:');
    appDb.pragma('journal_mode = WAL');
    appDb.pragma('foreign_keys = ON');
    initDatabase(appDb, identityDb);
    contents = new ContentsService(appDb, new AuditService(appDb));
  });

  afterEach(() => {
    appDb.close();
    identityDb.close();
  });

  it('创建 → 提交审核 → 通过 → 发布（双人确认）', () => {
    const item = contents.createItem(actor1, { type: '视频', title: '测试内容', script: '脚本' });
    expect(item.currentStatus).toBe('草稿');
    expect(contents.transitionItem(actor1, item.id, '提交审核').currentStatus).toBe('待审');
    expect(contents.transitionItem(actor2, item.id, '通过').currentStatus).toBe('已审定');
    // 发布：第一个审核人发起
    const first = contents.publish(actor2, item.id);
    expect(first.status).toBe('待第二人确认');
    // 同一审核人不能确认
    expect(() => contents.publish(actor2, item.id)).toThrow('双人确认');
    // 第二个审核人确认 → 已发布
    const second = contents.publish(actor1, item.id);
    expect(second.status).toBe('已发布');
    expect(second.version).toBe(1);
  });

  it('非法流转返回错误', () => {
    const item = contents.createItem(actor1, { type: '视频', title: '测试内容' });
    expect(() => contents.transitionItem(actor1, item.id, '发布')).toThrow('非法状态流转');
  });

  it('一键下线后用户端接口立即不可见，并能定位引用页面', () => {
    const item = contents.createItem(actor1, { type: '视频', title: '测试内容' });
    contents.transitionItem(actor1, item.id, '提交审核');
    contents.transitionItem(actor2, item.id, '通过');
    contents.publish(actor2, item.id);
    contents.publish(actor1, item.id);
    // 用户端可见（种子数据 5 条已发布 + 本条）
    expect(contents.listPublished().length).toBe(6);
    // 一键下线
    const result = contents.offline(actor1, item.id);
    expect(result.status).toBe('已下线');
    // 用户端立即不可见（只剩种子数据 5 条）
    expect(contents.listPublished().length).toBe(5);
    // 管理端仍可见（状态为已下线）
    const all = contents.listAll() as Array<{ id: string; currentStatus: string }>;
    expect(all.find((i) => i.id === item.id)?.currentStatus).toBe('已下线');
  });

  it('审核记录与版本链可查', () => {
    const item = contents.createItem(actor1, { type: '视频', title: '测试内容', script: '脚本' });
    contents.transitionItem(actor1, item.id, '提交审核');
    contents.transitionItem(actor2, item.id, '通过', '表述准确');
    const records = contents.reviewRecords(item.id);
    expect(records.length).toBe(2);
    const versions = contents.versions(item.id);
    expect(versions.length).toBe(1);
  });
});
