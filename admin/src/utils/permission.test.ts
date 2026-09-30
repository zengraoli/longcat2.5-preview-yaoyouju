import { describe, it, expect } from 'vitest';
import { PERMISSION_POINTS, DUAL_CONFIRM_SETTINGS, hasPermission, auditActionLabel } from './permission';

/** 后台角色权限矩阵（与 server 端 ROLE 表一致，对照设计稿 B10） */
describe('后台角色权限矩阵（B10）', () => {
  it('权限矩阵包含 10 个权限点', () => {
    expect(PERMISSION_POINTS.length).toBe(10);
  });

  it('超管无“内容：审定/退回”权限', () => {
    const review = PERMISSION_POINTS.find((p) => p.point.includes('审定'));
    expect(review?.values[4]).toBe('—');
  });

  it('临床审核有“内容：审定/退回”权限', () => {
    const review = PERMISSION_POINTS.find((p) => p.point.includes('审定'));
    expect(review?.values[1]).toBe('✓');
  });

  it('运营编辑可发起发布，临床审核可确认', () => {
    const publish = PERMISSION_POINTS.find((p) => p.point.includes('发布'));
    expect(publish?.values[0]).toBe('◐');
    expect(publish?.values[1]).toBe('✓');
  });

  it('技术负责人可变更开关，合规不可', () => {
    const sw = PERMISSION_POINTS.find((p) => p.point.includes('功能开关'));
    expect(sw?.values[2]).toBe('✓');
    expect(sw?.values[3]).toBe('—');
  });

  it('双人确认设置包含内容发布、撤回、开关、模型', () => {
    expect(DUAL_CONFIRM_SETTINGS.length).toBe(4);
  });
});

describe('权限判断', () => {
  it('hasPermission 支持多权限任一', () => {
    expect(hasPermission(['content:edit'], 'content:edit')).toBe(true);
    expect(hasPermission(['content:edit'], 'content:review', 'content:edit')).toBe(true);
    expect(hasPermission(['content:edit'], 'content:review')).toBe(false);
    expect(hasPermission(undefined, 'content:edit')).toBe(false);
  });
});

describe('审计动作中文化', () => {
  it('已知动作返回中文', () => {
    expect(auditActionLabel('admin:login')).toBe('后台登录');
    expect(auditActionLabel('content:publish')).toBe('发布内容');
  });

  it('未知动作原样返回', () => {
    expect(auditActionLabel('unknown:action')).toBe('unknown:action');
  });
});
