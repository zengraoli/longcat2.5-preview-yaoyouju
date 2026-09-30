import { api, setAuthToken, getAuthToken } from './client';

export { api, setAuthToken, getAuthToken };
export { ApiError } from './client';

/* ---------- 授权 ---------- */
export interface ConsentView {
  scope: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

export function sendSmsCode(phone: string) {
  return api.post<{ sent: boolean }>('/auth/sms-code', { phone });
}

export function login(phone: string, code: string, agreedScopes?: string[]) {
  return api.post<{ token: string; user: { id: string }; consents: ConsentView[] }>(
    '/auth/login',
    { phone, code, agreedScopes },
  );
}

export function getConsents() {
  return api.get<ConsentView[]>('/auth/consents');
}

export function getMe() {
  return api.get<{ id: string; maskedPhone: string | null }>('/auth/me');
}

export function setConsent(scope: string, granted: boolean) {
  return api.post<ConsentView[]>('/auth/consents', { scope, granted: String(granted) });
}

export function logout() {
  return api.post<{ loggedOut: boolean }>('/auth/logout', {});
}

/** 删除账户与数据（注销） */
export function deleteAccount() {
  return api.post<{ deleted: boolean }>('/auth/delete', {});
}

/* ---------- 安全 ---------- */
export interface SafetyTips {
  title: string;
  redFlags: string[];
  note: string;
}

export function getSafetyTips() {
  return api.get<SafetyTips>('/safety/tips');
}

export interface SafetyCheckResult {
  rulesetVersion: string;
  redFlags: Array<{ code: string; name: string; severity: string; action: string; message: string }>;
  outOfScope: Array<{ code: string; name: string; severity: string; action: string; message: string }>;
  passed: boolean;
  safetyTips: string[];
}

export function checkSafety(text: string, source?: string) {
  return api.post<SafetyCheckResult>('/safety/check', { text, source });
}

/* ---------- 病程 ---------- */
export interface Episode {
  id: string;
  title: string;
  onsetDate: string | null;
  onsetCertainty: string;
  status: string;
}

export interface CareEvent {
  id: string;
  episodeId: string;
  eventType: string;
  occurredAt: string;
  reportedAt: string;
  sourceType: string;
  rawText: string | null;
  verifyStatus: string;
}

export interface SymptomLog {
  id: string;
  careEventId: string;
  occurredAt: string;
  sitMinutes: number | '尚未确认';
  plannedActivityDone: string | '尚未确认';
  sleepImpact: number | '尚未确认';
  topWorry: string | '尚未确认';
  legChange: string | '尚未确认';
}

export function listEpisodes() {
  return api.get<Episode[]>('/episodes');
}

export function createEpisode(title: string, onsetDate?: string, onsetCertainty?: string) {
  return api.post<{ id: string }>('/episodes', {
    title,
    onsetDate,
    onsetCertainty: onsetCertainty ?? '尚未确认',
  });
}

export function addEvent(episodeId: string, input: {
  eventType: string;
  occurredAt: string;
  sourceType: string;
  rawText?: string;
  verifyStatus?: string;
}) {
  return api.post<CareEvent>(`/episodes/${episodeId}/events`, input);
}

export function correctEvent(eventId: string, input: { rawText?: string; verifyStatus?: string }) {
  return api.put<CareEvent>(`/episodes/events/${eventId}`, input);
}

export function deleteEvent(eventId: string) {
  return api.delete<{ deleted: boolean }>(`/episodes/events/${eventId}`);
}

export function timeline(episodeId: string) {
  return api.get<{ events: CareEvent[]; symptomLogs: SymptomLog[] }>(
    `/episodes/${episodeId}/timeline`,
  );
}

export function addSymptomLog(episodeId: string, input: {
  occurredAt: string;
  sitMinutes?: number;
  plannedActivityDone?: string;
  sleepImpact?: number;
  topWorry?: string;
  legChange?: string;
  changeVsYesterday?: string;
  activitiesDone?: string;
}) {
  return api.post<SymptomLog>(`/episodes/${episodeId}/symptom-logs`, input);
}

/* ---------- 报告 ---------- */
export interface Report {
  id: string;
  careEventId: string;
  reportDate: string | null;
  rawText: string;
  extractedTerms: Array<{ term: string; position: number }>;
  sourceType: string;
  verifyStatus: string;
}

export function createReport(input: {
  careEventId: string;
  reportDate?: string;
  sourceType: string;
  rawText: string;
}) {
  return api.post<Report>('/reports', input);
}

export function getReport(id: string) {
  return api.get<Report>(`/reports/${id}`);
}

export interface VerifyView {
  reportId: string;
  source: { type: string; rawText: string };
  time: { reportDate: string | null; occurredAt: string };
  verifyStatus: string;
  terms: Array<{ term: string; position: number }>;
  conflicts: string[];
  note: string;
}

export function verifyReport(id: string) {
  return api.get<VerifyView>(`/reports/${id}/verify`);
}

export function confirmReport(id: string, verifyStatus: '已确认' | '有冲突') {
  return api.put<VerifyView>(`/reports/${id}/confirm`, { verifyStatus });
}

/* ---------- 分析 ---------- */
export interface AnalysisSection {
  text: string;
  source: string | null;
}

export interface AnalysisResult {
  id: string;
  episodeId: string;
  version: number;
  modelReleaseId: string;
  sections: {
    已知: AnalysisSection[];
    解释: AnalysisSection[];
    未知: AnalysisSection[];
    下一步: AnalysisSection[];
    视频: Array<{ title: string; contentId: string; reason: string }>;
  };
  retrievalSnapshot: {
    evidenceDocs: string[];
    modelRelease: string;
    contentLibVersion: string;
    rulesetVersion: string;
  };
  safetyFlag: string;
  createdAt: string;
  citations: Array<{ id: string; evidenceDocId: string; evidenceDocTitle: string | null; statement: string; supported: number }>;
}

export interface AnalysisTaskStatus {
  taskId: string;
  status: string;
  attempts?: number;
  createdAt?: string;
  updatedAt?: string;
  analysis?: AnalysisResult;
  fallback?: boolean;
  reason?: string;
  notice?: string;
  available?: string[];
}

export function createAnalysis(episodeId: string, safetyText?: string) {
  return api.post<{
    taskId: string;
    status: string;
    safety: {
      passed: boolean;
      rulesetVersion: string;
      redFlags: Array<{ code: string; name: string; severity: string; action: string; message: string }>;
      outOfScope: Array<{ code: string; name: string; severity: string; action: string; message: string }>;
      safetyTips: string[];
    };
  }>('/analyses', { episodeId, safetyText });
}

export function getAnalysis(id: string) {
  return api.get<AnalysisTaskStatus>(`/analyses/${id}`);
}

export function getLatestAnalysis(episodeId: string) {
  return api.get<AnalysisResult | null>(`/analyses/episodes/${episodeId}/latest`);
}

/* ---------- 问与解释 ---------- */
export interface QaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Array<{ docId: string; docTitle: string; content: string }>;
  createdAt: string;
}

