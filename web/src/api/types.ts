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
  citations: Array<{ id: string; evidenceDocId: string; statement: string; supported: number }>;
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
