/** 主要困惑选项（key → 展示标题），供“选择主要困惑”页与测试使用 */
export const CONFUSION_OPTIONS = [
  { key: 'report', title: '报告术语' },
  { key: 'course', title: '病程变化' },
  { key: 'followup', title: '复诊准备' },
  { key: 'life', title: '生活影响' },
] as const;

/** 把选项 key 映射为展示标题（避免把英文 key 写进病程，如“主要困惑：course”） */
export function confusionTitle(key: string): string {
  return CONFUSION_OPTIONS.find((o) => o.key === key)?.title ?? key;
}
