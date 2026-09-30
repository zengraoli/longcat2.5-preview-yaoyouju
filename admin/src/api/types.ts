export interface AdminSession {
  token: string;
  adminId: string;
  name: string;
  roleName: string;
  permissions: string[];
}

export interface DashboardStats {
  tasks: { total: number; today: number; failed: number; blocked: number };
  failureRate: { window: string; total: number; failed: number; rate: number };
  rulesetVersion?: string;
  dailyTasks: Array<{ date: string; count: number; failed: number }>;
  pendingReview: number;
  pendingReports: { total: number; high: number; mid: number; low: number };
  safetyEvents: Array<{
    ruleCode: string;
    severity: string;
    actionTaken: string;
    source: string;
    createdAt: string;
  }>;
  switches: Array<{ key: string; enabled: boolean; reason: string; confirmMode: string; updatedAt: string }>;
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
  publishedAt: string | null;
  refCount: number;
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
  userId: string | null;
  analysisId: string | null;
  helpType: string | null;
  authorized?: boolean;
  problemTypes?: string | null;
  unsolvedQuestion: string | null;
  isErrorReport: boolean;
  createdAt: string;
  severity: string | null;
  status: string | null;
  resolution: string | null;
  analysisVersion?: number | null;
  modelVersion?: string | null;
  contentVersion?: string | null;
  rulesetVersion?: string | null;
}

export interface SafetyEvent {
  id: string;
  userId: string | null;
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
  email?: string | null;
  roleId: string;
  roleName: string;
  mfaEnabled: boolean;
  status: string;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  target: string | null;
  diff: unknown;
  requestId: string | null;
  prevHash: string | null;
  hash: string;
  createdAt: string;
}
