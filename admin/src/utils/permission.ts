/** 后台角色权限（与 server 端 ROLE 表一致，对照设计稿 B10） */

export const ROLE_NAMES = ['运营编辑', '临床审核', '技术', '合规', '超级管理'] as const;

/** 权限点 → 说明（用于权限矩阵展示） */
export const PERMISSION_POINTS: Array<{ point: string; values: string[] }> = [
  { point: '内容：编辑草稿 / 提交', values: ['✓', '—', '—', '—', '✓'] },
  { point: '内容：审定 / 退回', values: ['—', '✓', '—', '—', '—'] },
  { point: '内容：发布（双人）', values: ['◐', '✓', '—', '—', '✓'] },
  { point: '内容：撤回 / 应急下线', values: ['—', '✓', '—', '—', '✓'] },
  { point: '证据库：录入 / 核实 / 停用', values: ['✓/—/—', '✓/✓/✓', '—', '—', '✓'] },
  { point: '举报：初筛 / 临床复核', values: ['✓/—', '✓/✓', '—', '—', '✓'] },
  { point: '用户资料：脱敏查看 / 明文（单条授权）', values: ['✓/—', '✓/✓', '✓/—', '✓/—', '✓/✓'] },
  { point: '功能开关 / 模型发布', values: ['—', '◐', '✓', '—', '✓'] },
  { point: '评测集 / 评测运行', values: ['—', '◐', '✓', '—', '✓'] },
  { point: '成员与角色 / 审计导出审批', values: ['—', '—', '—', '◐', '✓'] },
];

/** 双人确认设置（对照设计稿 B10） */
export const DUAL_CONFIRM_SETTINGS = [
  { name: '内容发布', value: '运营编辑发起 + 临床审核确认' },
  { name: '撤回 / 应急下线', value: '临床审核 + 超管' },
  { name: '功能开关（高危）', value: '技术负责人 + 临床审核 / 超管' },
  { name: '模型激活 / 回滚', value: '技术负责人 + 超管' },
];

/** 当前登录管理员是否具有指定权限之一 */
export function hasPermission(permissions: string[] | undefined, ...needed: string[]): boolean {
  if (!permissions) return false;
  return needed.some((n) => permissions.includes(n));
}

/** 角色标签颜色 */
export function roleTone(roleName: string): 'ok' | 'warn' | 'error' | 'info' | 'neutral' {
  switch (roleName) {
    case '超级管理':
      return 'error';
    case '临床审核':
      return 'info';
    case '运营编辑':
      return 'ok';
    case '技术':
      return 'warn';
    default:
      return 'neutral';
  }
}

/** 审计动作代码 → 中文说明 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'admin:login': '后台登录',
  'admin:login-failed': '登录失败',
  'admin:logout': '退出登录',
  'admin:user-status': '账号停用/启用',
  'admin:user-role': '角色变更',
  'admin:authorize': '单条授权',
  'admin:audit-view': '查看审计',
  'admin:audit-export': '审计导出',
  'admin:audit-export-request': '审计导出申请',
  'admin:audit-export-approve': '审计导出审批',
  'admin:feedback-view': '查看反馈',
  'admin:safety-view': '查看安全事件',
  'content:create': '创建内容',
  'content:update': '编辑内容',
  'content:transition': '内容状态流转',
  'content:publish-initiate': '发起发布',
  'content:publish': '发布内容',
  'content:offline-initiate': '发起下线',
  'content:offline': '下线内容',
  'content:restore': '取消下线',
  'content:offline-switch-on': '下线开关开启',
  'content:offline-switch-off': '下线开关关闭',
  'content:batch-offline': '批量下线',
  'content:correct-initiate': '发起更正',
  'evidence:create': '新建证据',
  'evidence:deactivate': '停用证据',
  'feedback:report': '提交举报',
  'feedback:authorize': '反馈授权',
  'feedback:handle': '反馈处置',
  'model:create': '创建发布组合',
  'model:eval': '运行评测',
  'model:publish-initiate': '发起模型发布',
  'model:publish': '模型发布',
  'model:rollback-initiate': '发起回滚',
  'model:rollback': '模型回滚',
  'switch:update': '开关变更',
  'switch:initiate': '发起开关变更',
  'case:review': '案例审核',
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}