export function createQaSession(analysisId: string, title: string) {
  return api.post<{ id: string; analysisId: string; title: string }>('/qa/sessions', {
    analysisId,
    title,
  });
}

export function getQaSession(id: string) {
  return api.get<{ id: string; analysisId: string | null; title: string | null; messages: QaMessage[] }>(
    `/qa/sessions/${id}`,
  );
}

export function askQuestion(sessionId: string, question: string) {
  return api.post<{
    message: QaMessage;
    outOfScope: Array<{ code: string; name: string; message: string }>;
    roundEnded: boolean;
    followupQuestionAdded: boolean;
  }>(`/qa/sessions/${sessionId}/messages`, { question });
}

export function addFollowupQuestion(sessionId: string, question: string) {
  return api.post<{ added: boolean; question: string }>(
    `/qa/sessions/${sessionId}/followup-questions`,
    { question },
  );
}

/* ---------- 复诊摘要 ---------- */
export interface SummaryContent {
  当前情况: Array<{ text: string; source?: string }>;
  报告要点: Array<{ text: string; source?: string }>;
  医嘱要点: Array<{ text: string; source?: string }>;
  尚未确认: Array<{ text: string; mark?: string }>;
  下一步: Array<{ text: string; source?: string }>;
  复诊问题: string[];
}

export function previewSummary(episodeId: string) {
  return api.get<SummaryContent>(`/followup/summary?episodeId=${episodeId}`);
}

export function saveSummary(episodeId: string, content: SummaryContent) {
  return api.post<{ id: string; episodeId: string; content: SummaryContent }>('/followup/summary', {
    episodeId,
    content,
  });
}

export function exportSummary(id: string, format: '文本' | 'PDF' | '图片') {
  return api.post<{
    id: string;
    episodeId: string;
    format: string;
    exportedAt: string;
    text: string;
    note?: string;
  }>(`/followup/summary/${id}/export`, { format });
}

/* ---------- 内容库 ---------- */
export interface ContentItem {
  id: string;
  type: string;
  title: string;
  applicableScope: string | null;
  notApplicable: string | null;
  reason?: string;
}

export function listPublishedContents() {
  return api.get<ContentItem[]>('/contents/published');
}

export interface ContentDetail extends ContentItem {
  script: string | null;
  subtitleText: string | null;
  modelAssetVersion: string | null;
  publishedAt: string | null;
  reviews: Array<{ decision: string; comment: string | null; reviewedAt: string; reviewerName: string | null }>;
  versions: Array<{ version: number; publishedAt: string | null }>;
}

export function getContentDetail(id: string) {
  return api.get<ContentDetail>(`/contents/published/${id}`);
}

/* ---------- 反馈 ---------- */
export function createHelpFeedback(analysisId: string, helpType: string, unsolvedQuestion?: string) {
  return api.post<{ id: string; isErrorReport: boolean }>('/feedback', {
    analysisId,
    helpType,
    unsolvedQuestion,
  });
}

export function createErrorReport(analysisId: string, description: string, severity: '高' | '中' | '低') {
  return api.post<{
    id: string;
    isErrorReport: boolean;
    severity: string;
    versions: {
      analysisVersion: number | null;
      modelVersion: string | null;
      contentVersion: string | null;
      rulesetVersion: string;
    };
  }>('/feedback/reports', { analysisId, description, severity });
}
