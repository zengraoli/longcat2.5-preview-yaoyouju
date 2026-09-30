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
          // 值为空（未传 / 空串）时优先提示“不能为空”，避免只报长度
          const value = (e as { value?: unknown }).value;
          const missing = value === undefined || value === null || value === '';
          // 值为空且有约束（说明该字段必填）时优先提示“不能为空”
          if (missing && Object.keys(constraints).length > 0) {
            return `${e.property} 不能为空`;
          }
          // 按优先级取第一个约束：先判空/类型，再判长度/格式
          const priority = ['isDefined', 'isNotEmpty', 'isString', 'isInt', 'isNumber', 'isBoolean', 'isArray', 'isEmail', 'isISO8601', 'isUUID', 'isObject', 'isIn', 'matches', 'maxLength', 'minLength'];
          const key = priority.find((k) => constraints[k]) ?? Object.keys(constraints)[0] ?? '';
          const first = constraints[key];
          return typeof first === 'string'
            ? translateConstraintMessage(e.property, key, first)
            : '参数校验失败';
        });
        const { BusinessException } = require('./common/utils/business-exception');
        return new BusinessException(1001, messages[0] ?? '参数校验失败');
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  // 请求 ID：优先采用客户端 X-Request-Id（限长度与格式，避免原样写入审计），否则生成；响应头回传，审计日志使用
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.use((req, res, next) => {
    const raw = req.headers['x-request-id'] as string | undefined;
    // 只接受 8-64 位的字母/数字/连字符/下划线；不合法则生成随机 ID
    const requestId = raw && /^[A-Za-z0-9_-]{8,64}$/.test(raw) ? raw : crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    runWithRequestContext({ requestId }, () => next());
  });
  // 超长请求头（如超长令牌）返回统一 JSON 错误，而不是空响应
  const httpServer = app.getHttpServer();
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

/**
 * 将 class-validator 的英文约束提示翻译为中文，并带上字段名与限制值。
 * 例如 “title must be shorter than or equal to 100 characters” → “title 长度不能大于 100”。
 */
function translateConstraintMessage(field: string, constraintKey: string, message: string): string {
  const num = (message.match(/\d+/) ?? [])[0];
  const withLimit = (text: string) => (num ? `${field} ${text} ${num}` : `${field} ${text}`);
  switch (constraintKey) {
    case 'maxLength':
      return withLimit('长度不能大于');
    case 'minLength':
      return withLimit('长度不能小于');
    case 'isNotEmpty':
    case 'isDefined':
      return `${field} 不能为空`;
    case 'isString':
      return `${field} 必须是字符串`;
    case 'isInt':
    case 'isNumber':
      return `${field} 必须是数字`;
    case 'isArray':
      return `${field} 必须是数组`;
    case 'isBoolean':
      return `${field} 必须是布尔值`;
    case 'isEmail':
      return `${field} 邮箱格式不正确`;
    case 'isISO8601':
      return `${field} 日期格式不正确`;
    case 'isIn':
      return `${field} 取值不合法`;
    case 'matches':
      return `${field} 格式不正确`;
    case 'isObject':
      return `${field} 必须是对象`;
    case 'isUUID':
      return `${field} 必须是合法 ID`;
    case 'isUrl':
      return `${field} 链接格式不正确`;
    default:
      break;
  }
  // 未知约束：回退到英文消息的中文化，至少带上字段名
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
    if (pattern.test(message)) return `${field} ${text}`;
  }
  return `${field} 格式不正确`;
}

void bootstrap();
