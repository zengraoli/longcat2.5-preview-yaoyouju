/* 通过 CDP 驱动 Chrome：登录后截图指定页面 */
const { execFile } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const BASE_URL = process.argv[2] ?? 'http://localhost:5401/';
const OUT = process.argv[3] ?? path.join(__dirname, 'cdp-shot.png');
const ACTION = process.argv[4] ?? 'home';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getJson(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: PORT, path: p }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

(async () => {
  const chrome = execFile(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--window-size=375,812',
    'about:blank',
  ]);
  await sleep(2500);

  const targets = await getJson('/json');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = ++id;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  };
  await new Promise((r) => (ws.onopen = r));

  await send('Page.enable');
  await send('Page.navigate', { url: BASE_URL });
  await sleep(3000);

  if (ACTION !== 'login') {
    const loginResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const phone = '139' + String(Date.now()).slice(-8);
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code: '123456', agreedScopes: ['健康信息处理'] })
        });
        const json = await res.json();
        if (json.code === 0 && json.data && json.data.token) {
          localStorage.setItem('yaoyouju_app_token', json.data.token);
          return 'ok';
        }
        return JSON.stringify(json);
      })()`,
      awaitPromise: true,
    });
    console.log('login:', JSON.stringify(loginResult.result?.value));
    await sleep(1500);
    // 刷新页面让应用读取新令牌
    await send('Page.navigate', { url: BASE_URL });
    await sleep(3000);
    if (ACTION === 'analysis') {
      const taskResult = await send('Runtime.evaluate', {
        expression: `(async () => {
          const token = localStorage.getItem('yaoyouju_app_token');
          const h = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
          const ep = await (await fetch('/api/episodes', { method: 'POST', headers: h, body: JSON.stringify({ title: '截图测试' }) })).json();
          const ev = await (await fetch('/api/episodes/' + ep.data.id + '/events', { method: 'POST', headers: h, body: JSON.stringify({ eventType: '报告', occurredAt: new Date().toISOString(), sourceType: '报告原文', rawText: '腰椎 MRI：L5/S1 椎间盘向后突出，相应硬膜囊受压。' }) })).json();
          await fetch('/api/reports', { method: 'POST', headers: h, body: JSON.stringify({ careEventId: ev.data.id, sourceType: '报告原文', rawText: '腰椎 MRI：L5/S1 椎间盘向后突出，相应硬膜囊受压。' }) });
          const an = await (await fetch('/api/analyses', { method: 'POST', headers: h, body: JSON.stringify({ episodeId: ep.data.id }) })).json();
          return JSON.stringify(an);
        })()`,
        awaitPromise: true,
      });
      console.log('analysis task:', JSON.stringify(taskResult.result?.value));
      await sleep(6000);
      // 导航到分析页（用真实 taskId）
      try {
        const anJson = JSON.parse(taskResult.result?.value ?? '{}');
        if (anJson.data?.taskId) {
          await send('Page.navigate', { url: BASE_URL + '#/pages/analysis/index?id=' + anJson.data.taskId });
          await sleep(2000);
        }
      } catch { /* 忽略 */ }
    }
  }

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('saved', OUT);
  ws.close();
  chrome.kill();
  process.exit(0);
})();
