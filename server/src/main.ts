import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import path from 'node:path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // OpenAPI 文档页（本地静态文件，不加载外部资源）
  const expressApp = app.getHttpAdapter().getInstance();
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
          return typeof first === 'string' ? first : '参数校验失败';
        });
        const { BusinessException } = require('./common/utils/business-exception');
        return new BusinessException(1001, messages[0] ?? '参数校验失败');
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  const port = parseInt(process.env.PORT ?? '3400', 10);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
}

void bootstrap();
