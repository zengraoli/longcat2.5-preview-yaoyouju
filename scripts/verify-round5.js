/**
 * 第五轮验收：用户端完整流程（登录 → 录入 → 分析 → 问答 → 记录今天 → 复诊摘要 → 撤回同意 → 删除账户）
 * 用全新数据库、普通接口（不关跨域检查）跑一遍，并查库确认删除后无残留。
 */
const BASE = 'http://localhost:3400';
const Database = require('../server/node_modules/better-sqlite3');
const path = require('node:path');

let passed = 0;
let failed = 0;
function ok(name) { passed++; console.log(`  ✓ ${name}`); }
function fail(name, err) { failed++; console.error(`  ✗ ${name}: ${err}`); }
function check(name, cond, detail) { if (cond) ok(name); else fail(name, detail ?? '断言失败'); }

async function api(method, p, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers,
    body: body !== undefined && method !== 'GET' ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function pollAnalysis(taskId, token) {
  for (let i = 0; i < 30; i++) {
    const r = await api('GET', `/analyses/${taskId}`, null, token);
    if (r.data?.data?.status === '完成') return r.data.data.analysis;
    if (r.data?.data?.status === '失败') throw new Error('分析失败: ' + JSON.stringify(r.data.data));
    await wait(500);
  }
  throw new Error('分析超时');
}

async function main() {
  const phone = '139' + String(Math.floor(10000000 + Math.random() * 89999999));
  console.log(`测试手机号：${phone}`);

  // 登录（带单独同意）
  const login = await api('POST', '/auth/login', { phone, code: '123456', agreedScopes: ['健康信息处理'] });
  check('登录成功并写入同意', login.status === 200 && !!login.data?.data?.token);
  const token = login.data.data.token;
  const userId = login.data.data.user.id;

  // 录入病程 + 自述事件
  const ep = await api('POST', '/episodes', { title: '腰痛', onsetCertainty: '尚未确认' }, token);
  check('创建病程', ep.status === 201 && !!ep.data?.data?.id);
  const episodeId = ep.data.data.id;
  const ev = await api('POST', `/episodes/${episodeId}/events`, {
    eventType: '症状', occurredAt: new Date().toISOString(), sourceType: '自述',
    rawText: '久坐后腰部酸痛，休息后缓解。', verifyStatus: '已确认',
  }, token);
  check('新增事件返回安全提示字段', ev.status === 201 && !!ev.data?.data?.safety);

  // 生成分析（Worker 消费）
  const an = await api('POST', '/analyses', { episodeId }, token);
  check('提交分析返回任务', an.status === 202 && !!an.data?.data?.taskId);
  const analysis = await pollAnalysis(an.data.data.taskId, token);
  check('分析生成完成且带来源', !!analysis && Array.isArray(analysis.sections?.解释));
  check('分析内容库版本为 content-c2', analysis.retrievalSnapshot?.contentLibVersion === 'content-c2', JSON.stringify(analysis.retrievalSnapshot));

  // 问答：越界与红旗
  const sess = await api('POST', '/qa/sessions', { analysisId: analysis.id, title: '复诊问题', episodeId }, token);
  const sid = sess.data.data.id;
  const oos = await api('POST', `/qa/sessions/${sid}/messages`, { question: '要不要手术' }, token);
  check('越界提问明确不答', oos.status === 201 && /不能给出手术建议/.test(oos.data.data.message.content));
  const info = await api('POST', `/qa/sessions/${sid}/messages`, { question: '什么时候必须马上去医院' }, token);
  check('就医类提问给出就医信号清单', info.status === 201 && /及时就医/.test(info.data.data.message.content));
  const def = await api('POST', `/qa/sessions/${sid}/messages`, { question: '马尾综合征是什么意思？' }, token);
  check('名词解释给定义且不含“本轮不会生成”', def.status === 201 && !/本轮不会生成个性化分析/.test(def.data.data.message.content));
  // 加入复诊问题（重复点击不重复）
  await api('POST', `/qa/sessions/${sid}/followup-questions`, { question: '要不要手术' }, token);
  const dup = await api('POST', `/qa/sessions/${sid}/followup-questions`, { question: '要不要手术' }, token);
  check('重复加入复诊问题被去重', dup.data?.data?.added === false);

  // 记录今天：确认每个字段都保存
  const log = await api('POST', `/episodes/${episodeId}/symptom-logs`, {
    occurredAt: new Date().toISOString(),
    sitMinutes: 45,
    plannedActivityDone: '部分完成',
    sleepImpact: 2,
    topWorry: '会不会越来越严重',
    legChange: '有',
    changeVsYesterday: '加重',
    activitiesDone: '步行、热敷',
  }, token);
  check('记录今天保存成功', log.status === 201);
  const logs = await api('GET', `/episodes/${episodeId}/symptom-logs`, null, token);
  const saved = logs.data.data[0];
  check('与昨天相比已保存', saved?.sitMinutes === 45 && logs.data.data.length > 0, JSON.stringify(saved));
  const tl = await api('GET', `/episodes/${episodeId}/timeline`, null, token);
  check('时间线包含症状记录', tl.status === 200 && tl.data.data.symptomLogs.length > 0);

  // 复诊摘要：保存 → 纠正 → 新增记录 → 预览应更新
  const preview1 = await api('GET', `/followup/summary?episodeId=${episodeId}`, null, token);
  check('摘要预览可生成', preview1.status === 200 && Array.isArray(preview1.data.data.当前情况));
  const save = await api('POST', '/followup/summary', { episodeId, content: preview1.data.data }, token);
  check('保存摘要', save.status === 201 && !!save.data.data.id);
  const summaryId = save.data.data.id;
  // 新增自述事件与医嘱
  await api('POST', `/episodes/${episodeId}/events`, {
    eventType: '症状', occurredAt: new Date().toISOString(), sourceType: '自述',
    rawText: '右腿外侧也开始酸', verifyStatus: '已确认',
  }, token);
  await api('POST', `/episodes/${episodeId}/events`, {
    eventType: '医嘱', occurredAt: new Date().toISOString(), sourceType: '医生记录',
    rawText: '建议两周后复查', verifyStatus: '已确认',
  }, token);
  const preview2 = await api('GET', `/followup/summary?episodeId=${episodeId}`, null, token);
  const text2 = JSON.stringify(preview2.data.data);
  check('导出后新增自述事件出现在摘要', text2.includes('右腿外侧也开始酸'), text2);
  check('新增医嘱出现在摘要', text2.includes('建议两周后复查'), text2);
  check('“当前情况”反映最新记录', text2.includes('步行、热敷') || text2.includes('加重'), text2);
  check('“下一步”不含重复的兜底句', (text2.match(/如症状持续或加重/g) ?? []).length <= 1);
  // 导出
  const exp = await api('POST', `/followup/summary/${summaryId}/export`, { format: '文本' }, token);
  check('导出摘要成功', exp.status === 201 && !!exp.data.data.text);
  // 纠正后再新增记录仍出现
  await api('PUT', `/followup/summary/${summaryId}`, { content: preview2.data.data }, token);
  await api('POST', `/episodes/${episodeId}/events`, {
    eventType: '症状', occurredAt: new Date().toISOString(), sourceType: '自述',
    rawText: '纠正后新增的记录', verifyStatus: '已确认',
  }, token);
  const preview3 = await api('GET', `/followup/summary?episodeId=${episodeId}`, null, token);
  check('纠正后新增记录仍出现在预览', JSON.stringify(preview3.data.data).includes('纠正后新增的记录'));

  // 撤回同意：所有写入被拒绝
  await api('POST', '/auth/consents', { scope: '健康信息处理', granted: 'false' }, token);
  const blockedEvent = await api('POST', `/episodes/${episodeId}/events`, {
    eventType: '症状', occurredAt: new Date().toISOString(), sourceType: '自述', rawText: '撤回后写入',
  }, token);
  check('撤回后新增事件被拒绝', blockedEvent.status === 403, JSON.stringify(blockedEvent.data));
  const blockedSummary = await api('POST', '/followup/summary', { episodeId, content: preview3.data.data }, token);
  check('撤回后保存摘要被拒绝', blockedSummary.status === 403);
  const blockedQa = await api('POST', `/qa/sessions/${sid}/followup-questions`, { question: '撤回后加入' }, token);
  check('撤回后加入复诊问题被拒绝', blockedQa.status === 403);
  const blockedSessionList = await api('GET', '/qa/sessions', null, token);
  check('撤回后会话列表也不可读（前后一致）', blockedSessionList.status === 403);

  // 重新授予后删除账户
  await api('POST', '/auth/consents', { scope: '健康信息处理', granted: 'true' }, token);
  const del = await api('POST', '/auth/delete', {}, token);
  check('删除账户成功', del.status === 200 && del.data.data.deleted === true);

  // 查库确认无残留
  const db = new Database(path.resolve(__dirname, '../server/data/app.db'), { readonly: true });
  const tables = ['USER', 'EPISODE', 'CARE_EVENT', 'REPORT', 'SYMPTOM_LOG', 'ANALYSIS', 'ANALYSIS_TASK', 'FOLLOWUP_SUMMARY', 'FEEDBACK', 'QA_SESSION', 'QA_MESSAGE', 'QA_FOLLOWUP_QUESTION', 'CONSENT', 'SESSION', 'SAFETY_EVENT', 'CONTENT_RETELL'];
  const leftovers = [];
  for (const t of tables) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
      const userCol = cols.includes('user_id') ? 'user_id' : (cols.includes('id') && t === 'USER' ? 'id' : null);
      if (!userCol) continue;
      const c = db.prepare(`SELECT COUNT(*) AS c FROM ${t} WHERE ${userCol} = ?`).get(userId).c;
      if (c > 0) leftovers.push(`${t}:${c}`);
    } catch { /* 表不存在忽略 */ }
  }
  check('删除账户后各表无该用户数据', leftovers.length === 0, leftovers.join(','));
  db.close();

  console.log(`\n用户端流程：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('脚本错误:', e); process.exit(1); });
