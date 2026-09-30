import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { SwitchesService } from '../switches/switches.service';

describe('分析接口与功能开关', () => {
  let app: INestApplication;
  let switches: SwitchesService;

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
    switches = app.get(SwitchesService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('关闭个性化分析开关后，分析接口返回回退结果', async () => {
    // 技术负责人发起 + 临床确认 → 关闭
    switches.set('个性化分析', false, '测试关闭', 'admin-tech', ['switch:write']);
    switches.set('个性化分析', false, '测试关闭', 'admin-clinical', ['switch:confirm']);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: '13800000001', code: '123456' });
    const token = login.body.data.token;
    const res = await request(app.getHttpServer())
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1' })
      .expect(202);
    expect(res.body.data.fallback).toBe(true);
    expect(res.body.data.reason).toContain('个性化分析');
    expect(res.body.data.available).toContain('已审核资料');
    // 重新开启：技术发起 + 超管确认
    switches.set('个性化分析', true, '测试恢复', 'admin-tech', ['switch:write']);
    switches.set('个性化分析', true, '测试恢复', 'admin-super', ['switch:confirm']);
  });

  it('开关开启时提交分析返回 202 与任务 ID', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: '13800000001', code: '123456' });
    const token = login.body.data.token;
    const res = await request(app.getHttpServer())
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1' })
      .expect(202);
    expect(res.body.data.taskId).toBeTruthy();
    expect(res.body.data.status).toBe('排队');
  });

  it('未登录时分析接口返回 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/analyses')
      .send({ episodeId: 'episode-1' })
      .expect(401);
    expect(res.body.code).toBe(1002);
  });

  it('已下线内容不再出现在最新分析的视频里', async () => {
    const appDb = app.get(APP_DB);
    // 种子分析（episode-1）引用了 content-1 / content-2；用种子用户登录取令牌
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: '13800000001', code: '123456' });
    const token = login.body.data.token;
    // 直接下线 content-1（状态改为已下线）
    appDb.prepare("UPDATE CONTENT_ITEM SET current_status = '已下线' WHERE id = 'content-1'").run();
    const res = await request(app.getHttpServer())
      .get('/analyses/episodes/episode-1/latest')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const videoIds: string[] = (res.body.data.sections.视频 ?? []).map((v: { contentId: string }) => v.contentId);
    expect(videoIds).not.toContain('content-1');
    expect(videoIds).toContain('content-2');
    // 下线开关也应过滤
    appDb.prepare("UPDATE CONTENT_ITEM SET offline_switch = 1 WHERE id = 'content-2'").run();
    const res2 = await request(app.getHttpServer())
      .get('/analyses/episodes/episode-1/latest')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const videoIds2: string[] = (res2.body.data.sections.视频 ?? []).map((v: { contentId: string }) => v.contentId);
    expect(videoIds2).not.toContain('content-2');
  });
});
