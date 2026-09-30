import { describe, it, expect } from 'vitest';
import { formatBeijing } from './time';

/** 时间显示：UTC → 北京时间 */
describe('formatBeijing', () => {
  it('UTC 00:00 对应北京 08:00', () => {
    expect(formatBeijing('2026-09-30T00:00:00.000Z')).toBe('2026-09-30 08:00');
  });

  it('UTC 16:00 对应北京次日 00:00', () => {
    expect(formatBeijing('2026-09-30T16:00:00.000Z')).toBe('2026-10-01 00:00');
  });

  it('空值返回占位符', () => {
    expect(formatBeijing(null)).toBe('—');
    expect(formatBeijing(undefined)).toBe('—');
    expect(formatBeijing('')).toBe('—');
  });

  it('非法时间返回占位符', () => {
    expect(formatBeijing('not-a-date')).toBe('—');
  });
});
