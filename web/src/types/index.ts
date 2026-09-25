export interface Episode {
  id: string;
  user_id: string;
  title: string;
  onset_date: string | null;
  onset_certainty: string;
  status: string;
}

export interface CareEvent {
  id: string;
  episode_id: string;
  event_type: string;
  occurred_at: string;
  reported_at: string;
  source_type: string;
  raw_text: string | null;
  verify_status: string;
}

export interface Analysis {
  analysisId: string;
  episodeId: string;
  version: number;
  sections: {
    known: string[];
    explanation: Array<{ text: string; source: string }>;
    unknown: string[];
    nextSteps: string[];
    video: string | null;
  };
  createdAt: string;
}

export interface ContentItem {
  id: string;
  type: string;
  title: string;
  applicable_scope: string | null;
  not_applicable: string | null;
  current_status: string;
}

export interface ConsentItem {
  scope: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}
