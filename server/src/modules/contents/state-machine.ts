/** 内容审核状态机（按 docs/system-design.md 第 4 节） */

export type ContentStatus = '草稿' | '待审' | '已审定' | '已发布' | '已撤回' | '已下线' | '更正中';

export type ContentAction = '提交审核' | '通过' | '退回' | '发布' | '撤回' | '下线' | '更正';

const TRANSITIONS: Record<string, ContentStatus> = {
  '草稿>提交审核': '待审',
  '待审>通过': '已审定',
  '待审>退回': '草稿',
  '已审定>发布': '已发布',
  '已发布>撤回': '已撤回',
  '已发布>下线': '已下线',
  '已发布>更正': '更正中',
  '更正中>提交审核': '待审',
  '已撤回>更正': '更正中',
  '已下线>更正': '更正中',
};

/** 状态机流转；非法流转返回 null */
export function transition(current: ContentStatus, action: ContentAction): ContentStatus | null {
  return TRANSITIONS[`${current}>${action}`] ?? null;
}

export const ALL_STATUSES: ContentStatus[] = ['草稿', '待审', '已审定', '已发布', '已撤回', '已下线', '更正中'];
