import { describe, it, expect } from 'vitest';
import { RULES, RULESET_VERSION } from './rules';

describe('红旗规则表（后台展示，与 server 一致）', () => {
  it('规则集版本为 RF-v5', () => {
    expect(RULESET_VERSION).toBe('RF-v5');
  });

  it('包含 7 类红旗（含疼痛剧烈与肿瘤病史）', () => {
    const redFlags = RULES.filter((r) => r.category === 'red-flag');
    expect(redFlags).toHaveLength(7);
    expect(redFlags.map((r) => r.code)).toEqual(
      expect.arrayContaining(['RF-06', 'RF-07']),
    );
    expect(redFlags.find((r) => r.code === 'RF-07')?.name).toContain('肿瘤');
  });

  it('包含诊断 / 手术 / 用药三类越界请求', () => {
    const oos = RULES.filter((r) => r.category === 'out-of-scope').map((r) => r.code);
    expect(oos).toEqual(['SC-01', 'SC-02', 'SC-03']);
  });
});
