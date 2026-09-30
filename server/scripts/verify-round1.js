/* 第一轮反馈综合验证脚本 */
const http = require('http');

const BASE = process.env.BASE ?? 'http://localhost:3400';
let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}: ${detail ?? ''}`);
  }
}

function req(method, path, body, token, adminToken) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (adminToken) headers['X-Admin-Token'] = adminToken;
    const r = http.request(`${BASE}${path}`, { method, headers }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch {
          resolve({ status: res.statusCode, body: b });
        }
      });
    });
    r.on('error', reject);
    if (data) r.end(data);
    else r.end();
  });
}

async function loginAdmin(name) {
  const r = await req('POST', '/admin/login', { name, password: 'Admin@123456', totp: '123456' });
  return r.body.data?.token;
}

(async () => {
  console.log('== 用户端 ==');
  // F2: 登录带同意
  const phone = '139' + String(Date.now()).slice(-8);
  const login = await req('POST', '/auth/login', { phone, code: '123456', agreedScopes: ['健康信息处理'] });
  const token = login.body.data?.token;
  check('F2 登录后同意已写入', login.body.data?.consents?.[0]?.granted === true);

  // F1: 记录今天自动建病程
  const log = await req('POST', '/episodes', { title: '验证病程' }, token);
  const episodeId = log.body.data?.id;
  const logToday = await req('POST', `/episodes/${episodeId}/symptom-logs`, {
    occurredAt: new Date().toISOString(), sitMinutes: 45, legChange: '没有', changeVsYesterday: '差不多', activitiesDone: '步行',
  }, token);
  check('F1/F39 记录今天保存成功', logToday.body.code === 0 && logToday.body.data?.sitMinutes === 45);

  // F3: 问答
  const ev = await req('POST', `/episodes/${episodeId}/events`, {
    eventType: '报告', occurredAt: new Date().toISOString(), sourceType: '报告原文', rawText: '腰椎 MRI：L5/S1 椎间盘突出。',
  }, token);
  await req('POST', '/reports', { careEventId: ev.body.data.id, sourceType: '报告原文', rawText: '腰椎 MRI：L5/S1 椎间盘突出。' }, token);
  const an = await req('POST', '/analyses', { episodeId }, token);
  check('F4 提交分析返回 202', an.status === 202 && an.body.data?.taskId);
  // 等待 worker
  let analysis = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await req('GET', `/analyses/${an.body.data.taskId}`, null, token);
    if (res.body.data?.status === '完成') { analysis = res.body.data.analysis; break; }
  }
  check('分析完成', !!analysis);
  if (analysis) {
    const session = await req('POST', '/qa/sessions', { analysisId: analysis.id, title: '验证' }, token);
    const qa = await req('POST', `/qa/sessions/${session.body.data.id}/messages`, { question: 'L5/S1 是什么意思？' }, token);
    check('F3 问答有回复', qa.body.code === 0 && qa.body.data?.message?.content?.length > 0);
    // F4: 红旗问答
    const qa2 = await req('POST', `/qa/sessions/${session.body.data.id}/messages`, { question: '我现在大小便失禁了，鞍区也麻木' }, token);
    check('F4 红旗问答有就医提示', qa2.body.data?.outOfScope?.length > 0);
    // F34: 是不是很严重 不被拒
    const qa3 = await req('POST', `/qa/sessions/${session.body.data.id}/messages`, { question: '硬膜囊受压，是不是很严重？' }, token);
    check('F34 "是不是很严重"不被拒答', qa3.body.code === 0 && (qa3.body.data?.outOfScope?.length ?? 0) === 0);
  }

  // F4: 红旗阻断
  const an2 = await req('POST', '/analyses', { episodeId, safetyText: '大小便失禁，鞍区麻木' }, token);
  check('F4 红旗提交被阻断', an2.body.data?.status === 'blocked' || an2.body.data?.safety?.redFlags?.length > 0);

  // F25: 撤回同意后问答被阻断
  await req('POST', '/auth/consents', { scope: '健康信息处理', granted: 'false' }, token);
  const qa4 = await req('POST', '/qa/sessions', { analysisId: analysis?.id ?? 'x', title: 't' }, token);
  check('F25 撤回后问答被阻断', qa4.body.code === 1003);

  console.log('== 权限与安全 ==');
  // F20: 越权返回 1003
  const superToken = await loginAdmin('超级管理-赵');
  const opsToken = await loginAdmin('运营编辑-林');
  const forbidden = await req('GET', '/admin/audit-logs', null, null, opsToken);
  check('F20 越权返回 1003', forbidden.status === 403 && forbidden.body.code === 1003);

  // F10: 普通用户不能访问后台接口
  const userAdmin = await req('GET', '/feedback', null, token);
  check('F10 普通用户不能访问后台反馈', userAdmin.body.code === 1002 || userAdmin.body.code === 1003);

  // F16: 审计有操作人名称与角色
  const logs = await req('GET', '/admin/audit-logs', null, null, superToken);
  const loginLog = logs.body.data?.find((l) => l.action === 'admin:login' && l.actorName);
  check('F16 审计有操作人名称', !!loginLog?.actorName);
  check('F16 审计有角色', !!loginLog?.actorRole);
  check('F16 审计有 requestId', !!loginLog?.requestId);

  // F16: 单条授权写入授权表
  await req('POST', '/admin/authorizations', { targetType: 'USER', targetId: 'u1', reason: '验证授权' }, null, superToken);
  const authList = await req('GET', '/admin/authorizations', null, null, superToken);
  check('F16 单条授权写入授权表', authList.body.data?.length > 0);

  // F48: 哈希链校验
  const verify = await req('GET', '/admin/audit-logs/verify', null, null, superToken);
  check('F48 哈希链校验通过', verify.body.data?.valid === true);

  // F15: 开关生效
  await req('POST', '/switches', { key: '视频推荐', enabled: 'false', reason: '验证关闭' }, null, superToken);
  const swList = await req('GET', '/switches', null, null, superToken);
  const videoSw = swList.body.data?.find((s) => s.key === '视频推荐');
  check('F15 开关关闭生效', videoSw?.enabled === false);
  await req('POST', '/switches', { key: '视频推荐', enabled: 'true', reason: '恢复' }, null, superToken);

  // F13: 停用账号后旧令牌失效
  await req('POST', '/admin/users/admin-ops/status', { status: 'disabled' }, null, superToken);
  const disabledOps = await req('GET', '/admin/audit-logs', null, null, opsToken);
  check('F13 停用后旧令牌失效', disabledOps.body.code === 1002);
  await req('POST', '/admin/users/admin-ops/status', { status: 'active' }, null, superToken);

  console.log('== 错误码 ==');
  // F19: 验证码错误
  const badCode = await req('POST', '/auth/login', { phone: '13900000001', code: '999999' });
  check('F19 验证码错误返回 2001', badCode.body.code === 2001);
  // F44: 404 中文
  const notFound = await req('GET', '/api/nonexistent-path');
  check('F44 404 中文提示', notFound.body.message === '接口不存在');
  // F22: 批量下线空
  const emptyBatch = await req('POST', '/contents/batch-offline', {}, null, superToken);
  check('F22 批量下线空返回 400', emptyBatch.status === 400);

  console.log(`\n验证完成：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();
