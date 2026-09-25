const BASE_URL = process.env.BASE_URL || 'http://localhost:3400/api';

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const { headers, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  });
  const data = await res.json();
  return { status: res.status, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function main() {
  console.log('--- Smoke Test Start ---');

  const loginResult = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: '13800001111', code: '123456' }),
  });
  assert(loginResult.data.code === 0, 'login succeeds');
  const token = loginResult.data.data.token;
  const userId = loginResult.data.data.userId;
  const headers = { Authorization: `Bearer ${token}` };

  const consentResult = await request('/auth/consent', {
    method: 'POST',
    headers,
    body: JSON.stringify({ scopes: ['健康信息处理'] }),
  });
  assert(consentResult.data.code === 0, 'grant consent succeeds');

  const consentCheck = await request('/auth/consent', { headers });
  assert(consentCheck.data.data.find((c: any) => c.scope === '健康信息处理')?.granted === true, 'consent status verified');

  const episodesResult = await request('/episodes', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: '测试病程', onsetDate: '2026-09-01', onsetCertainty: '已确认' }),
  });
  assert(episodesResult.data.code === 0, 'create episode succeeds');
  const episodeId = episodesResult.data.data.id;

  const careEventResult = await request('/episodes/events', {
    method: 'POST',
    headers,
    body: JSON.stringify({ episodeId, eventType: '报告', occurredAt: '2026-09-20T10:00:00.000Z', sourceType: '报告原文', rawText: '腰椎MRI显示L4/5椎间盘突出' }),
  });
  assert(careEventResult.data.code === 0, 'create care event succeeds');
  const careEventId = careEventResult.data.data.id;

  const reportResult = await request('/reports', {
    method: 'POST',
    headers,
    body: JSON.stringify({ careEventId, reportDate: '2026-09-20', rawText: '腰椎MRI：L4/5椎间盘中央型突出，硬膜囊及双侧神经根受压，椎管轻度狭窄。', sourceType: '报告原文' }),
  });
  assert(reportResult.data.code === 0, 'create report succeeds');
  const reportId = reportResult.data.data.id;

  const verifyResult = await request(`/reports/${reportId}/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ verifyStatus: '已确认', extractedTerms: [{ term: 'L4/5', position: '椎间盘' }] }),
  });
  assert(verifyResult.data.code === 0, 'verify report succeeds');

  const analysisResult = await request('/analyses', {
    method: 'POST',
    headers,
    body: JSON.stringify({ episodeId, reportId }),
  });
  assert(analysisResult.data.code === 0, 'create analysis task succeeds');
  const taskId = analysisResult.data.data.taskId;

  const analysisGetResult = await request(`/analyses/${taskId}`, { headers });
  assert(analysisGetResult.data.code === 0, 'get analysis result succeeds');
  assert(analysisGetResult.data.data.analysisId !== undefined, 'analysis completed by worker');
  assert(analysisGetResult.data.data.sections.known !== undefined, 'analysis has known section');
  assert(analysisGetResult.data.data.sections.explanation !== undefined, 'analysis has explanation section');

  const symptomResult = await request('/episodes/symptom-logs', {
    method: 'POST',
    headers,
    body: JSON.stringify({ careEventId, sitMinutes: 30, sleepImpact: 2, topWorry: '担心久坐加重', legChange: '无' }),
  });
  assert(symptomResult.data.code === 0, 'create symptom log succeeds');

  const followupResult = await request('/followup/preview', {
    method: 'POST',
    headers,
    body: JSON.stringify({ episodeId }),
  });
  assert(followupResult.data.code === 0, 'preview followup succeeds');
  assert(followupResult.data.data.sections.chiefComplaint, 'followup has chief complaint section');

  const redFlagResult = await request('/safety/check', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: '腰痛伴有大小便失禁' }),
  });
  assert(redFlagResult.data.code === 0, 'safety check succeeds');
  assert(redFlagResult.data.data.passed === false, 'red flag detected');
  assert(redFlagResult.data.data.ruleCode === 'RF-01', 'correct rule code RF-01');

  console.log('--- Smoke Test All Passed ---');
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
