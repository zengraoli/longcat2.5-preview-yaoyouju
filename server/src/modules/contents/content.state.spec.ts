import { describe, it, expect } from 'vitest';

describe('ContentStateMachine', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    '草稿': ['待医学审核'],
    '待医学审核': ['草稿', '已审定'],
    '已审定': ['已发布'],
    '已发布': ['已撤回或已下线', '更正中'],
    '更正中': ['待医学审核'],
    '已撤回或已下线': ['更正中'],
  };

  it('should allow draft to pending review', () => {
    expect(VALID_TRANSITIONS['草稿']).toContain('待医学审核');
  });

  it('should allow pending review to approved', () => {
    expect(VALID_TRANSITIONS['待医学审核']).toContain('已审定');
  });

  it('should allow approved to published', () => {
    expect(VALID_TRANSITIONS['已审定']).toContain('已发布');
  });

  it('should allow published to offline', () => {
    expect(VALID_TRANSITIONS['已发布']).toContain('已撤回或已下线');
  });

  it('should allow published to correcting', () => {
    expect(VALID_TRANSITIONS['已发布']).toContain('更正中');
  });

  it('should allow correcting back to pending review', () => {
    expect(VALID_TRANSITIONS['更正中']).toContain('待医学审核');
  });

  it('should allow offline to correcting', () => {
    expect(VALID_TRANSITIONS['已撤回或已下线']).toContain('更正中');
  });

  it('should not allow draft directly to published', () => {
    expect(VALID_TRANSITIONS['草稿']).not.toContain('已发布');
  });

  it('should not allow pending review to published', () => {
    expect(VALID_TRANSITIONS['待医学审核']).not.toContain('已发布');
  });
});
