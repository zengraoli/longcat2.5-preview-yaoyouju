const BASE_URL = '/api';

let authToken = localStorage.getItem('admin_token') || '';

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('admin_token', token);
}

export function getToken(): string {
  return authToken;
}

export function clearToken() {
  authToken = '';
  localStorage.removeItem('admin_token');
}

export async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-token': authToken,
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const body = await res.json();
  if (body.code !== 0) {
    throw new Error(body.message || '请求失败');
  }
  return body.data;
}

export const api = {
  adminLogin: (data: { username: string; password: string; totp: string }) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify(data) }),
  getAdminUsers: () => request('/admin/users'),
  createAdminUser: (data: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  verifyAudit: () => request('/admin/audit/verify'),
  dualConfirm: (data: any) => request('/admin/dual-confirm', { method: 'POST', body: JSON.stringify(data) }),
  getContents: () => request('/contents'),
  getContent: (id: string) => request(`/contents/${id}`),
  createContent: (data: any) => request('/contents', { method: 'POST', body: JSON.stringify(data) }),
  submitContent: (data: any) => request('/contents/submit', { method: 'POST', body: JSON.stringify(data) }),
  reviewContent: (data: any) => request('/contents/review', { method: 'POST', body: JSON.stringify(data) }),
  publishContent: (data: any) => request('/contents/publish', { method: 'POST', body: JSON.stringify(data) }),
  offlineContent: (data: any) => request('/contents/offline', { method: 'POST', body: JSON.stringify(data) }),
  getEvidenceDocs: () => request('/evidence'),
  getEvidenceDoc: (id: string) => request(`/evidence/${id}`),
  createEvidenceDoc: (data: any) => request('/evidence', { method: 'POST', body: JSON.stringify(data) }),
  toggleEvidence: (data: any) => request('/evidence/toggle', { method: 'POST', body: JSON.stringify(data) }),
  getFeatureSwitches: () => request('/features/switches'),
  setFeatureSwitch: (data: any) => request('/features/switch', { method: 'POST', body: JSON.stringify(data) }),
  getModels: () => request('/models'),
  getFeedbackList: (isError?: boolean) => request(`/feedback?isErrorReport=${isError ?? ''}`),
  getFeedback: (id: string) => request(`/feedback/${id}`),
  createFeedback: (data: any) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  grantFeedbackView: (data: any) => request('/feedback/grant-view', { method: 'POST', body: JSON.stringify(data) }),
};
