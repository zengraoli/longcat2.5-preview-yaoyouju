import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

describe('病程与记录今天', () => {
  let app: INestApplication;
  let token: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('病程列表与时间线', async () => {
    const res = await request(app.getHttpServer())
      .get('/episodes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const episodeId = res.body.data[0].id;

    const tl = await request(app.getHttpServer())
      .get(`/episodes/${episodeId}/timeline`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(tl.body.data.events.length).toBeGreaterThan(0);
    // 区分来源类型与核实状态
    const sources = new Set(tl.body.data.events.map((e: { sourceType: string }) => e.sourceType));
    expect(sources.has('报告原文')).toBe(true);
    expect(sources.has('自述')).toBe(true);
  });

  it('新增病程事件：来源类型与核实状态', async () => {
    const episodes = await request(app.getHttpServer())
      .get('/episodes')
      .set('Authorization', `Bearer ${token}`);
    const episodeId = episodes.body.data[0].id;
    const res = await request(app.getHttpServer())
      .post(`/episodes/${episodeId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: '行动',
        occurredAt: '2026-09-29T02:00:00.000Z',
        sourceType: '自述',
        rawText: '今天步行 20 分钟',
        verifyStatus: '已确认',
      })
      .expect(201);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.verifyStatus).toBe('已确认');
  });

  it('用户可纠正与删除自己的记录', async () => {
    const episodes = await request(app.getHttpServer())
      .get('/episodes')
      .set('Authorization', `Bearer ${token}`);
    const episodeId = episodes.body.data[0].id;
    const added = await request(app.getHttpServer())
      .post(`/episodes/${episodeId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: '症状',
        occurredAt: '2026-09-29T03:00:00.000Z',
        sourceType: '自述',
        rawText: '腰部酸痛',
      });
    const eventId = added.body.data.id;
    // 纠正
    const corrected = await request(app.getHttpServer())
      .put(`/episodes/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rawText: '腰部酸痛，活动后缓解', verifyStatus: '已确认' })
      .expect(200);
    expect(corrected.body.data.rawText).toBe('腰部酸痛，活动后缓解');
    expect(corrected.body.data.verifyStatus).toBe('已确认');
    // 删除
    await request(app.getHttpServer())
      .delete(`/episodes/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // 删除后时间线不再包含
    const tl = await request(app.getHttpServer())
      .get(`/episodes/${episodeId}/timeline`)
      .set('Authorization', `Bearer ${token}`);
    expect(tl.body.data.events.find((e: { id: string }) => e.id === eventId)).toBeUndefined();
  });

  it('记录今天：允许跳过，缺失字段返回"尚未确认"，不复用昨日答案', async () => {
    const episodes = await request(app.getHttpServer())
      .get('/episodes')
      .set('Authorization', `Bearer ${token}`);
    const episodeId = episodes.body.data[0].id;
    // 第一次：完整填写
    const first = await request(app.getHttpServer())
      .post(`/episodes/${episodeId}/symptom-logs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        occurredAt: '2026-09-28T02:00:00.000Z',
        sitMinutes: 40,
        plannedActivityDone: '完成',
        sleepImpact: 2,
        topWorry: '担心影像恶化',
        legChange: '没有',
      })
      .expect(201);
    expect(first.body.data.sitMinutes).toBe(40);
    // 第二次：全部跳过（只传日期）
    const second = await request(app.getHttpServer())
      .post(`/episodes/${episodeId}/symptom-logs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ occurredAt: '2026-09-29T02:00:00.000Z' })
      .expect(201);
    expect(second.body.data.sitMinutes).toBe('尚未确认');
    expect(second.body.data.plannedActivityDone).toBe('尚未确认');
    expect(second.body.data.sleepImpact).toBe('尚未确认');
    expect(second.body.data.topWorry).toBe('尚未确认');
    expect(second.body.data.legChange).toBe('尚未确认');
    // 不复用昨日答案：第二次的 id 与第一次不同，且字段未被填充
    expect(second.body.data.id).not.toBe(first.body.data.id);
    // 列表按时间倒序
    const list = await request(app.getHttpServer())
      .get(`/episodes/${episodeId}/symptom-logs`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data.length).toBe(3);
  });
});
