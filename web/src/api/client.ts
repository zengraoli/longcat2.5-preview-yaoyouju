/**
 * 接口封装：统一响应格式 {"code":0,"data":...,"message":"ok"}；
 * 出错时 code 非 0，message 为中文。所有请求经 /api 代理到 server。
 */

const BASE = '/api';

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(pathname: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE}${pathname}`, { ...options, headers });
  const json = (await res.json().catch(() => ({}))) as {
    code: number;
    data: T;
    message: string;
  };
  if (json.code !== 0) {
    throw new ApiError(json.code, json.message || '请求失败');
  }
  return json.data;
}

export const api = {
  get: <T>(pathname: string) => request<T>(pathname),
  post: <T>(pathname: string, body?: unknown) =>
    request<T>(pathname, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(pathname: string, body?: unknown) =>
    request<T>(pathname, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(pathname: string) => request<T>(pathname, { method: 'DELETE' }),
};
