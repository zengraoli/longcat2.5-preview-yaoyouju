import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // H5/Web 前端跨域：允许本项目各端开发源与生产同源访问
  app.enableCors({
    origin: [
      'http://localhost:5401',
      'http://localhost:5402',
      'http://localhost:5403',
      'http://127.0.0.1:5401',
      'http://127.0.0.1:5402',
      'http://127.0.0.1:5403',
    ],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('腰有据 API')
    .setDescription('腰痛理解与复诊助手 API')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.PORT || '3400', 10);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api/health`);
}

bootstrap();
