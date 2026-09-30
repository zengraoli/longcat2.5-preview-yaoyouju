import { describe, it, expect } from 'vitest';
import { CONFUSION_OPTIONS, confusionTitle } from './confusion';

/** 主要困惑选项 key → 标题映射（避免把英文 key 写进病程） */
describe('主要困惑选项映射', () => {
  it('四个选项都有中文标题', () => {
    expect(CONFUSION_OPTIONS).toHaveLength(4);
    for (const o of CONFUSION_OPTIONS) {
      expect(o.title).toMatch(/^[一-龥]/);
    }
  });

  it('key 映射为中文标题，不返回英文 key', () => {
    expect(confusionTitle('course')).toBe('病程变化');
    expect(confusionTitle('report')).toBe('报告术语');
    expect(confusionTitle('followup')).toBe('复诊准备');
    expect(confusionTitle('life')).toBe('生活影响');
  });

  it('未知 key 回退为 key 本身', () => {
    expect(confusionTitle('unknown')).toBe('unknown');
  });
});
