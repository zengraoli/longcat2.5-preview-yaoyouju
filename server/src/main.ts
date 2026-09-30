import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { runWithRequestContext } from './common/request-context';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const expressApp = app.getHttpAdapter().getInstance();
  // 请求体大小限制 2MB（JSON / URL-encoded）
  expressApp.use(express.json({ limit: '2mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '2mb' }));
  // OpenAPI 文档页（本地静态文件，不加载外部资源）
  expressApp.use('/docs', express.static(path.join(__dirname, '../public')));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) => {
          const constraints = e.constraints ?? {};
          const first = Object.values(constraints)[0];
          return typeof first === 'string' ? translateConstraintMessage(first) : '参数校验失败';
        });
        const { BusinessException } = require('./common/utils/business-exception');
        return new BusinessException(1001, messages[0] ?? '参数校验失败');
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  // 请求 ID：优先采用客户端 X-Request-Id，否则生成；响应头回传，审计日志使用
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    runWithRequestContext({ requestId }, () => next());
  });
  // 超长请求头（如超长令牌）返回统一 JSON 错误，而不是空响应
  const httpServer = app.getHttpAdapter().getInstance();
  httpServer.on('clientError', (err: Error, socket: { write: (data: string) => void; end: () => void; destroyed: boolean }) => {
    if (!socket.destroyed) {
      socket.write(
        'HTTP/1.1 431 Request Header Fields Too Large\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n' +
          JSON.stringify({ code: 1001, data: null, message: '请求头过大' }),
      );
      socket.end();
    }
  });
  const port = parseInt(process.env.PORT ?? '3400', 10);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
}

/** 将 class-validator 的英文约束提示翻译为中文 */
function translateConstraintMessage(message: string): string {
  const map: Array<[RegExp, string]> = [
    [/must be a string/, '必须是字符串'],
    [/must be a string or an array/, '必须是字符串或数组'],
    [/must be an integer number/, '必须是整数'],
    [/must be a number conforming to the specified constraints/, '必须是数字'],
    [/must be an array/, '必须是数组'],
    [/should not be empty/, '不能为空'],
    [/must be longer than or equal to/, '长度不能小于'],
    [/must be shorter than or equal to/, '长度不能大于'],
    [/must be a valid ISO 8601 date string/, '日期格式不正确'],
    [/must be one of the following values/, '取值不合法'],
    [/must match/, '格式不正确'],
    [/must be an object/, '必须是对象'],
    [/must be a boolean value/, '必须是布尔值'],
    [/must be a boolean/, '必须是布尔值'],
    [/must be an email/, '邮箱格式不正确'],
    [/must be equal to/, '取值不合法'],
  ];
  for (const [pattern, text] of map) {
    if (pattern.test(message)) return text;
  }
  return message;
}

void bootstrap();
