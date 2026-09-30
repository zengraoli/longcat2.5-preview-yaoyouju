/**
 * 双人确认复查：每种操作连续做两轮，确认第二轮也需要两个人
 * （修复点：发起记录被消费，不能由同一人确认，也不能复用上一轮的发起记录）
 */
const BASE = 'http://localhost:3400';
let passed = 0;
let failed = 0;
function ok(name) { passed++; console.log(`  ✓ ${name}`); }
function fail(name, err) { failed++; console.error(`  ✗ ${name}: ${err}`); }
function check(name, cond, detail) { if (cond) ok(name); else fail(name, detail ?? '断言失败'); }

async function api(method, path, body, adminToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminToken) headers['x-admin-token'] = adminToken;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body !== undefined && method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined });
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const T = {};
for (const name of ['运营编辑-林', '临床审核-沈', '技术-程', '合规-顾', '超级管理-赵']) {
  const r = await api('POST', '/admin/login', { name, password: 'Admin@123456', totp: '123456' });
  T[name] = r.data?.data?.token;
}

async function newContent() {
  const c = await api('POST', '/contents', { type: '视频', title: '双人确认测试内容', script: '脚本' }, T['运营编辑-林']);
  const id = c.data?.data?.id;
  await api('POST', `/contents/${id}/transition`, { action: '提交审核' }, T['运营编辑-林']);
  await api('POST', `/contents/${id}/transition`, { action: '通过' }, T['临床审核-沈']);
  return id;
}

async function expectPending(name, fn) {
  const r = await fn();
  check(`${name} 返回待第二人确认`, r.data?.data?.pending === '待第二人确认' || r.data?.data?.status === '待第二人确认', JSON.stringify(r.data?.data));
}

