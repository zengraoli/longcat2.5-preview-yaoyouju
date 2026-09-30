/**
 * 第四轮验收反馈接口复查脚本（v0.70–v0.74 修复验证）
 * 用法：node verify.tmp.js（需先启动 server 与 worker，全新数据库）
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
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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
async function adminLogin(name) {
  const r = await api('POST', '/admin/login', { name, password: 'Admin@123456', totp: '123456' });
  return r.data?.data?.token;
}

async function main() {
  console.log('=== 用户端主流程 ===');
  // 登录（新手机号）
  const phone = '13900000077';
  await api('POST', '/auth/sms-code', { phone });
  const login = await api('POST', '/auth/login', { phone, code: '123456', agreedScopes: ['健康信息处理'] });
  const token = login.data?.data?.token;
  check('登录返回令牌', !!token);
  check('登录写入同意', login.data?.data?.consents?.find((c) => c.scope === '健康信息处理')?.granted === true);

  // 录入报告
  const ep = await api('POST', '/episodes', { title: '腰痛', onsetDate: '2026-09-01', onsetCertainty: '已确认' }, token);
  const episodeId = ep.data?.data?.id;
  check('创建病程', !!episodeId);
  const ev = await api('POST', `/episodes/${episodeId}/events`, {
    eventType: '报告', occurredAt: new Date().toISOString(), sourceType: '报告原文',
    rawText: '腰椎MRI：L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。',
  }, token);
  const eventId = ev.data?.data?.id;
  await api('POST', '/reports', { careEventId: eventId, reportDate: '2026-09-20', sourceType: '报告原文', rawText: '腰椎MRI：L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。' }, token);
  check('录入报告', !!eventId);

  // 生成分析
  const an = await api('POST', '/analyses', { episodeId }, token);
  check('提交分析返回任务', an.data?.data?.taskId);
  const taskId = an.data?.data?.taskId;
  // 等待 worker 完成
  let analysis = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const r = await api('GET', `/analyses/${taskId}`, null, token);
    if (r.data?.data?.status === '完成') { analysis = r.data.data.analysis; break; }
  }
  check('分析生成完成', !!analysis);
  check('分析含五段', analysis && ['已知', '解释', '未知', '下一步', '视频'].every((k) => k in analysis.sections));
  check('分析含模型名', !!analysis?.modelName);
  check('分析含内容库版本', !!analysis?.contentLibVersion);
  check('分析解释不带固定前缀', analysis?.sections?.解释?.every((s) => !s.text.startsWith('关于你资料中提到的')));

  // 问与解释（含越界提问）
  const session = await api('POST', '/qa/sessions', { analysisId: analysis.id, title: '测试' }, token);
  const sessionId = session.data?.data?.id;
  check('创建问答会话', !!sessionId);
  const qa1 = await api('POST', `/qa/sessions/${sessionId}/messages`, { question: '要不要做手术' }, token);
  check('越界提问被拒答', qa1.data?.data?.outOfScope?.length > 0);
  const qa2 = await api('POST', `/qa/sessions/${sessionId}/messages`, { question: '控制不了大小便怎么办' }, token);
  check('红旗提问触发就医提示', qa2.data?.data?.outOfScope?.length > 0);
  const qa3 = await api('POST', `/qa/sessions/${sessionId}/messages`, { question: '哪些变化要提前就医？' }, token);
  check('就医信号问题有实质回答', qa3.data?.data?.message?.content?.includes('就医'));
  // 越界提问后分析仍可提交（不再阻断）
  const an2 = await api('POST', '/analyses', { episodeId }, token);
  check('越界提问后分析不被阻断', an2.data?.data?.status !== 'blocked');

  // 记录今天（含红旗）
  const log1 = await api('POST', `/episodes/${episodeId}/symptom-logs`, {
    occurredAt: new Date().toISOString(), sitMinutes: 30, topWorry: '今天开始大小便失禁，会阴麻木',
  }, token);
  check('记录今天保存', !!log1.data?.data?.id);
  // 红旗记录应阻断分析
  const an3 = await api('POST', '/analyses', { episodeId }, token);
  check('红旗记录阻断分析', an3.data?.data?.status === 'blocked');

  // 复诊摘要（导出后再新增记录，确认摘要更新）
  const preview1 = await api('GET', `/followup/summary?episodeId=${episodeId}`, null, token);
  check('摘要预览返回', !!preview1.data?.data);
  const saved = await api('POST', '/followup/summary', { episodeId, content: preview1.data.data }, token);
  const summaryId = saved.data?.data?.id;
  const exp = await api('POST', `/followup/summary/${summaryId}/export`, { format: 'PDF' }, token);
  check('导出摘要', !!exp.data?.data?.text);
  // 新增记录
  await api('POST', `/episodes/${episodeId}/events`, {
    eventType: '医嘱', occurredAt: new Date().toISOString(), sourceType: '医生记录', rawText: '医生建议保守治疗 4 周。',
  }, token);
  const preview2 = await api('GET', `/followup/summary?episodeId=${episodeId}`, null, token);
  check('导出后新增记录摘要更新', JSON.stringify(preview2.data.data) !== JSON.stringify(preview1.data.data));
  check('摘要含新增医嘱', preview2.data.data.医嘱要点?.some((s) => s.text.includes('保守治疗')));

  // 删除账户（需登录态；删除后会话一并清除）
  const del = await api('POST', '/auth/delete', {}, token);
  check('删除账户返回', del.status === 200);
  const meAfter = await api('GET', '/auth/me', null, token);
  check('删除账户后令牌失效', meAfter.status === 401);

  // 退出登录（另一账号验证令牌失效）
  const login2 = await api('POST', '/auth/login', { phone: '13900000088', code: '123456', agreedScopes: ['健康信息处理'] });
  const token2 = login2.data?.data?.token;
  await api('POST', '/auth/logout', {}, token2);
  const me2 = await api('GET', '/auth/me', null, token2);
  check('退出登录后令牌失效', me2.status === 401);

  console.log(`\n用户端：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('脚本错误:', e); process.exit(1); });
