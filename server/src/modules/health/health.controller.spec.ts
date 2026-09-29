import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';

describe('HealthController', () => {
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

  it('GET /health 返回统一格式', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.code).toBe(0);
    expect(res.body.message).toBe('ok');
    expect(res.body.data.status).toBe('ok');
  });

  it('未知路由返回统一错误格式', async () => {
    const res = await request(app.getHttpServer()).get('/no-such-route').expect(404);
    expect(res.body.code).not.toBe(0);
    expect(typeof res.body.message).toBe('string');
  });

  it('就医提示接口无需登录', async () => {
    const res = await request(app.getHttpServer()).get('/safety/tips').expect(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.redFlags.length).toBeGreaterThan(0);
  });
});
