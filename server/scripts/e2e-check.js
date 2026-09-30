/* 端到端验证脚本：登录 → 建病程 → 录报告 → 生成分析 → 问答 → 红旗阻断 */
const http = require('http');

const BASE = process.env.BASE ?? 'http://localhost:3400';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (token) headers['Authorization'] = `Bearer ${token}`;
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

const phone = `139${String(Date.now()).slice(-8)}`;

(async () => {
  // 1. 登录（带同意）
  const login = await req('POST', '/auth/login', { phone, code: '123456', agreedScopes: ['健康信息处理'] });
  const token = login.body.data?.token;
  console.log('1. 登录:', login.body.code === 0 ? 'OK' : 'FAIL', JSON.stringify(login.body).slice(0, 200));

  // 2. 新建病程
  const ep = await req('POST', '/episodes', { title: '腰痛', onsetDate: '2026-09-01', onsetCertainty: '已确认' }, token);
  const episodeId = ep.body.data?.id;
  console.log('2. 新建病程:', ep.body.code === 0 ? 'OK' : 'FAIL', episodeId);

  // 3. 录入报告
  const ev = await req('POST', `/episodes/${episodeId}/events`, {
    eventType: '报告', occurredAt: '2026-09-20T02:00:00.000Z', sourceType: '报告原文',
    rawText: '腰椎 MRI：L5/S1 椎间盘向后突出，相应硬膜囊受压。',
  }, token);
  const report = await req('POST', '/reports', { careEventId: ev.body.data.id, reportDate: '2026-09-20', sourceType: '报告原文', rawText: '腰椎 MRI：L5/S1 椎间盘向后突出，相应硬膜囊受压。' }, token);
  console.log('3. 录入报告:', report.body.code === 0 ? 'OK' : 'FAIL');

  // 4. 提交分析（不带红旗文字）
  const an = await req('POST', '/analyses', { episodeId }, token);
  console.log('4. 提交分析:', an.body.code === 202 ? 'OK(202)' : `code=${an.body.code}`, '| status:', an.body.data?.status, '| taskId:', an.body.data?.taskId);

  // 5. 轮询分析结果
  if (an.body.data?.taskId) {
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await req('GET', `/analyses/${an.body.data.taskId}`, null, token);
      if (res.body.data?.status === '完成') {
        const a = res.body.data.analysis;
        console.log('5. 分析完成: OK | version', a.version, '| 已知', a.sections.已知.length, '| 解释', a.sections.解释.length, '| 未知', a.sections.未知.length, '| 视频', a.sections.视频.length, '| 引用', a.citations.length);
        // 6. 问答
        const session = await req('POST', '/qa/sessions', { analysisId: a.id, title: '报告术语解释' }, token);
        console.log('6. 创建问答会话:', session.body.code === 0 ? 'OK' : 'FAIL');
        const qa = await req('POST', `/qa/sessions/${session.body.data.id}/messages`, { question: 'L5/S1 是什么意思？' }, token);
        console.log('   问答回复:', qa.body.code === 0 ? 'OK' : 'FAIL', '|', qa.body.data?.message?.content?.slice(0, 40));
        // 7. 红旗问答
        const qa2 = await req('POST', `/qa/sessions/${session.body.data.id}/messages`, { question: '我现在大小便失禁了，鞍区也麻木' }, token);
        console.log('7. 红旗问答:', qa2.body.code === 0 ? 'OK' : 'FAIL', '| outOfScope:', qa2.body.data?.outOfScope?.length > 0 ? '有就医提示' : '无');
        break;
      }
      if (res.body.data?.status === '失败') {
        console.log('5. 分析失败:', res.body.data?.reason);
        break;
      }
    }
  }

  // 8. 红旗阻断：提交带红旗文字的分析
  const an2 = await req('POST', '/analyses', { episodeId, safetyText: '最近大小便失禁，鞍区麻木' }, token);
  console.log('8. 红旗提交分析:', an2.body.code === 202 ? 'OK(202)' : `code=${an2.body.code}`, '| status:', an2.body.data?.status, '| redFlags:', an2.body.data?.safety?.redFlags?.length ?? 0);

  // 9. 记录今天
  const log = await req('POST', `/episodes/${episodeId}/symptom-logs`, {
    occurredAt: '2026-09-30T02:00:00.000Z', sitMinutes: 30, plannedActivityDone: '部分', sleepImpact: 2, topWorry: '担心加重', legChange: '没有',
  }, token);
  console.log('9. 记录今天:', log.body.code === 0 ? 'OK' : 'FAIL', '| sitMinutes:', log.body.data?.sitMinutes);

  // 10. 复诊摘要
  const summary = await req('GET', `/followup/summary?episodeId=${episodeId}`, null, token);
  console.log('10. 复诊摘要:', summary.body.code === 0 ? 'OK' : 'FAIL', '| 当前情况:', summary.body.data?.当前情况?.length, '| 复诊问题:', summary.body.data?.复诊问题?.length);

  // 11. 撤回同意
  const revoke = await req('POST', '/auth/consents', { scope: '健康信息处理', granted: 'false' }, token);
  console.log('11. 撤回同意:', revoke.body.code === 0 ? 'OK' : 'FAIL', '| granted:', revoke.body.data?.[0]?.granted);
  // 撤回后问答应被阻断
  const qa3 = await req('POST', '/qa/sessions', { analysisId: 'x', title: 't' }, token);
  console.log('   撤回后问答:', qa3.body.code === 1003 ? 'OK(1003阻断)' : `code=${qa3.body.code} ${qa3.body.message}`);

  // 12. 退出登录
  const logout = await req('POST', '/auth/logout', {}, token);
  console.log('12. 退出登录:', logout.body.code === 0 ? 'OK' : 'FAIL');
  const afterLogout = await req('GET', '/auth/consents', null, token);
  console.log('   退出后会话失效:', afterLogout.body.code === 1002 ? 'OK(1002)' : `code=${afterLogout.body.code}`);
})();
