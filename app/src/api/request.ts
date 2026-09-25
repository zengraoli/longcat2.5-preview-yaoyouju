const BASE_URL = 'http://localhost:3400/api';

let authToken = '';

export function setToken(token: string) {
  authToken = token;
  uni.setStorageSync('auth_token', token);
}

export function getToken(): string {
  if (!authToken) {
    authToken = uni.getStorageSync('auth_token') || '';
  }
  return authToken;
}

export function clearToken() {
  authToken = '';
  uni.removeStorageSync('auth_token');
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
}

export function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      },
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data;
          if (body.code === 0) {
            resolve(body.data);
          } else {
            reject(new Error(body.message || '请求失败'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '网络错误')),
    });
  });
}

export const api = {
  sendCode: (phone: string) => request('/auth/send-code', { method: 'POST', data: { phone } }),
  login: (phone: string, code: string) => request('/auth/login', { method: 'POST', data: { phone, code } }),
  getConsent: () => request('/auth/consent'),
  grantConsent: (scopes: string[]) => request('/auth/consent', { method: 'POST', data: { scopes } }),
  revokeConsent: (scope: string) => request('/auth/consent/revoke', { method: 'POST', data: { scope } }),
  getEpisodes: () => request('/episodes'),
  createEpisode: (data: any) => request('/episodes', { method: 'POST', data }),
  createCareEvent: (data: any) => request('/episodes/events', { method: 'POST', data }),
  createReport: (data: any) => request('/reports', { method: 'POST', data }),
  verifyReport: (id: string, data: any) => request(`/reports/${id}/verify`, { method: 'POST', data }),
  createAnalysis: (data: any) => request('/analyses', { method: 'POST', data }),
  getAnalysis: (id: string) => request(`/analyses/${id}`),
  createSymptomLog: (data: any) => request('/episodes/symptom-logs', { method: 'POST', data }),
  getTimeline: (id: string) => request(`/episodes/${id}/timeline`),
  previewFollowup: (episodeId: string) => request('/followup/preview', { method: 'POST', data: { episodeId } }),
  getPublishedContents: () => request('/contents'),
  askQuestion: (data: any) => request('/qa/ask', { method: 'POST', data }),
  safetyCheck: (text: string) => request('/safety/check', { method: 'POST', data: { text } }),
};
