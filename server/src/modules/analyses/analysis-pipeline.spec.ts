import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { LocalMockLlmAdapter } from '../../ai/llm-adapter';
import { EvidenceRetrieval } from '../../ai/retrieval';

describe('一页分析流水线', () => {
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

  it('不启动 Worker 时任务保持排队', async () => {
    const res = await request(app.getHttpServer())
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1' })
      .expect(202);
    expect(res.body.data.status).toBe('排队');
    const taskId = res.body.data.taskId;
    // 不启动 Worker，查询仍为排队
    const query = await request(app.getHttpServer())
      .get(`/analyses/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(query.body.data.status).toBe('排队');
  });

  it('提交时命中红旗：返回安全提示且不生成任务', async () => {
    const res = await request(app.getHttpServer())
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1', safetyText: '最近大小便功能异常' })
      .expect(202);
    expect(res.body.data.safety.passed).toBe(false);
    expect(res.body.data.safety.redFlags.length).toBeGreaterThan(0);
    expect(res.body.data.safety.safetyTips.length).toBeGreaterThan(0);
  });

  it('提交时命中越界：返回停止个性化分析提示', async () => {
    const res = await request(app.getHttpServer())
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1', safetyText: '帮我看看是不是腰椎间盘突出' })
      .expect(202);
    expect(res.body.data.safety.passed).toBe(false);
    expect(res.body.data.safety.outOfScope.length).toBeGreaterThan(0);
  });

  it('Worker 消费后任务完成，分析结果每条解释都带来源', async () => {
    // 提交任务
    const submitted = await request(app.getHttpServer())
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1' })
      .expect(202);
    const taskId = submitted.body.data.taskId;
    // 用应用内的服务模拟 Worker 消费（真实 Worker 为独立进程，由冒烟脚本验证）
    const appDb = app.get(APP_DB);
    const llm = new LocalMockLlmAdapter();
    const retrieval = new EvidenceRetrieval(appDb);
    const context = {
      episodeId: 'episode-1',
      events: appDb
        .prepare('SELECT event_type AS eventType, source_type AS sourceType, raw_text AS rawText, verify_status AS verifyStatus, occurred_at AS occurredAt FROM CARE_EVENT WHERE episode_id = ?')
        .all('episode-1'),
      reports: appDb
        .prepare('SELECT r.raw_text AS rawText, r.report_date AS reportDate FROM REPORT r JOIN CARE_EVENT e ON e.id = r.care_event_id WHERE e.episode_id = ?')
        .all('episode-1'),
      symptomLogs: appDb
        .prepare('SELECT s.sit_minutes AS sitMinutes FROM SYMPTOM_LOG s JOIN CARE_EVENT e ON e.id = s.care_event_id WHERE e.episode_id = ?')
        .all('episode-1'),
    };
    const query = [
      ...context.events.map((e: { rawText: string }) => e.rawText).filter(Boolean),
      ...context.reports.map((r: { rawText: string }) => r.rawText).filter(Boolean),
    ].join(' ');
    const evidence = retrieval.search(query);
    expect(evidence.length).toBeGreaterThan(0);
    const draft = llm.generateDraft(context, evidence);
    const check = llm.verifyCitations(draft.解释.map((s) => s.text), evidence);
    // 核对后至少有一条带来源的解释
    expect(check.supported.length).toBeGreaterThan(0);
    // 保存分析
    const sections = {
      已知: draft.已知,
      解释: draft.解释.filter((s) => check.supported.some((c) => c.statement === s.text)),
      未知: draft.未知,
      下一步: draft.下一步,
      视频: [],
    };
    const now = new Date().toISOString();
    appDb.prepare(
      `INSERT INTO ANALYSIS (id, episode_id, version, model_release_id, sections, retrieval_snapshot, safety_flag, created_at)
       VALUES (?, 'episode-1', 1, 'release-1', ?, ?, '通过', ?)`,
    ).run(taskId, JSON.stringify(sections), JSON.stringify({ evidenceDocs: evidence.map((e) => e.docId) }), now);
    appDb.prepare(`UPDATE ANALYSIS_TASK SET status = '完成', updated_at = ? WHERE id = ?`).run(now, taskId);
    // 查询结果
    const result = await request(app.getHttpServer())
      .get(`/analyses/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(result.body.data.status).toBe('完成');
    const sectionsOut = result.body.data.analysis.sections;
    // 固定五段结构
    for (const key of ['已知', '解释', '未知', '下一步', '视频']) {
      expect(Array.isArray(sectionsOut[key])).toBe(true);
    }
    // 每条解释都带来源
    for (const item of sectionsOut.解释) {
      expect(item.source).toBeTruthy();
    }
    // 未知段显式标出缺失项
    expect(sectionsOut.未知.length).toBeGreaterThan(0);
  });

  it('分析失败时返回明确的回退状态', async () => {
    const submitted = await request(app.getHttpServer())
      .post('/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1' })
      .expect(202);
    const taskId = submitted.body.data.taskId;
    const appDb = app.get(APP_DB);
    const now = new Date().toISOString();
    appDb.prepare(`UPDATE ANALYSIS_TASK SET status = '失败', error = '证据库检索失败', attempts = 3, updated_at = ? WHERE id = ?`).run(now, taskId);
    const result = await request(app.getHttpServer())
      .get(`/analyses/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(result.body.data.status).toBe('失败');
    expect(result.body.data.fallback).toBe(true);
    expect(result.body.data.reason).toContain('证据库检索失败');
    expect(result.body.data.available).toContain('已审核资料');
  });
});
