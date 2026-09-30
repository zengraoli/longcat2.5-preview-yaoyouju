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
      case 423:
        return 1006;
      case 429:
        return 1007;
      default:
        return 5001;
    }
  }
}
