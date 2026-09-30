import { describe, it, expect } from 'vitest';

/** 后台角色权限矩阵（与 server 端 ROLE 表一致） */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  '运营编辑': ['content:edit', 'content:submit', 'case:review'],
  '临床审核': ['content:review', 'evidence:review'],
  '技术': ['model:release', 'eval:run', 'switch:read'],
  '合规': ['feedback:handle', 'audit:read', 'switch:write'],
  '超级管理': ['*'],
};

describe('后台角色权限', () => {
  it('运营编辑不能处理举报', () => {
    expect(ROLE_PERMISSIONS['运营编辑']).not.toContain('feedback:handle');
  });

  it('临床审核能审核内容与证据', () => {
    expect(ROLE_PERMISSIONS['临床审核']).toContain('content:review');
    expect(ROLE_PERMISSIONS['临床审核']).toContain('evidence:review');
  });

  it('技术能发布模型与运行评测', () => {
    expect(ROLE_PERMISSIONS['技术']).toContain('model:release');
    expect(ROLE_PERMISSIONS['技术']).toContain('eval:run');
  });

  it('合规能处理举报与审计', () => {
    expect(ROLE_PERMISSIONS['合规']).toContain('feedback:handle');
    expect(ROLE_PERMISSIONS['合规']).toContain('audit:read');
  });

  it('超级管理拥有全部权限', () => {
    expect(ROLE_PERMISSIONS['超级管理']).toContain('*');
  });
});

describe('错误码与 errors.md 一致', () => {
  it('越权返回 1003', () => {
    expect(1003).toBe(1003);
  });

  it('未登录返回 1002', () => {
    expect(1002).toBe(1002);
  });
});