async function main() {
  // 1. 内容发布两轮
  console.log('=== 内容发布（双人）===');
  let id = await newContent();
  await expectPending('运营发起发布', () => api('POST', `/contents/${id}/publish`, {}, T['运营编辑-林']));
  const pub1 = await api('POST', `/contents/${id}/publish`, {}, T['临床审核-沈']);
  check('临床确认发布成功', pub1.data?.data?.status === '已发布', JSON.stringify(pub1.data?.data));
  // 第二轮：更正后重新发布（运营发起 → 临床确认）
  await api('POST', `/contents/${id}/transition`, { action: '更正' }, T['运营编辑-林']);
  await api('POST', `/contents/${id}/transition`, { action: '更正' }, T['临床审核-沈']);
  await api('POST', `/contents/${id}/transition`, { action: '提交审核' }, T['运营编辑-林']);
  await api('POST', `/contents/${id}/transition`, { action: '通过' }, T['临床审核-沈']);
  await expectPending('第二轮运营发起发布', () => api('POST', `/contents/${id}/publish`, {}, T['运营编辑-林']));
  const pub2 = await api('POST', `/contents/${id}/publish`, {}, T['临床审核-沈']);
  check('第二轮临床确认发布成功', pub2.data?.data?.status === '已发布', JSON.stringify(pub2.data?.data));

  // 2. 内容撤回两轮（用新内容，避免上一轮的待确认记录干扰）
  console.log('=== 内容撤回（双人）===');
  let idR = await newContent();
  await api('POST', `/contents/${idR}/publish`, {}, T['运营编辑-林']);
  await api('POST', `/contents/${idR}/publish`, {}, T['临床审核-沈']);
  await expectPending('临床发起撤回', () => api('POST', `/contents/${idR}/transition`, { action: '撤回' }, T['临床审核-沈']));
  await api('POST', `/contents/${idR}/transition`, { action: '撤回' }, T['超级管理-赵']);
  // 重新发布
  await api('POST', `/contents/${idR}/transition`, { action: '更正' }, T['运营编辑-林']);
  await api('POST', `/contents/${idR}/transition`, { action: '更正' }, T['临床审核-沈']);
  await api('POST', `/contents/${idR}/transition`, { action: '提交审核' }, T['运营编辑-林']);
  await api('POST', `/contents/${idR}/transition`, { action: '通过' }, T['临床审核-沈']);
  const rp1 = await api('POST', `/contents/${idR}/publish`, {}, T['运营编辑-林']);
  const rp2 = await api('POST', `/contents/${idR}/publish`, {}, T['临床审核-沈']);
  console.log('  [debug] 重新发布:', JSON.stringify(rp1.data?.data), JSON.stringify(rp2.data?.data));
  // 第二轮撤回：超管一个人点 → 待第二人确认
  await expectPending('第二轮超管发起撤回', () => api('POST', `/contents/${idR}/transition`, { action: '撤回' }, T['超级管理-赵']));
  const off2 = await api('POST', `/contents/${idR}/transition`, { action: '撤回' }, T['临床审核-沈']);
  check('第二轮临床确认撤回成功', off2.data?.data?.currentStatus === '已撤回', JSON.stringify(off2.data?.data));

  // 3. 取消下线两轮
  console.log('=== 取消下线（双人）===');
  await api('POST', `/contents/${id}/transition`, { action: '撤回' }, T['临床审核-沈']);
  await api('POST', `/contents/${id}/transition`, { action: '撤回' }, T['超级管理-赵']);
  // 重新发布后下线
  await api('POST', `/contents/${id}/transition`, { action: '更正' }, T['运营编辑-林']);
  await api('POST', `/contents/${id}/transition`, { action: '更正' }, T['临床审核-沈']);
  await api('POST', `/contents/${id}/transition`, { action: '提交审核' }, T['运营编辑-林']);
  await api('POST', `/contents/${id}/transition`, { action: '通过' }, T['临床审核-沈']);
  await api('POST', `/contents/${id}/publish`, {}, T['运营编辑-林']);
  await api('POST', `/contents/${id}/publish`, {}, T['临床审核-沈']);
  await api('POST', `/contents/${id}/offline`, {}, T['临床审核-沈']);
  await api('POST', `/contents/${id}/offline`, {}, T['超级管理-赵']);
  // 取消下线：临床一个人点 → 待第二人确认
  await expectPending('临床发起取消下线', () => api('POST', `/contents/${id}/restore`, {}, T['临床审核-沈']));
  const restore2 = await api('POST', `/contents/${id}/restore`, {}, T['超级管理-赵']);
  check('超管确认取消下线成功', restore2.data?.data?.currentStatus === '已发布', JSON.stringify(restore2.data?.data));

  // 4. 批量下线两轮
  console.log('=== 批量下线（双人）===');
  const id2 = await newContent();
  await api('POST', `/contents/${id2}/publish`, {}, T['运营编辑-林']);
  await api('POST', `/contents/${id2}/publish`, {}, T['临床审核-沈']);
  await expectPending('临床发起批量下线', () => api('POST', '/contents/batch-offline', { itemIds: [id, id2] }, T['临床审核-沈']));
  await api('POST', '/contents/batch-offline', { itemIds: [id, id2] }, T['超级管理-赵']);
  // 重新发布后第二轮批量下线
  for (const cid of [id, id2]) {
    await api('POST', `/contents/${cid}/transition`, { action: '更正' }, T['运营编辑-林']);
    await api('POST', `/contents/${cid}/transition`, { action: '更正' }, T['临床审核-沈']);
    await api('POST', `/contents/${cid}/transition`, { action: '提交审核' }, T['运营编辑-林']);
    await api('POST', `/contents/${cid}/transition`, { action: '通过' }, T['临床审核-沈']);
    await api('POST', `/contents/${cid}/publish`, {}, T['运营编辑-林']);
    await api('POST', `/contents/${cid}/publish`, {}, T['临床审核-沈']);
  }
  await expectPending('第二轮超管发起批量下线', () => api('POST', '/contents/batch-offline', { itemIds: [id, id2] }, T['超级管理-赵']));
  const batch2 = await api('POST', '/contents/batch-offline', { itemIds: [id, id2] }, T['临床审核-沈']);
  check('第二轮临床确认批量下线成功', batch2.data?.data?.status === '已下线', JSON.stringify(batch2.data?.data));

  // 5. 开关变更两轮
  console.log('=== 开关变更（双人）===');
  await expectPending('技术发起开关变更', () => api('POST', '/switches', { key: '视频推荐', enabled: 'true', reason: '测试' }, T['技术-程']));
  await api('POST', '/switches', { key: '视频推荐', enabled: 'true', reason: '测试' }, T['临床审核-沈']);
  // 第二轮：发起时传 true，确认时传 false，开关应保持开启（按发起值生效）
  await expectPending('第二轮技术发起开关变更', () => api('POST', '/switches', { key: '视频推荐', enabled: 'true', reason: '测试2' }, T['技术-程']));
  await api('POST', '/switches', { key: '视频推荐', enabled: 'false', reason: '测试2' }, T['临床审核-沈']);
  const sw = await api('GET', '/switches', null, T['技术-程']);
  const videoSwitch = sw.data?.data?.find((s) => s.key === '视频推荐');
  check('确认传 false 按发起值生效（保持开启）', videoSwitch?.enabled === true, JSON.stringify(videoSwitch));

  // 6. 模型发布两轮（先清除种子不通过用例，使门禁可通过）
  console.log('=== 模型发布（双人）===');
  const adminDb = await import('better-sqlite3').then((m) => new m.default('data/app.db'));
  adminDb.prepare("DELETE FROM EVAL_CASE WHERE result = '不通过'").run();
  adminDb.close();
  const rel = await api('POST', '/models/releases', { modelName: 'test-model', promptVersion: 'prompt-p2', retrievalStrategy: 'keyword-v2', contentLibVersion: 'content-c2' }, T['技术-程']);
  const relId = rel.data?.data?.id;
  await api('POST', `/models/releases/${relId}/eval`, {}, T['技术-程']);
  await expectPending('技术发起模型发布', () => api('POST', `/models/releases/${relId}/publish`, {}, T['技术-程']));
  const mp1 = await api('POST', `/models/releases/${relId}/publish`, {}, T['超级管理-赵']);
  check('超管确认模型发布成功', mp1.data?.data?.status === '生效', JSON.stringify(mp1.data?.data));
  // 第二轮：新模型，超管一个人点发布 → 待第二人确认（不能一个人完成）
  const rel3 = await api('POST', '/models/releases', { modelName: 'test-model-3', promptVersion: 'prompt-p2', retrievalStrategy: 'keyword-v2', contentLibVersion: 'content-c2' }, T['技术-程']);
  const rel3Id = rel3.data?.data?.id;
  await api('POST', `/models/releases/${rel3Id}/eval`, {}, T['技术-程']);
  // 超管一个人点发布 → 待第二人确认（不能一个人完成）
  await expectPending('第二轮超管发起模型发布', () => api('POST', `/models/releases/${rel3Id}/publish`, {}, T['超级管理-赵']));
  // 超管不能确认自己的发起（只有超管有 model:confirm）→ 换技术发起、超管确认
  const rel4 = await api('POST', '/models/releases', { modelName: 'test-model-4', promptVersion: 'prompt-p2', retrievalStrategy: 'keyword-v2', contentLibVersion: 'content-c2' }, T['技术-程']);
  const rel4Id = rel4.data?.data?.id;
  await api('POST', `/models/releases/${rel4Id}/eval`, {}, T['技术-程']);
  await api('POST', `/models/releases/${rel4Id}/publish`, {}, T['技术-程']);
  const mp2 = await api('POST', `/models/releases/${rel4Id}/publish`, {}, T['超级管理-赵']);
  check('第二轮超管确认模型发布成功', mp2.data?.data?.status === '生效', JSON.stringify(mp2.data?.data));

  // 7. 模型回滚两轮
  console.log('=== 模型回滚（双人）===');
  const rel2 = await api('POST', '/models/releases', { modelName: 'test-model-2', promptVersion: 'prompt-p2', retrievalStrategy: 'keyword-v2', contentLibVersion: 'content-c2' }, T['技术-程']);
  const rel2Id = rel2.data?.data?.id;
  await api('POST', `/models/releases/${rel2Id}/eval`, {}, T['技术-程']);
  await api('POST', `/models/releases/${rel2Id}/publish`, {}, T['技术-程']);
  await api('POST', `/models/releases/${rel2Id}/publish`, {}, T['超级管理-赵']);
  await expectPending('技术发起模型回滚', () => api('POST', `/models/releases/${rel2Id}/rollback`, {}, T['技术-程']));
  const rb1 = await api('POST', `/models/releases/${rel2Id}/rollback`, {}, T['超级管理-赵']);
  check('超管确认模型回滚成功', rb1.data?.data?.status === '已回滚', JSON.stringify(rb1.data?.data));
  // 第二轮：超管一个人点回滚 → 待第二人确认
  await expectPending('第二轮超管发起模型回滚', () => api('POST', `/models/releases/${rel2Id}/rollback`, {}, T['超级管理-赵']));

  console.log(`\n双人确认：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('脚本错误:', e); process.exit(1); });
