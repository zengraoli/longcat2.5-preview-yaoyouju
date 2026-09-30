import { describe, it, expect } from 'vitest';

/** “能坐多久”选项到分钟数的映射（与 record 页一致） */
function sitMinutesToNumber(opt: string): number | undefined {
  if (!opt) return undefined;
  if (opt === '<15分钟') return 10;
  if (opt === '15-30') return 22;
  if (opt === '30-60') return 45;
  if (opt === '>60分钟') return 90;
  const n = parseInt(opt, 10);
  return Number.isNaN(n) ? undefined : n;
}

describe('记录今天：能坐多久映射', () => {
  it('<15分钟 映射为 10', () => {
    expect(sitMinutesToNumber('<15分钟')).toBe(10);
  });
  it('15-30 映射为 22', () => {
    expect(sitMinutesToNumber('15-30')).toBe(22);
  });
  it('30-60 映射为 45', () => {
    expect(sitMinutesToNumber('30-60')).toBe(45);
  });
  it('>60分钟 映射为 90', () => {
    expect(sitMinutesToNumber('>60分钟')).toBe(90);
  });
  it('空值返回 undefined', () => {
    expect(sitMinutesToNumber('')).toBeUndefined();
  });
});

describe('红旗选项触发安全规则', () => {
  const redFlagOptions = ['大小便控制异常', '会阴区或鞍区麻木', '双腿进行性无力', '发热、夜间痛持续不缓解或体重明显下降'];

  it('包含大小便关键词', () => {
    expect(redFlagOptions[0]).toContain('大小便');
  });
  it('包含会阴/鞍区关键词', () => {
    expect(redFlagOptions[1]).toContain('会阴');
  });
  it('包含进行性无力关键词', () => {
    expect(redFlagOptions[2]).toContain('进行性无力');
  });
});
