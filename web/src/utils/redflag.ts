/**
 * 红旗信号全局提示：各页面命中红旗时调用，由 AppLayout 统一弹出“就医提示”弹层，
 * 避免与“已保存”等提示互相遮挡，并保证用户一定看到就医提示。
 */
export interface RedFlagPayload {
  title?: string;
  messages: string[];
  note?: string;
}

export const REDFLAG_EVENT = 'yaoyouju:redflag';

export function showRedFlag(payload: RedFlagPayload) {
  window.dispatchEvent(new CustomEvent<RedFlagPayload>(REDFLAG_EVENT, { detail: payload }));
}
