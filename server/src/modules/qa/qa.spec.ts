import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { matchOutOfScope } from '../safety/rules';

describe('越界问题判定（单元）', () => {
  it('诊断、手术、用药越界可判定', () => {
    expect(matchOutOfScope('帮我看看是不是腰椎间盘突出').length).toBeGreaterThan(0);
    expect(matchOutOfScope('要不要手术').length).toBeGreaterThan(0);
    expect(matchOutOfScope('吃什么药').length).toBeGreaterThan(0);
    expect(matchOutOfScope('L5/S1 突出是什么意思').length).toBe(0);
  });
});

describe('问与解释', () => {
  let app: INestApplication;
  let token: string;
  let sessionId: string;

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
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: '13800000001', code: '123456' });
    token = login.body.data.token;
    // 先创建一次分析作为上下文
    const analysis = appDb.prepare(
      `INSERT INTO ANALYSIS (id, episode_id, version, model_release_id, sections, retrieval_snapshot, safety_flag, created_at)
       VALUES ('analysis-qa-1', 'episode-1', 1, 'release-1', '{}', '{}', '通过', ?)`,
    ).run(new Date().toISOString());
    expect(analysis.changes).toBe(1);
    const session = await request(app.getHttpServer())
      .post('/qa/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ analysisId: 'analysis-qa-1', title: '报告术语解释' });
    sessionId = session.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('正常追问：基于上下文回答并引用来源', async () => {
    const res = await request(app.getHttpServer())
      .post(`/qa/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'L5/S1 是什么意思' })
      .expect(201);
    expect(res.body.data.message.content).toBeTruthy();
    expect(res.body.data.message.citations.length).toBeGreaterThan(0);
  });

  it('越界问题：明确不答，可一键加入复诊问题', async () => {
    const res = await request(app.getHttpServer())
      .post(`/qa/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: '帮我看看是不是腰椎间盘突出' })
      .expect(201);
    expect(res.body.data.outOfScope.length).toBeGreaterThan(0);
    expect(res.body.data.message.content).toContain('不能');
    // 一键加入复诊问题
    const added = await request(app.getHttpServer())
      .post(`/qa/sessions/${sessionId}/followup-questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: '是不是腰椎间盘突出？' })
      .expect(201);
    expect(added.body.data.added).toBe(true);
    const list = await request(app.getHttpServer())
      .get(`/qa/sessions/${sessionId}/followup-questions`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.data.length).toBe(1);
  });

  it('反复求保证：给出稳定解释并结束本轮', async () => {
    const first = await request(app.getHttpServer())
      .post(`/qa/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: '你确定吗？保证没事吧？' })
      .expect(201);
    expect(first.body.data.roundEnded).toBe(false);
    const second = await request(app.getHttpServer())
      .post(`/qa/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ question: '真的吗？一定没事吧？' })
      .expect(201);
    expect(second.body.data.roundEnded).toBe(true);
    expect(second.body.data.message.content).toBe(first.body.data.message.content);
  });

  it('保存会话历史', async () => {
    const res = await request(app.getHttpServer())
      .get(`/qa/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.messages.length).toBeGreaterThan(0);
    const roles = res.body.data.messages.map((m: { role: string }) => m.role);
    expect(roles).toContain('user');
    expect(roles).toContain('assistant');
  });
});
