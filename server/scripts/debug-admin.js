async function api(method, pathname, body, token, adminToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (adminToken) headers['X-Admin-Token'] = adminToken;
  const res = await fetch('http://localhost:3400' + pathname, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

(async () => {
  const adminLogin = await api('POST', '/admin/login', {
    name: '超级管理-赵',
    password: 'Admin@123456',
    totp: '123456',
  });
  console.log('admin login:', adminLogin.status);
  const token = adminLogin.json.data.token;
  const off = await api('POST', '/contents/content-2/offline', {}, null, token);
  console.log('offline:', off.status, JSON.stringify(off.json).slice(0, 200));
})();
