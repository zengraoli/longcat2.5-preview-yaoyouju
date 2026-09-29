import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

describe('反馈与错误举报', () => {
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

  it('帮助类型反馈：看懂了 / 知道下一步 / 都不好 + 未解决的问题', async () => {
    const res = await request(app.getHttpServer())
      .post('/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({ analysisId: 'analysis-1', helpType: '知道下一步', unsolvedQuestion: '还需要做什么检查？' })
      .expect(201);
    expect(res.body.data.isErrorReport).toBe(false);
  });

  it('错误举报：自动附带分析、模型、内容、规则集四类版本号', async () => {
    const res = await request(app.getHttpServer())
      .post('/feedback/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        analysisId: 'analysis-1',
        description: '解释与报告原文不一致',
        severity: '高',
      })
      .expect(201);
    expect(res.body.data.isErrorReport).toBe(true);
    expect(res.body.data.severity).toBe('高');
    const versions = res.body.data.versions;
    expect(versions.analysisVersion).toBe(1);
    expect(versions.modelVersion).toContain('local-mock-v1');
    expect(versions.contentVersion).toBe('content-c1');
    expect(versions.rulesetVersion).toBe('RF-v1');
  });

  it('单条授权查看与处置动作', async () => {
    const report = await request(app.getHttpServer())
      .post('/feedback/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ analysisId: 'analysis-1', description: '测试处置', severity: '中' });
    const id = report.body.data.id;
    // 授权
    const authorized = await request(app.getHttpServer())
      .post(`/feedback/${id}/authorize`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(authorized.body.data.authorized).toBe(true);
    // 处置
    const handled = await request(app.getHttpServer())
      .post(`/feedback/${id}/handle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: '转人工复核', resolution: '已转临床审核复核' })
      .expect(201);
    expect(handled.body.data.status).toBe('已处理');
    // 详情
    const detail = await request(app.getHttpServer())
      .get(`/feedback/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(detail.body.data.versions).toBeTruthy();
    expect(detail.body.data.versions.rulesetVersion).toBe('RF-v1');
  });
});
