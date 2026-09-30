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

export interface DashboardStats {
  tasks: { total: number; today: number; failed: number; blocked: number };
  pendingReview: number;
  pendingReports: { total: number; high: number; mid: number; low: number };
  safetyEvents: Array<{ ruleCode: string; severity: string; actionTaken: string; source: string; createdAt: string }>;
  switches: Array<{ key: string; enabled: boolean; reason: string; updatedAt: string }>;
  evalRuns: Array<{ id: string; modelReleaseId: string; evalSetName: string; result: string | null; createdAt: string }>;
}

export interface SummarySection {
  text: string;
  source?: string;
  mark?: string;
}

export interface SummaryContent {
  当前情况: SummarySection[];
  报告要点: SummarySection[];
  医嘱要点: SummarySection[];
  尚未确认: SummarySection[];
  下一步: SummarySection[];
  复诊问题: string[];
}

export interface ContentDetail extends ContentItem {
  script: string | null;
  subtitleText: string | null;
  modelAssetVersion: string | null;
  publishedAt: string | null;
  reviews: Array<{ decision: string; comment: string | null; reviewedAt: string; reviewerName: string | null }>;
  versions: Array<{ version: number; publishedAt: string | null }>;
}

export interface Episode {
  id: string;
  title: string;
  onsetDate: string | null;
  onsetCertainty: string;
  status: string;
}

export interface ContentItem {
  id: string;
  type: string;
  title: string;
  applicableScope: string | null;
  notApplicable: string | null;
  reason?: string;
}
