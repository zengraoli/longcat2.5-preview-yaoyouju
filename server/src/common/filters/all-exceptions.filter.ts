import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { fail } from '../utils/response';
import { BusinessException } from '../utils/business-exception';

/** 全局异常处理：所有错误都返回统一格式，message 为中文，业务码与 errors.md 一致 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 5001;
    let message = '服务内部错误';

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      code = exception.businessCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const msg =
        typeof body === 'string'
          ? body
          : Array.isArray((body as { message?: unknown }).message)
            ? ((body as { message: string[] }).message[0] ?? exception.message)
            : ((body as { message?: string }).message ?? exception.message);
      code = this.mapStatusToCode(status);
      message = msg;
      // 404：仅“路由未匹配”提示“接口不存在”；资源不存在等保留具体中文提示
      if (status === 404 && /^Cannot (GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS) /.test(message)) {
        message = '接口不存在';
      }
    } else if (typeof (exception as { status?: unknown })?.status === 'number') {
      // body-parser 等中间件抛出的错误（如请求体过大、坏 JSON）带 status 字段
      const err = exception as { status: number; message?: string; type?: string };
      status = err.status;
      code = this.mapStatusToCode(status);
      const statusNum = Number(status);
      if (statusNum === 400 && err.type === 'entity.parse.failed') {
        message = '请求体不是合法的 JSON';
      } else if (statusNum === 413) {
        message = '请求体过大';
      } else if (statusNum === 431) {
        message = '请求头过大';
      } else {
        message = '请求处理失败';
      }
    } else {
      this.logger.error(exception);
    }

    res.status(status).json(fail(code, message));
  }

  private mapStatusToCode(status: number): number {
    switch (status) {
      case 400:
        return 1001;
      case 401:
        return 1002;
      case 403:
        return 1003;
      case 404:
        return 1004;
      case 409:
        return 1005;
      case 413:
        return 1001;
      case 423:
        return 1006;
      case 429:
        return 1007;
      default:
        return 5001;
    }
  }
}
