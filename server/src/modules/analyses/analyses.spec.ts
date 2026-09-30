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
});
