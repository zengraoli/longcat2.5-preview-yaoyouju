import { api, setAdminToken, getAdminToken } from './client';
import type {
  AdminSession,
  DashboardStats,
  ContentItem,
  EvidenceDoc,
  FeedbackItem,
  SafetyEvent,
  EvalRun,
  Release,
  EvalSet,
  AdminUser,
  AuditLog,
} from './types';

export {
  api,
  setAdminToken,
  getAdminToken,
  type AdminSession,
  type DashboardStats,
  type ContentItem,
  type EvidenceDoc,
  type FeedbackItem,
  type SafetyEvent,
  type EvalRun,
  type Release,
  type EvalSet,
  type AdminUser,
  type AuditLog,
};

/* ---------- 认证 ---------- */
export function adminLogin(name: string, password: string, totp: string) {
  return api.post<AdminSession>('/admin/login', { name, password, totp });
}

export function adminLogout() {
  return api.post<{ loggedOut: boolean }>('/admin/logout', {});
}

/* ---------- 仪表盘 ---------- */
export function getDashboard() {
  return api.get<DashboardStats>('/admin/dashboard');
}

/* ---------- 内容库 ---------- */
export function listContents() {
  return api.get<ContentItem[]>('/contents');
}

export function createContent(input: {
  type: string;
  title: string;
  applicableScope?: string;
  notApplicable?: string;
  script?: string;
  subtitleText?: string;
}) {
  return api.post<{ id: string }>('/contents', input);
}

export function transitionContent(id: string, action: string, comment?: string) {
  return api.post<ContentItem>(`/contents/${id}/transition`, { action, comment });
}

export function publishContent(id: string) {
  return api.post<{ status: string; version: number }>(`/contents/${id}/publish`, {});
}

export function offlineContent(id: string) {
  return api.post<{ status: string; references: unknown[] }>(`/contents/${id}/offline`, {});
}

export function batchOffline(itemIds: string[]) {
  return api.post<{ status: string; results: unknown[] }>('/contents/batch-offline', { itemIds });
}

export function getContentReviews(id: string) {
  return api.get<Array<{ id: string; decision: string; comment: string | null; reviewedAt: string; reviewerName: string | null }>>(`/contents/${id}/reviews`);
}

export function getContentVersions(id: string) {
  return api.get<Array<{ id: string; version: number; script: string | null; subtitleText: string | null; publishedAt: string | null }>>(`/contents/${id}/versions`);
}

/* ---------- 证据库 ---------- */
export function listEvidence() {
  return api.get<EvidenceDoc[]>('/evidence/docs');
}

export function createEvidence(input: {
  title: string;
  sourceType: string;
  sourceUrl?: string;
  license?: string;
  verifiedAt?: string;
  content: string;
}) {
  return api.post<{ id: string; chunkCount: number }>('/evidence/docs', input);
}

export function deactivateEvidence(id: string) {
  return api.post<{ id: string; active: boolean }>(`/evidence/docs/${id}/deactivate`, {});
}

export function getEvidenceImpact(id: string) {
  return api.get<{ docId: string; title: string; analyses: Array<{ analysisId: string; episodeId: string }>; contents: Array<{ itemId: string; title: string }> }>(
    `/evidence/docs/${id}/impact`,
  );
}

export function getEvidencePipeline() {
  return api.get<Array<{ docId: string; title: string; status: string; chunkCount: number }>>('/evidence/pipeline');
}

export function searchEvidence(q: string) {
  return api.get<Array<{ id: string; docId: string; docTitle: string; content: string; position: number }>>(`/evidence/search?q=${encodeURIComponent(q)}`);
}

/* ---------- 反馈 ---------- */
export function listFeedback() {
  return api.get<FeedbackItem[]>('/admin/feedback');
}

export function authorizeFeedback(id: string) {
  return api.post<{ id: string; authorized: boolean }>(`/feedback/${id}/authorize`, {});
}

export function handleFeedback(id: string, action: string, resolution: string) {
  return api.post<{ id: string; status: string }>(`/feedback/${id}/handle`, { action, resolution });
}

/* ---------- 安全 ---------- */
export function listSafetyEvents() {
  return api.get<SafetyEvent[]>('/admin/dashboard');
}

/* ---------- 开关 ---------- */
export function listSwitches() {
  return api.get<Array<{ key: string; enabled: boolean; reason: string; updatedAt: string }>>('/switches');
}

export function setSwitch(key: string, enabled: boolean, reason: string) {
  return api.post('/switches', { key, enabled: String(enabled), reason });
}

/* ---------- 模型与评测 ---------- */
export function listReleases() {
  return api.get<Release[]>('/models/releases');
}

export function createRelease(input: {
  modelName: string;
  promptVersion: string;
  retrievalStrategy: string;
  contentLibVersion: string;
}) {
  return api.post<{ id: string; status: string }>('/models/releases', input);
}

export function runEval(releaseId: string) {
  return api.post<EvalRun[]>(`/models/releases/${releaseId}/eval`, {});
}

export function listEvalRuns(releaseId: string) {
  return api.get<EvalRun[]>(`/models/releases/${releaseId}/eval-runs`);
}

export function publishRelease(releaseId: string) {
  return api.post<{ id: string; status: string }>(`/models/releases/${releaseId}/publish`, {});
}

export function rollbackRelease(releaseId: string) {
  return api.post<{ id: string; status: string }>(`/models/releases/${releaseId}/rollback`, {});
}

export function listEvalSets() {
  return api.get<EvalSet[]>('/models/eval-sets');
}

/* ---------- 用户与权限 ---------- */
export function listAdminUsers() {
  return api.get<AdminUser[]>('/admin/users');
}

export function reviewCase(id: string, decision: string, comment?: string) {
  return api.post<{ id: string; status: string }>(`/admin/cases/${id}/review`, { decision, comment });
}

/* ---------- 审计 ---------- */
export function listAuditLogs() {
  return api.get<AuditLog[]>('/admin/audit-logs');
}

export function verifyAuditLogs() {
  return api.get<{ valid: boolean; tampered: unknown }>('/admin/audit-logs/verify');
}

/* ---------- 授权 ---------- */
export function createAuthorization(input: { targetType: string; targetId: string; reason: string }) {
  return api.post('/admin/authorizations', input);
}

export function listAuthorizations() {
  return api.get<Array<{ id: string; adminId: string; adminName: string | null; targetType: string; targetId: string; reason: string; createdAt: string }>>('/admin/authorizations');
}

export function setUserStatus(id: string, status: string) {
  return api.post<{ id: string; status: string }>(`/admin/users/${id}/status`, { status });
}

export function setUserRole(id: string, roleId: string) {
  return api.post<{ id: string; roleId: string }>(`/admin/users/${id}/role`, { roleId });
}
