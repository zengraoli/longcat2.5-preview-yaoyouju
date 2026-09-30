/**
 * 第五轮验收：后台 5 角色 + 双人确认三轮 + 门禁发布 + 授权审批 + 审计导出
 * 需在全新数据库上运行（server + worker 已启动）。
 */
const BASE = 'http://localhost:3400';
let passed = 0;
let failed = 0;
function ok(n) { passed++; console.log(`  ✓ ${n}`); }
function fail(n, e) { failed++; console.error(`  ✗ ${n}: ${e}`); }
function check(n, c, d) { if (c) ok(n); else fail(n, d ?? '断言失败'); }

async function api(method, p, body, token, headers = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) {
    h['x-admin-token'] = token;
    h['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${p}`, { method, headers: h, body: body !== undefined && method !== 'GET' ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function main() {
  const names = ['运营编辑-林', '临床审核-沈', '技术-程', '合规-顾', '超级管理-赵'];
  const T = {};
  for (const name of names) {
    const r = await api('POST', '/admin/login', { name, password: 'Admin@123456', totp: '123456' });
    T[name] = r.data?.data?.token;
    check(`${name} 登录`, !!T[name]);
  }
  const ops = T['运营编辑-林'], clinical = T['临床审核-沈'], tech = T['技术-程'], compliance = T['合规-顾'], sup = T['超级管理-赵'];

  // 1. 仪表盘 / 开关 / 安全事件对所有角色可用
  console.log('=== 仪表盘与开关 ===');
  for (const name of names) {
    const d = await api('GET', '/admin/dashboard', null, T[name]);
    const sw = d.data?.data?.switches ?? [];
    check(`${name} 仪表盘返回开关`, d.status === 200 && sw.length === 4, `status=${d.status} switches=${sw.length}`);
  }
  const evs = await api('GET', '/admin/safety-events', null, tech);
  check('安全事件接口可用', evs.status === 200 && Array.isArray(evs.data?.data));
  const tips = await api('GET', '/safety/tips');
  check('就医提示含 7 类且版本 RF-v5', tips.data?.data?.redFlags?.length === 7 && tips.data?.data?.rulesetVersion === 'RF-v5');

  // 2. 开关双人确认：连续三轮
  console.log('=== 开关双人确认（三轮）===');
  for (let round = 1; round <= 3; round++) {
    const enabled = round % 2 === 1;
    const first = await api('POST', '/switches', { key: '个性化分析', enabled: String(enabled), reason: `第${round}轮` }, tech);
    check(`第${round}轮技术发起`, first.data?.data?.status === '待第二人确认', JSON.stringify(first.data?.data));
    const self = await api('POST', '/switches', { key: '个性化分析', enabled: String(enabled), reason: `第${round}轮` }, tech);
    check(`第${round}轮同一人不能确认`, self.status === 409, JSON.stringify(self.data));
    const second = await api('POST', '/switches', { key: '个性化分析', enabled: String(!enabled), reason: `第${round}轮` }, clinical);
    check(`第${round}轮临床确认按发起值生效`, second.data?.data?.status === '已生效' && second.data?.data?.switches?.find((s) => s.key === '个性化分析')?.enabled === enabled, JSON.stringify(second.data?.data));
  }

  // 3. 运营可新建证据（不再 403）
  console.log('=== 证据库权限 ===');
  const ev = await api('POST', '/evidence/docs', { title: '运营录入证据', sourceType: '审核科普', content: '测试证据内容。' }, ops);
  check('运营可新建证据', ev.status === 201, `status=${ev.status} ${JSON.stringify(ev.data)}`);
  const evId = ev.data?.data?.id;
  const verifyEv = await api('POST', `/evidence/docs/${evId}/verify`, {}, clinical);
  check('临床可核实/启用证据', verifyEv.status === 201 && verifyEv.data?.data?.active === true);
  const deact = await api('POST', `/evidence/docs/${evId}/deactivate`, {}, clinical);
  check('临床可停用证据', deact.status === 201);

  // 4. 审计导出：合规申请 → 超管批准 → 合规导出
  console.log('=== 审计导出审批 ===');
  const req = await api('POST', '/admin/audit-logs/export-requests', { reason: '合规检查' }, compliance);
  check('合规发起导出申请', req.status === 201 && !!req.data?.data?.id);
  const before = await api('GET', '/admin/audit-logs/export', null, compliance);
  check('未批准前合规导出被拒', before.status === 403, `status=${before.status}`);
  const approve = await api('POST', `/admin/audit-logs/export-requests/${req.data.data.id}/approve`, {}, sup);
  check('超管批准导出申请', approve.status === 201 && approve.data?.data?.status === '已批准');
  const after = await api('GET', '/admin/audit-logs/export', null, compliance);
  check('批准后合规可导出', after.status === 200 && typeof after.data?.data?.csv === 'string', `status=${after.status}`);
  const supExport = await api('GET', '/admin/audit-logs/export', null, sup);
  check('超管可直接导出', supExport.status === 200);

  // 5. 模型发布门禁：修复用例后三轮双人确认发布
  console.log('=== 模型发布（修复用例 + 三轮双人）===');
  for (let round = 1; round <= 3; round++) {
    const rel = await api('POST', '/models/releases', { modelName: `m${round}`, promptVersion: 'prompt-p2', retrievalStrategy: 'keyword-v2', contentLibVersion: 'content-c2' }, tech);
    const rid = rel.data?.data?.id;
    await api('POST', `/models/releases/${rid}/eval`, {}, tech);
    const sets = await api('GET', '/models/eval-sets', null, tech);
    for (const s of sets.data.data) {
      const cs = await api('GET', `/models/eval-sets/${s.id}/cases`, null, tech);
      for (const c of cs.data.data) {
        if (c.result === '不通过') await api('POST', `/models/eval-cases/${c.id}/fix`, {}, tech);
      }
    }
    const first = await api('POST', `/models/releases/${rid}/publish`, {}, tech);
    check(`第${round}轮技术发起发布`, first.data?.data?.status === '待第二人确认', JSON.stringify(first.data));
    const self = await api('POST', `/models/releases/${rid}/publish`, {}, tech);
    check(`第${round}轮同一人不能确认`, self.status === 409, JSON.stringify(self.data));
    const second = await api('POST', `/models/releases/${rid}/publish`, {}, sup);
    check(`第${round}轮超管确认发布成功`, second.data?.data?.status === '生效', JSON.stringify(second.data?.data));
  }

  // 6. 举报单条授权：先由用户提交举报，再临床申请 → 超管审批 → 可见原文
  console.log('=== 单条授权审批 ===');
  const uLogin = await api('POST', '/auth/login', { phone: '13700000001', code: '123456', agreedScopes: ['健康信息处理'] });
  const uToken = uLogin.data?.data?.token;
  const ep = await api('POST', '/episodes', { title: '腰痛' }, uToken);
  await api('POST', `/episodes/${ep.data?.data?.id}/events`, { eventType: '症状', occurredAt: new Date().toISOString(), sourceType: '自述', rawText: '久坐后腰部酸痛。', verifyStatus: '已确认' }, uToken);
  const an = await api('POST', '/analyses', { episodeId: ep.data?.data?.id }, uToken);
  let analysisId = null;
  for (let i = 0; i < 30; i++) {
    const r = await api('GET', `/analyses/${an.data?.data?.taskId}`, null, uToken);
    if (r.data?.data?.status === '完成') { analysisId = r.data.data.analysis.id; break; }
    await new Promise((res) => setTimeout(res, 500));
  }
  await api('POST', '/feedback/reports', { analysisId, description: '举报：手机号13900000049', severity: '中' }, uToken);
  check('用户提交举报成功', !!analysisId, `analysisId=${analysisId}`);
  const fb = await api('GET', '/admin/feedback', null, clinical);
  const fbId = fb.data?.data?.[0]?.id;
  if (fbId) {
    const reqAuth = await api('POST', `/feedback/${fbId}/authorize`, {}, clinical);
    check('临床申请单条授权', reqAuth.status === 201 && reqAuth.data?.data?.status === '待审批');
    const listBefore = await api('GET', '/admin/feedback', null, clinical);
    check('未审批前看不到原文', listBefore.data?.data?.find((f) => f.id === fbId)?.authorized === false);
    await api('POST', `/feedback/authorizations/${reqAuth.data.data.authId}/approve`, {}, sup);
    const listAfter = await api('GET', '/admin/feedback', null, clinical);
    check('审批后可看原文', listAfter.data?.data?.find((f) => f.id === fbId)?.authorized === true);
  } else {
    check('存在举报数据', false, '无举报数据');
  }

  console.log(`\n后台综合：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('脚本错误:', e); process.exit(1); });
