const BASE_URL = '/api';

let authToken = localStorage.getItem('auth_token') || '';

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('auth_token', token);
}

export function getToken(): string {
  return authToken;
}

export function clearToken() {
  authToken = '';
  localStorage.removeItem('auth_token');
}

export async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const body = await res.json();
  if (body.code !== 0) {
    throw new Error(body.message || '请求失败');
  }
  return body.data;
}

export const api = {
  sendCode: (phone: string) => request('/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) }),
  login: (phone: string, code: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  getConsent: () => request('/auth/consent'),
  grantConsent: (scopes: string[]) => request('/auth/consent', { method: 'POST', body: JSON.stringify({ scopes }) }),
  revokeConsent: (scope: string) => request('/auth/consent/revoke', { method: 'POST', body: JSON.stringify({ scope }) }),
  getEpisodes: () => request('/episodes'),
  createEpisode: (data: any) => request('/episodes', { method: 'POST', body: JSON.stringify(data) }),
  getCareEvents: (episodeId: string) => request(`/episodes/${episodeId}/events`),
  createCareEvent: (data: any) => request('/episodes/events', { method: 'POST', body: JSON.stringify(data) }),
  createReport: (data: any) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getStructuredInfo: (reportId: string) => request(`/reports/${reportId}/structured`),
  verifyReport: (reportId: string, data: any) => request(`/reports/${reportId}/verify`, { method: 'POST', body: JSON.stringify(data) }),
  createAnalysis: (data: any) => request('/analyses', { method: 'POST', body: JSON.stringify(data) }),
  getAnalysis: (taskId: string) => request(`/analyses/${taskId}`),
  createSymptomLog: (data: any) => request('/episodes/symptom-logs', { method: 'POST', body: JSON.stringify(data) }),
  getTimeline: (episodeId: string) => request(`/episodes/${episodeId}/timeline`),
  previewFollowup: (episodeId: string) => request('/followup/preview', { method: 'POST', body: JSON.stringify({ episodeId }) }),
  exportFollowup: (episodeId: string, format: string) => request('/followup/export', { method: 'POST', body: JSON.stringify({ episodeId, format }) }),
  getPublishedContents: () => request('/contents'),
  askQuestion: (data: any) => request('/qa/ask', { method: 'POST', body: JSON.stringify(data) }),
  safetyCheck: (text: string) => request('/safety/check', { method: 'POST', body: JSON.stringify({ text }) }),
};
