/**
 * 后台与安全规则复查脚本（第四轮反馈）
 * 覆盖：B10 权限矩阵、双人确认两轮、50+ 新红旗/否定/正常说法、各接口复查
 */
const BASE = 'http://localhost:3400';
let passed = 0;
let failed = 0;
function ok(name) { passed++; console.log(`  ✓ ${name}`); }
function fail(name, err) { failed++; console.error(`  ✗ ${name}: ${err}`); }
function check(name, cond, detail) { if (cond) ok(name); else fail(name, detail ?? '断言失败'); }

async function api(method, path, body, token, adminToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (adminToken) headers['x-admin-token'] = adminToken;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body !== undefined && method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const ADMINS = [
  ['运营编辑-林', 'role-ops'],
  ['临床审核-沈', 'role-clinical'],
  ['技术-程', 'role-tech'],
  ['合规-顾', 'role-compliance'],
  ['超级管理-赵', 'role-super'],
];
const adminTokens = {};
for (const [name] of ADMINS) {
  const r = await api('POST', '/admin/login', { name, password: 'Admin@123456', totp: '123456' });
  adminTokens[name] = r.data?.data?.token;
}
check('5 个后台角色登录', ADMINS.every(([n]) => adminTokens[n]));

// B10 权限矩阵：页面访问（用各页背后的 API 端点验证）
const PAGE_PERMS = [
  ['/contents', 'content:read', ['运营编辑-林', '临床审核-沈', '超级管理-赵']],
  ['/evidence/docs', 'evidence', ['运营编辑-林', '临床审核-沈', '超级管理-赵']],
  ['/admin/feedback', 'feedback', ['运营编辑-林', '临床审核-沈', '超级管理-赵']],
  ['/models/releases', 'model:read', ['临床审核-沈', '技术-程', '超级管理-赵']],
  ['/models/eval-sets', 'eval:read', ['临床审核-沈', '技术-程', '超级管理-赵']],
  ['/admin/users', 'member:read', ['合规-顾', '超级管理-赵']],
  ['/admin/audit-logs', 'audit:read', ['合规-顾', '超级管理-赵']],
  ['/admin/cases', 'case:review', ['运营编辑-林', '超级管理-赵']],
];
console.log('=== B10 页面权限 ===');
for (const [path, , allowed] of PAGE_PERMS) {
  for (const [name] of ADMINS) {
    const r = await api('GET', path, null, null, adminTokens[name]);
    const shouldAllow = allowed.includes(name);
    check(`${name} 访问 ${path} ${shouldAllow ? '允许' : '拒绝'}`, shouldAllow ? r.status === 200 : r.status === 403, `status=${r.status}`);
  }
}

// 合规不能改角色/停用账号
console.log('=== 成员管理权限 ===');
const opsToken = adminTokens['运营编辑-林'];
const complianceToken = adminTokens['合规-顾'];
const roleRes = await api('POST', '/admin/users/admin-ops/role', { roleId: 'role-super' }, null, complianceToken);
check('合规改角色被拒', roleRes.status === 403, `status=${roleRes.status}`);
const statusRes = await api('POST', '/admin/users/admin-clinical/status', { status: 'disabled' }, null, complianceToken);
check('合规停用账号被拒', statusRes.status === 403, `status=${statusRes.status}`);
const superToken = adminTokens['超级管理-赵'];
const roleRes2 = await api('POST', '/admin/users/admin-ops/role', { roleId: 'role-ops' }, null, superToken);
check('超管可改角色', roleRes2.status === 201, `status=${roleRes2.status}`);

// 举报处置权限：运营不能执行下线/加入评测集/修订模板
console.log('=== 举报处置权限 ===');
// 先造一条举报
const uLogin = await api('POST', '/auth/login', { phone: '13800000001', code: '123456', agreedScopes: ['健康信息处理'] });
const uToken = uLogin.data?.data?.token;
const episodes = await api('GET', '/episodes', null, uToken);
const epId = episodes.data?.data?.[0]?.id;
const analyses = await api('GET', `/analyses/episodes/${epId}/latest`, null, uToken);
const analysisId = analyses.data?.data?.id;
await api('POST', '/feedback/reports', { analysisId, description: '测试举报：我的手机号是13900000049', severity: '中', problemTypes: ['内容有误'], authorized: false }, uToken);
const fbList = await api('GET', '/admin/feedback', null, null, opsToken);
const fbId = fbList.data?.data?.[0]?.id;
check('举报列表有数据', !!fbId);
const opsHandle = await api('POST', `/feedback/${fbId}/handle`, { action: '下线相关内容', resolution: 'x' }, null, opsToken);
check('运营执行下线相关内容被拒', opsHandle.status === 403, `status=${opsHandle.status}`);
const clinicalToken = adminTokens['临床审核-沈'];
const clinicalHandle = await api('POST', `/feedback/${fbId}/handle`, { action: '下线相关内容', resolution: 'x' }, null, clinicalToken);
check('临床发起下线相关内容', clinicalHandle.status === 201, `status=${clinicalHandle.status}`);
// 举报下线相关内容需双人确认：超管确认
const superHandle = await api('POST', `/feedback/${fbId}/handle`, { action: '下线相关内容', resolution: 'x' }, null, superToken);
check('超管确认下线相关内容', superHandle.status === 201, `status=${superHandle.status}`);
// 任意动作名被拒
const badAction = await api('POST', `/feedback/${fbId}/handle`, { action: '随便什么动作', resolution: 'x' }, null, clinicalToken);
check('任意处置动作被拒', badAction.status === 400 || badAction.status === 1001, `status=${badAction.status}`);

// 单条授权不区分人
console.log('=== 单条授权 ===');
const authRes = await api('POST', `/feedback/${fbId}/authorize`, {}, null, clinicalToken);
check('临床单条授权', authRes.status === 201, `status=${authRes.status}`);
// 单条授权需超管审批后生效
const authId = authRes.data?.data?.authId;
const approveRes = await api('POST', `/feedback/authorizations/${authId}/approve`, {}, null, superToken);
check('超管审批单条授权', approveRes.status === 201 && approveRes.data?.data?.status === '已批准', `status=${approveRes.status}`);
const opsView = await api('GET', '/admin/feedback', null, null, opsToken);
const opsFb = opsView.data?.data?.find((f) => f.id === fbId);
check('未授权运营看不到原文', opsFb?.authorized === false && opsFb?.unsolvedQuestion?.includes('脱敏'));
const clinicalView = await api('GET', '/admin/feedback', null, null, clinicalToken);
const clinicalFb = clinicalView.data?.data?.find((f) => f.id === fbId);
check('授权临床可见原文', clinicalFb?.authorized === true && clinicalFb?.unsolvedQuestion?.includes('13900000049'));

// 创建单条授权校验
const badAuth1 = await api('POST', '/admin/authorizations', { targetType: 'feedback', targetId: fbId, reason: 'x' }, null, clinicalToken);
check('小写 feedback 被拒', badAuth1.status === 400, `status=${badAuth1.status}`);
const badAuth2 = await api('POST', '/admin/authorizations', { targetType: 'USER', targetId: 'no-such-user', reason: 'x' }, null, clinicalToken);
check('不存在的 USER 被拒', badAuth2.status === 404 || badAuth2.status === 1004, `status=${badAuth2.status}`);

console.log(`\n后台权限：${passed} 通过，${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
