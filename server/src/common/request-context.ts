import { AsyncLocalStorage } from 'node:async_hooks';

/** 请求上下文：在同一请求内传递 request_id（优先采用客户端 X-Request-Id） */
export interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getRequestId(): string | null {
  return storage.getStore()?.requestId ?? null;
}
