/** 主要困惑选项（key → 展示标题/图标/说明），供“选择主要困惑”页与测试使用 */
export const CONFUSION_OPTIONS = [
  { key: 'report', title: '报告术语', icon: 'report', desc: '看不懂报告里的名词与描述' },
  { key: 'course', title: '病程变化', icon: 'course', desc: '想知道这段时间的变化说明什么' },
  { key: 'followup', title: '复诊准备', icon: 'followup', desc: '复诊时该怎么描述、带什么' },
  { key: 'life', title: '生活影响', icon: 'life', desc: '日常活动、工作与睡眠受影响' },
] as const;

export type ConfusionKey = (typeof CONFUSION_OPTIONS)[number]['key'];

/** 把选项 key 映射为展示标题（避免把英文 key 写进病程，如“主要困惑：course”） */
export function confusionTitle(key: string): string {
  return CONFUSION_OPTIONS.find((o) => o.key === key)?.title ?? key;
}
