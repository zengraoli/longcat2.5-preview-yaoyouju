import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../utils/response';

/** 把控制器返回值包装为统一格式 {"code":0,"data":...,"message":"ok"} */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResult<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResult<T>> {
    return next.handle().pipe(map((data) => ({ code: 0, data, message: 'ok' })));
  }
}
