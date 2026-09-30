import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

describe('后台账号、权限与审计', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const appDb = new Database(':memory:');
    const identityDb = new Database(':memory:');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_DB)
      .useValue(appDb)
      .overrideProvider(IDENTITY_DB)
      .useValue(identityDb)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('后台登录：账号密码 + TOTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/login')
      .send({ name: '技术-程', password: 'Admin@123456', totp: '123456' })
      .expect(201);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.roleName).toBe('技术');
  });

  it('TOTP 错误时登录失败', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/login')
      .send({ name: '技术-程', password: 'Admin@123456', totp: '000000' })
      .expect(401);
    expect(res.body.message).toContain('账号或密码错误');
  });

  it('连续失败锁定', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/admin/login')
        .send({ name: '合规-顾', password: 'wrong', totp: '123456' })
        .expect(401);
    }
    const res = await request(app.getHttpServer())
      .post('/admin/login')
      .send({ name: '合规-顾', password: 'Admin@123456', totp: '123456' })
      .expect(423);
    expect(res.body.message).toContain('锁定');
    expect(res.body.code).toBe(1006);
  });

  it('各角色越权访问被拒绝', async () => {
    // 运营编辑登录（只有内容权限）
    const login = await request(app.getHttpServer())
      .post('/admin/login')
      .send({ name: '运营编辑-林', password: 'Admin@123456', totp: '123456' });
    const token = login.body.data.token;
    // 运营编辑访问审计日志（需要合规/超级管理权限）
    const res = await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .set('X-Admin-Token', token)
      .expect(403);
    expect(res.body.message).toContain('无权限');
    expect(res.body.code).toBe(1003);
  });

  it('审计哈希链校验：篡改后能发现', async () => {
    const login = await request(app.getHttpServer())
      .post('/admin/login')
      .send({ name: '超级管理-赵', password: 'Admin@123456', totp: '123456' });
    const token = login.body.data.token;
    // 先写一条审计
    await request(app.getHttpServer())
      .post('/admin/authorizations')
      .set('X-Admin-Token', token)
      .send({ targetType: 'FEEDBACK', targetId: 'x', reason: '测试授权' })
      .expect(201);
    // 校验通过
    const before = await request(app.getHttpServer())
      .get('/admin/audit-logs/verify')
      .set('X-Admin-Token', token)
      .expect(200);
    expect(before.body.data.valid).toBe(true);
    // 模拟篡改：临时移除触发器，篡改一条记录，再恢复触发器
    const appDb = app.get(APP_DB);
    appDb.exec('DROP TRIGGER IF EXISTS audit_log_no_update');
    appDb.prepare('UPDATE AUDIT_LOG SET action = ? WHERE 1=1').run('tampered');
    appDb.exec(`CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON AUDIT_LOG
      BEGIN SELECT RAISE(ABORT, 'AUDIT_LOG 只追加不可修改'); END;`);
    // 校验接口能发现篡改
    const after = await request(app.getHttpServer())
      .get('/admin/audit-logs/verify')
      .set('X-Admin-Token', token)
      .expect(200);
    expect(after.body.data.valid).toBe(false);
    expect(after.body.data.tampered).toBeTruthy();
  });
});
