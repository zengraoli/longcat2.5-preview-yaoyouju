/**
 * 冒烟脚本：依次跑通 登录 → 同意 → 关键变化确认 → 录入报告 → 核对 → 生成分析（含 Worker）
 * → 原文对照 → 记录今天 → 生成复诊摘要；另跑红旗命中分支。
 * 用法：npm run smoke（自动启动 API 与 Worker，结束后关闭）
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const PORT = process.env.SMOKE_PORT ?? '3400';
const BASE = `http://localhost:${PORT}`;
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function fail(name, err) {
  failed += 1;
  console.error(`  ✗ ${name}: ${err}`);
}

function check(name, condition, detail) {
  if (condition) ok(name);
  else fail(name, detail ?? '断言失败');
}

async function api(method, pathname, body, token) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function waitForHealth(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return true;
    } catch {
      // 服务未就绪
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function startProcess(command, args, logFile, env) {
  const out = fs.openSync(logFile, 'a');
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: ['ignore', out, out],
    shell: true,
    env: { ...process.env, ...env },
  });
  return child;
}

function stopProcess(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') {
      // Windows：同步结束整个进程树，避免子进程残留占端口
      require('node:child_process').execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // 忽略
  }
}

async function main() {
  console.log('冒烟测试：启动 API 与 Worker（使用独立冒烟数据库）');
  // 使用独立的冒烟数据库，不删除开发数据
  const smokeDir = path.join(ROOT, 'data-smoke');
  try {
    fs.rmSync(smokeDir, { recursive: true, force: true });
  } catch {
    // 忽略
  }
  fs.mkdirSync(smokeDir, { recursive: true });
  const dbEnv = {
    PORT,
    DB_PATH: path.join(smokeDir, 'app.db'),
    IDENTITY_DB_PATH: path.join(smokeDir, 'identity.db'),
  };
  const server = startProcess('node', ['dist/main.js'], path.join(ROOT, 'data-server.log'), dbEnv);
  const worker = startProcess('node', ['dist/worker/worker.js'], path.join(ROOT, 'data-worker.log'), dbEnv);
  try {
    const healthy = await waitForHealth();
    check('服务启动 /health', healthy);
    if (!healthy) {
      console.error('服务未能启动，日志见 data-server.log / data-worker.log');
      process.exit(1);
    }

    // 1. 登录
    const login = await api('POST', '/auth/login', { phone: '13800000001', code: '123456' });
    check('登录', login.status === 200 && login.json?.data?.token, JSON.stringify(login.json).slice(0, 200));
    const token = login.json.data.token;

    // 2. 同意（健康信息处理）
    const consent = await api('POST', '/auth/consents', { scope: '健康信息处理', granted: 'true' }, token);
    check('同意健康信息处理', consent.status === 200, JSON.stringify(consent.json).slice(0, 200));

    // 3. 关键变化确认（安全预检）
    const safety = await api('POST', '/safety/check', { text: '久坐后腰部酸痛，无其他症状', source: 'smoke' }, token);
    check('关键变化确认（无红旗）', safety.status === 201 && safety.json?.data?.passed === true, JSON.stringify(safety.json).slice(0, 200));

    // 4. 录入报告
    const episodes = await api('GET', '/episodes', null, token);
    const episodeId = episodes.json.data[0].id;
    const event = await api('POST', `/episodes/${episodeId}/events`, {
      eventType: '报告',
      occurredAt: '2026-09-27T02:00:00.000Z',
      sourceType: '报告原文',
      rawText: '腰椎 MRI：L5/S1 椎间盘突出。',
    }, token);
    check('录入报告事件', event.status === 201 && event.json?.data?.id, JSON.stringify(event.json).slice(0, 200));
    const report = await api('POST', '/reports', {
      careEventId: event.json.data.id,
      reportDate: '2026-09-27',
      sourceType: '报告原文',
      rawText: '腰椎 MRI：L5/S1 椎间盘突出。',
    }, token);
    check('录入报告并抽取术语', report.status === 201 && report.json?.data?.extractedTerms?.length > 0, JSON.stringify(report.json).slice(0, 200));

    // 5. 核对
    const verify = await api('GET', `/reports/${report.json.data.id}/verify`, null, token);
    check('结构化核对', verify.status === 200 && verify.json?.data?.source?.type === '报告原文', JSON.stringify(verify.json).slice(0, 200));
    const confirm = await api('PUT', `/reports/${report.json.data.id}/confirm`, { verifyStatus: '已确认' }, token);
    check('用户确认报告', confirm.status === 200 && confirm.json?.data?.verifyStatus === '已确认', JSON.stringify(confirm.json).slice(0, 200));

    // 6. 生成分析（含 Worker）
    const analysis = await api('POST', '/analyses', { episodeId, safetyText: '久坐后腰部酸痛' }, token);
    check('提交分析返回 202 与任务 ID', analysis.status === 202 && analysis.json?.data?.taskId, JSON.stringify(analysis.json).slice(0, 200));
    const taskId = analysis.json.data.taskId;
    let result = null;
    for (let i = 0; i < 30; i += 1) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await api('GET', `/analyses/${taskId}`, null, token);
      if (res.json?.data?.status === '完成') {
        result = res.json.data;
        break;
      }
      if (res.json?.data?.status === '失败') break;
    }
    check('Worker 完成分析', result?.status === '完成', `任务状态：${result?.status}`);
    if (result?.analysis) {
      const sections = result.analysis.sections;
      check('五段结构完整', ['已知', '解释', '未知', '下一步', '视频'].every((k) => Array.isArray(sections[k])), JSON.stringify(Object.keys(sections)));
      check('每条解释都带来源', sections.解释.every((s) => s.source), '解释缺少来源');
    }

    // 7. 原文对照（报告详情含术语与位置）
    const detail = await api('GET', `/reports/${report.json.data.id}`, null, token);
    check('原文对照（术语与位置）', detail.status === 200 && detail.json?.data?.extractedTerms?.[0]?.position >= 0, JSON.stringify(detail.json).slice(0, 200));

    // 8. 记录今天
    const log = await api('POST', `/episodes/${episodeId}/symptom-logs`, {
      occurredAt: '2026-09-29T02:00:00.000Z',
      sitMinutes: 40,
      plannedActivityDone: '完成',
      sleepImpact: 2,
      topWorry: '担心影像恶化',
      legChange: '没有',
    }, token);
    check('记录今天', log.status === 201 && log.json?.data?.sitMinutes === 40, JSON.stringify(log.json).slice(0, 200));

    // 9. 生成复诊摘要
    const summary = await api('GET', `/followup/summary?episodeId=${episodeId}`, null, token);
    check('生成复诊摘要（六段）', summary.status === 200 && ['当前情况', '报告要点', '医嘱要点', '尚未确认', '下一步', '复诊问题'].every((k) => Array.isArray(summary.json.data[k])), JSON.stringify(summary.json).slice(0, 200));

    // 10. 红旗命中分支
    const redFlag = await api('POST', '/analyses', { episodeId, safetyText: '最近大小便功能异常' }, token);
    check('红旗命中分支返回安全提示', redFlag.status === 202 && redFlag.json?.data?.safety?.redFlags?.length > 0, JSON.stringify(redFlag.json).slice(0, 200));

    // 11. 就医提示接口无需登录
    const tips = await api('GET', '/safety/tips', null, null);
    check('就医提示无需登录', tips.status === 200 && tips.json?.data?.redFlags?.length > 0, JSON.stringify(tips.json).slice(0, 200));
  } finally {
    stopProcess(worker);
    stopProcess(server);
  }

  console.log(`\n冒烟测试完成：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('冒烟测试异常：', err);
  process.exit(1);
});
