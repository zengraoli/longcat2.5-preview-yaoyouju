import { Logger } from '@nestjs/common';
import Database from 'better-sqlite3';
import { initDatabase } from '../../database/seed';
import { AuthService } from './auth.service';
import { ConsentGuard } from './consent.guard';

function freshDbs() {
  const appDb = new Database(':memory:');
  const identityDb = new Database(':memory:');
  appDb.pragma('journal_mode = WAL');
  appDb.pragma('foreign_keys = ON');
  initDatabase(appDb, identityDb);
  return { appDb, identityDb };
}

describe('用户登录与同意管理', () => {
  let appDb: Database.Database;
  let identityDb: Database.Database;
  let auth: AuthService;

  beforeEach(() => {
    ({ appDb, identityDb } = freshDbs());
    auth = new AuthService(appDb, identityDb);
  });

  afterEach(() => {
    appDb.close();
    identityDb.close();
  });

  it('发送验证码只写日志且手机号脱敏', () => {
    const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const result = auth.sendSmsCode('13900000001');
    expect(result.sent).toBe(true);
    const logged = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(logged).not.toContain('13900000001');
    expect(logged).toContain('139****0001');
    spy.mockRestore();
  });

  it('验证码错误时登录失败', () => {
    expect(() => auth.login('13900000001', '000000')).toThrow('验证码错误');
  });

  it('登录成功返回 token 与三项同意记录', () => {
    const result = auth.login('13900000001', '123456');
    expect(result.token).toBeTruthy();
    expect(result.user.id).toBeTruthy();
    expect(result.consents).toHaveLength(3);
    expect(result.consents.map((c) => c.scope)).toEqual(['健康信息处理', '分享', '产品改进']);
    expect(result.consents.every((c) => !c.granted)).toBe(true);
    // 重复登录返回同一用户
    const again = auth.login('13900000001', '123456');
    expect(again.user.id).toBe(result.user.id);
  });

  it('未同意健康信息处理时 ConsentGuard 拒绝', () => {
    const { user } = auth.login('13900000001', '123456');
    const reflector = { getAllAndOverride: () => '健康信息处理' };
    const guard = new ConsentGuard(auth, reflector as never);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { userId: user.id } }) }),
    } as never;
    expect(() => guard.canActivate(ctx)).toThrow('未同意');
  });

  it('撤回同意后相关接口立即拒绝', () => {
    const { user } = auth.login('13900000001', '123456');
    auth.setConsent(user.id, '健康信息处理', true);
    expect(auth.hasConsent(user.id, '健康信息处理')).toBe(true);
    auth.setConsent(user.id, '健康信息处理', false);
    expect(auth.hasConsent(user.id, '健康信息处理')).toBe(false);
    const reflector = { getAllAndOverride: () => '健康信息处理' };
    const guard = new ConsentGuard(auth, reflector as never);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { userId: user.id } }) }),
    } as never;
    expect(() => guard.canActivate(ctx)).toThrow('未同意');
  });

  it('同意记录可查：撤回后 revokedAt 有值', () => {
    const { user } = auth.login('13900000001', '123456');
    auth.setConsent(user.id, '产品改进', true);
    let consents = auth.getConsents(user.id);
    let target = consents.find((c) => c.scope === '产品改进');
    expect(target?.granted).toBe(true);
    auth.setConsent(user.id, '产品改进', false);
    consents = auth.getConsents(user.id);
    target = consents.find((c) => c.scope === '产品改进');
    expect(target?.granted).toBe(false);
    expect(target?.revokedAt).toBeTruthy();
  });
});
