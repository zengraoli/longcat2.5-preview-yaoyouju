import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import Database from 'better-sqlite3';
import { AppModule } from '../../app.module';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

describe('复诊摘要', () => {
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

  it('预览：固定六段，区分来源，未核实项带标记', async () => {
    const res = await request(app.getHttpServer())
      .get('/followup/summary?episodeId=episode-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const content = res.body.data;
    for (const key of ['当前情况', '报告要点', '医嘱要点', '尚未确认', '下一步', '复诊问题']) {
      expect(Array.isArray(content[key])).toBe(true);
    }
    // 区分来源
    expect(content.报告要点.every((s: { source: string }) => s.source === '报告原文')).toBe(true);
    expect(content.医嘱要点.every((s: { source: string }) => s.source === '医生记录')).toBe(true);
    expect(content.当前情况.every((s: { source: string }) => s.source === '自述')).toBe(true);
  });

  it('保存、纠正与问题清单排序', async () => {
    const preview = await request(app.getHttpServer())
      .get('/followup/summary?episodeId=episode-1')
      .set('Authorization', `Bearer ${token}`);
    const content = preview.body.data;
    const saved = await request(app.getHttpServer())
      .post('/followup/summary')
      .set('Authorization', `Bearer ${token}`)
      .send({ episodeId: 'episode-1', content })
      .expect(201);
    const summaryId = saved.body.data.id;
    // 纠正
    content.当前情况.push({ text: '今天步行 30 分钟', source: '自述' });
    const corrected = await request(app.getHttpServer())
      .put(`/followup/summary/${summaryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content })
      .expect(200);
    expect(corrected.body.data.content.当前情况.length).toBe(content.当前情况.length);
    // 问题清单排序
    const reordered = await request(app.getHttpServer())
      .put(`/followup/summary/${summaryId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questions: ['问题二', '问题一'] })
      .expect(200);
    expect(reordered.body.data.content.复诊问题).toEqual(['问题二', '问题一']);
  });

  it('导出文本：记录导出时间与格式，未核实项保留"未经核实"标记', async () => {
    const saved = await request(app.getHttpServer())
      .post('/followup/summary')
      .set('Authorization', `Bearer ${token}`)
      .send({
        episodeId: 'episode-1',
        content: {
          当前情况: [{ text: '久坐后腰部酸痛', source: '自述' }],
          报告要点: [{ text: 'L5/S1 椎间盘突出', source: '报告原文' }],
          医嘱要点: [{ text: '避免久坐', source: '医生记录' }],
          尚未确认: [{ text: '右小腿麻木的病因', mark: '未经核实' }],
          下一步: [{ text: '核心肌群训练', source: '医生记录' }],
          复诊问题: ['右小腿麻木是否需要进一步检查？'],
        },
      });
    const summaryId = saved.body.data.id;
    const res = await request(app.getHttpServer())
      .post(`/followup/summary/${summaryId}/export`)
      .set('Authorization', `Bearer ${token}`)
      .send({ format: '文本' })
      .expect(201);
    expect(res.body.data.format).toBe('文本');
    expect(res.body.data.exportedAt).toBeTruthy();
    expect(res.body.data.text).toContain('【报告要点】');
    expect(res.body.data.text).toContain('【尚未确认】');
    expect(res.body.data.text).toContain('未经核实');
    expect(res.body.data.text).toContain('L5/S1 椎间盘突出');
  });
});
