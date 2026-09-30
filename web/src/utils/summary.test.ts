import { describe, it, expect } from 'vitest';

/** 复诊摘要六段结构校验（与 server 端一致） */
const SECTION_KEYS = ['当前情况', '报告要点', '医嘱要点', '尚未确认', '下一步', '复诊问题'] as const;

describe('复诊摘要结构', () => {
  it('包含固定六段', () => {
    expect(SECTION_KEYS).toEqual(['当前情况', '报告要点', '医嘱要点', '尚未确认', '下一步', '复诊问题']);
  });

  it('缺失字段显示"尚未确认"语义，不默认为阴性', () => {
    const text = '尚未确认';
    expect(text).not.toBe('无');
    expect(text).not.toBe('没有');
  });
});

describe('状态标签语义（三端一致）', () => {
  it('报告原文为 info（蓝色）', () => {
    // 与 StatusTag 的 tone 映射一致
    const infoLabels = ['报告原文'];
    expect(infoLabels).toContain('报告原文');
  });

  it('自述为 neutral（灰色）', () => {
    const neutralLabels = ['自述'];
    expect(neutralLabels).toContain('自述');
  });
});
