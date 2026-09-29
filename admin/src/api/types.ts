export interface AdminSession {
  token: string;
  adminId: string;
  name: string;
  roleName: string;
  permissions: string[];
}

export interface DashboardStats {
  tasks: { total: number; failed: number };
  pendingReview: number;
  pendingReports: number;
  safetyEvents: Array<{
    ruleCode: string;
    severity: string;
    actionTaken: string;
    source: string;
    createdAt: string;
  }>;
  switches: Array<{ key: string; enabled: number; reason: string; updatedAt: string }>;
  evalRuns: Array<{
    id: string;
    modelReleaseId: string;
    evalSetName: string;
    result: string;
    createdAt: string;
  }>;
}

export interface ContentItem {
  id: string;
  type: string;
  title: string;
  applicableScope: string | null;
  notApplicable: string | null;
  currentStatus: string;
  offlineSwitch: boolean;
  version: number | null;
  reviewer: string | null;
}

export interface EvidenceDoc {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string | null;
  license: string | null;
  verifiedAt: string | null;
  active: boolean;
  chunkCount: number;
}

export interface FeedbackItem {
  id: string;
  analysisId: string | null;
  helpType: string | null;
  unsolvedQuestion: string | null;
  isErrorReport: boolean;
  createdAt: string;
}

export interface SafetyEvent {
  ruleCode: string;
  severity: string;
  actionTaken: string;
  source: string;
  createdAt: string;
}

export interface EvalRun {
  id: string;
  modelReleaseId: string;
  evalSetId: string;
  evalSetName: string;
  metrics: Record<string, unknown> | null;
  result: string | null;
  createdAt: string;
}

export interface Release {
  id: string;
  name: string;
  modelName: string;
  promptVersion: string;
  retrievalStrategy: string;
  contentLibVersion: string;
  status: string;
  createdAt: string;
}

export interface EvalSet {
  id: string;
  name: string;
  caseCount: number;
  deidentified: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  roleId: string;
  mfaEnabled: boolean;
  status: string;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  target: string | null;
  diff: unknown;
  requestId: string | null;
  prevHash: string | null;
  hash: string;
  createdAt: string;
}
