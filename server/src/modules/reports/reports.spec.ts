import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { extractTerms, mockOcr } from './terms';

describe('术语抽取与原文定位', () => {
  it('抽取 L5/S1 等术语并记录位置', () => {
    const text = '腰椎 MRI 报告：L4/5、L5/S1 椎间盘突出，L5/S1 为著；腰椎生理曲度存在。';
    const hits = extractTerms(text);
    const l5s1 = hits.filter((h) => h.term === 'L5/S1');
    expect(l5s1).toHaveLength(2);
    expect(l5s1[0].position).toBe(text.indexOf('L5/S1'));
    expect(l5s1[1].position).toBe(text.lastIndexOf('L5/S1'));
    const tuchu = hits.find((h) => h.term === '椎间盘突出');
    expect(tuchu?.position).toBe(text.indexOf('椎间盘突出'));
  });

  it('无术语时返回空数组', () => {
    expect(extractTerms('今天天气不错')).toEqual([]);
  });

  it('模拟 OCR 返回示例文本', () => {
    const ocr = mockOcr();
    expect(ocr.engine).toBe('mock-ocr-v1');
    expect(ocr.text).toContain('L5/S1');
  });
});

describe('报告录入与结构化核对', () => {
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

  it('录入报告：记录来源类型与日期，抽取术语', async () => {
    const episodes = await request(app.getHttpServer())
      .get('/episodes')
      .set('Authorization', `Bearer ${token}`);
    const episodeId = episodes.body.data[0].id;
    const event = await request(app.getHttpServer())
      .post(`/episodes/${episodeId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: '报告',
        occurredAt: '2026-09-20T02:00:00.000Z',
        sourceType: '报告原文',
        rawText: '腰椎 MRI：L5/S1 椎间盘突出。',
      });
    const res = await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        careEventId: event.body.data.id,
        reportDate: '2026-09-20',
        sourceType: '报告原文',
        rawText: '腰椎 MRI：L5/S1 椎间盘突出。',
      })
      .expect(201);
    expect(res.body.data.extractedTerms.length).toBeGreaterThan(0);
    const l5s1 = res.body.data.extractedTerms.find((t: { term: string }) => t.term === 'L5/S1');
    expect(l5s1).toBeTruthy();
    expect(l5s1.position).toBe('腰椎 MRI：L5/S1 椎间盘突出。'.indexOf('L5/S1'));
  });

  it('结构化核对：来源、时间、核实状态；冲突项需用户确认', async () => {
    const episodes = await request(app.getHttpServer())
      .get('/episodes')
      .set('Authorization', `Bearer ${token}`);
    const episodeId = episodes.body.data[0].id;
    const event = await request(app.getHttpServer())
      .post(`/episodes/${episodeId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: '报告',
        occurredAt: '2026-09-21T02:00:00.000Z',
        sourceType: '报告原文',
        rawText: '腰椎 CT：L5/S1 椎间盘膨出。',
      });
    const report = await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        careEventId: event.body.data.id,
        sourceType: '报告原文',
        rawText: '腰椎 CT：L5/S1 椎间盘膨出。',
      });
    const reportId = report.body.data.id;
    // 核对：缺报告日期 + 未确认 → 冲突项
    const verify = await request(app.getHttpServer())
      .get(`/reports/${reportId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(verify.body.data.source.type).toBe('报告原文');
    expect(verify.body.data.verifyStatus).toBe('尚未确认');
    expect(verify.body.data.conflicts).toContain('报告日期尚未确认');
    expect(verify.body.data.conflicts).toContain('报告内容尚未确认');
    // 用户确认后冲突减少
    const confirmed = await request(app.getHttpServer())
      .put(`/reports/${reportId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send({ verifyStatus: '已确认' })
      .expect(200);
    expect(confirmed.body.data.conflicts).not.toContain('报告内容尚未确认');
  });

  it('拍照提取走模拟 OCR', async () => {
    const episodes = await request(app.getHttpServer())
      .get('/episodes')
      .set('Authorization', `Bearer ${token}`);
    const episodeId = episodes.body.data[0].id;
    const event = await request(app.getHttpServer())
      .post(`/episodes/${episodeId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: '报告',
        occurredAt: '2026-09-22T02:00:00.000Z',
        sourceType: '报告原文',
        rawText: '占位',
      });
    const res = await request(app.getHttpServer())
      .post('/reports/ocr')
      .set('Authorization', `Bearer ${token}`)
      .send({ careEventId: event.body.data.id })
      .expect(201);
    expect(res.body.data.text).toContain('L5/S1');
  });
});
