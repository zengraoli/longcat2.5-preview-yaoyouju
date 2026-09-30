/* 通过 CDP 驱动 Chrome 测试 Web 端流程 */
const { execFile } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;
const BASE_URL = process.argv[2] ?? 'http://localhost:5402/';
const OUT = process.argv[3] ?? path.join(__dirname, 'cdp-web.png');
const ACTION = process.argv[4] ?? 'login';

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
    '--window-size=1440,900',
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
  await sleep(3500);

  if (ACTION !== 'login') {
    // 登录并存储令牌
    const loginResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const phone = '139' + String(Date.now()).slice(-8);
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code: '123456', agreedScopes: ['健康信息处理'] })
        });
        const json = await res.json();
        if (json.code === 0 && json.data && json.data.token) {
          localStorage.setItem('yaoyouju_web_token', json.data.token);
          return 'ok';
        }
        return JSON.stringify(json);
      })()`,
      awaitPromise: true,
    });
    console.log('web login:', JSON.stringify(loginResult.result?.value));
    await sleep(1000);
    // 刷新让应用读取令牌
    await send('Page.navigate', { url: BASE_URL });
    await sleep(3500);
  }

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('saved', OUT);
  ws.close();
  chrome.kill();
  process.exit(0);
})();
