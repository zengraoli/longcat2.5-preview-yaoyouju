/** 北京时间（UTC+8）日期格式化，避免界面按 UTC 显示 */

/** 北京时间当天日期，格式 YYYY-MM-DD */
export function beijingDate(date: Date = new Date()): string {
  return new Date(date.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 北京时间日期，格式 YYYY-MM-DD */
export function formatBeijingDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
