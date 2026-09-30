import { api } from './client';
import type {
  AnalysisResult,
  ContentItem,
  ContentDetail,
  Episode,
  DashboardStats,
  SummaryContent,
} from './types';

export { api };
export type {
  AnalysisResult,
  ContentItem,
  ContentDetail,
  Episode,
  DashboardStats,
  SummaryContent,
};

/* ---------- 授权 ---------- */
export function sendSmsCode(phone: string) {
  return api.post<{ sent: boolean }>('/auth/sms-code', { phone });
}

export function login(phone: string, code: string, agreedScopes?: string[]) {
  return api.post<{ token: string; consents: Array<{ scope: string; granted: boolean }> }>(
    '/auth/login',
    { phone, code, agreedScopes },
  );
}

export function getConsents() {
  return api.get<Array<{ scope: string; granted: boolean; grantedAt: string | null; revokedAt: string | null }>>('/auth/consents');
}

export function getMe() {
  return api.get<{ id: string; maskedPhone: string | null }>('/auth/me');
}

export function logout() {
  return api.post<{ loggedOut: boolean }>('/auth/logout', {});
}

export function deleteAccount() {
  return api.post<{ deleted: boolean }>('/auth/delete', {});
}

export function setConsent(scope: string, granted: boolean) {
  return api.post<Array<{ scope: string; granted: boolean; grantedAt: string | null; revokedAt: string | null }>>('/auth/consents', {
    scope,
    granted: String(granted),
  });
}

/* ---------- 病程 ---------- */
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
  return api.post<{ id: string }>(`/episodes/${episodeId}/events`, input);
}

export function correctEvent(eventId: string, input: { rawText?: string; verifyStatus?: string }) {
  return api.put<{ id: string }>(`/episodes/events/${eventId}`, input);
}

export function deleteEvent(eventId: string) {
  return api.delete<{ deleted: boolean }>(`/episodes/events/${eventId}`);
}

export function timeline(episodeId: string) {
  return api.get<{
    events: Array<{
      id: string;
      episodeId: string;
      eventType: string;
      occurredAt: string;
      reportedAt: string;
      sourceType: string;
      rawText: string | null;
      verifyStatus: string;
    }>;
    symptomLogs: Array<{
      id: string;
      careEventId: string;
      occurredAt: string;
      sitMinutes: number | '尚未确认';
      plannedActivityDone: string | '尚未确认';
      sleepImpact: number | '尚未确认';
      topWorry: string | '尚未确认';
      legChange: string | '尚未确认';
    }>;
  }>(`/episodes/${episodeId}/timeline`);
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
  return api.post<{ id: string }>(`/episodes/${episodeId}/symptom-logs`, input);
}

/* ---------- 报告 ---------- */
export function createReport(input: {
  careEventId: string;
  reportDate?: string;
  sourceType: string;
  rawText: string;
}) {
  return api.post<{ id: string }>('/reports', input);
}

export function getReport(id: string) {
  return api.get<{
    id: string;
    reportDate: string | null;
    rawText: string;
    extractedTerms: Array<{ term: string; position: number }>;
    sourceType: string;
    verifyStatus: string;
  }>(`/reports/${id}`);
}

export function verifyReport(id: string) {
  return api.get<{
    reportId: string;
    source: { type: string; rawText: string };
    time: { reportDate: string | null; occurredAt: string };
    verifyStatus: string;
    terms: Array<{ term: string; position: number }>;
    conflicts: string[];
  }>(`/reports/${id}/verify`);
}

export function confirmReport(id: string, verifyStatus: '已确认' | '有冲突') {
  return api.put<{ verifyStatus: string }>(`/reports/${id}/confirm`, { verifyStatus });
}

/* ---------- 分析 ---------- */
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
  return api.get<{
    taskId: string;
    status: string;
    analysis?: AnalysisResult;
    fallback?: boolean;
    reason?: string;
  }>(`/analyses/${id}`);
}

export function getLatestAnalysis(episodeId: string) {
  return api.get<AnalysisResult | null>(`/analyses/episodes/${episodeId}/latest`);
}

export interface QaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Array<{ docId: string; docTitle: string; content: string }>;
  createdAt: string;
}

/* ---------- 问答 ---------- */
export function createQaSession(analysisId: string, title: string) {
  return api.post<{ id: string }>('/qa/sessions', { analysisId, title });
}

export function getQaSession(id: string) {
  return api.get<{ id: string; messages: Array<{ id: string; role: string; content: string; citations: Array<{ docId: string; docTitle: string; content: string }>; createdAt: string }> }>(`/qa/sessions/${id}`);
}

export function askQuestion(sessionId: string, question: string) {
  return api.post<{
    message: { id: string; role: string; content: string; citations: Array<{ docId: string; docTitle: string; content: string }>; createdAt: string };
    outOfScope: Array<{ code: string; name: string; message: string }>;
    roundEnded: boolean;
  }>(`/qa/sessions/${sessionId}/messages`, { question });
}

export function addFollowupQuestion(sessionId: string, question: string) {
  return api.post<{ added: boolean }>(`/qa/sessions/${sessionId}/followup-questions`, { question });
}

/* ---------- 复诊摘要 ---------- */
export function previewSummary(episodeId: string) {
  return api.get<SummaryContent>(`/followup/summary?episodeId=${episodeId}`);
}

export function saveSummary(episodeId: string, content: SummaryContent) {
  return api.post<{ id: string }>('/followup/summary', { episodeId, content });
}

export function exportSummary(id: string, format: '文本' | 'PDF' | '图片') {
  return api.post<{ id: string; format: string; exportedAt: string; text: string }>(
    `/followup/summary/${id}/export`,
    { format },
  );
}

/* ---------- 内容库 ---------- */
export function listPublishedContents() {
  return api.get<ContentItem[]>('/contents/published');
}

export function getContentDetail(id: string) {
  return api.get<ContentDetail>(`/contents/published/${id}`);
}

/* ---------- 反馈 ---------- */
export function createHelpFeedback(analysisId: string, helpType: string, unsolvedQuestion?: string) {
  return api.post<{ id: string }>('/feedback', { analysisId, helpType, unsolvedQuestion });
}

export function createErrorReport(analysisId: string, description: string, severity: '高' | '中' | '低') {
  return api.post<{ id: string; versions: { analysisVersion: number; modelVersion: string; contentVersion: string; rulesetVersion: string } }>(
    '/feedback/reports',
    { analysisId, description, severity },
  );
}

/* ---------- 安全 ---------- */
export function getSafetyTips() {
  return api.get<{ title: string; redFlags: string[]; note: string }>('/safety/tips');
}

export function checkSafety(text: string, source?: string) {
  return api.post<{
    passed: boolean;
    rulesetVersion: string;
    redFlags: Array<{ code: string; name: string; severity: string; action: string; message: string }>;
    outOfScope: Array<{ code: string; name: string; severity: string; action: string; message: string }>;
    safetyTips: string[];
  }>('/safety/check', { text, source });
}
