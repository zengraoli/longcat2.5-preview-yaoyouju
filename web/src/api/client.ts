/**
 * 接口封装：统一响应格式 {"code":0,"data":...,"message":"ok"}；
 * 出错时 code 非 0，message 为中文。令牌持久化在 localStorage。
 */

const BASE = '/api';
const TOKEN_KEY = 'yaoyouju_web_token';

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(pathname: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${pathname}`, { ...options, headers });
  const json = (await res.json().catch(() => ({}))) as {
    code: number;
    data: T;
    message: string;
  };
  if (json.code !== 0) {
    if (json.code === 1002) {
      setAuthToken(null);
      onUnauthorized?.();
    }
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
