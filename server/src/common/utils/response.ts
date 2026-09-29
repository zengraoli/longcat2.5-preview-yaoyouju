/** 统一响应格式 */
export interface ApiResult<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export function ok<T>(data: T, message = 'ok'): ApiResult<T> {
  return { code: 0, data, message };
}

export function fail(code: number, message: string): ApiResult<null> {
  return { code, data: null, message };
}
