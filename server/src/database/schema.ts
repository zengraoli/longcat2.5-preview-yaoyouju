import type Database from 'better-sqlite3';

/** 业务库 DDL（app.db） */
export const BUSINESS_DDL = `
CREATE TABLE IF NOT EXISTS USER (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  retention_until TEXT
);
CREATE TABLE IF NOT EXISTS CONSENT (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES USER(id),
  scope TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS EPISODE (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES USER(id),
  title TEXT NOT NULL,
  onset_date TEXT,
  onset_certainty TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS CARE_EVENT (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES EPISODE(id),
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  source_type TEXT NOT NULL,
  raw_text TEXT,
  verify_status TEXT NOT NULL DEFAULT '尚未确认'
);
CREATE TABLE IF NOT EXISTS REPORT (
  id TEXT PRIMARY KEY,
  care_event_id TEXT NOT NULL REFERENCES CARE_EVENT(id),
  report_date TEXT,
  raw_text TEXT NOT NULL,
  extracted_terms TEXT,
  oss_key TEXT
);
CREATE TABLE IF NOT EXISTS SYMPTOM_LOG (
  id TEXT PRIMARY KEY,
  care_event_id TEXT NOT NULL REFERENCES CARE_EVENT(id),
  sit_minutes INTEGER,
  planned_activity_done TEXT,
  sleep_impact INTEGER,
  top_worry TEXT,
  leg_change TEXT
);
CREATE TABLE IF NOT EXISTS ANALYSIS (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES EPISODE(id),
  version INTEGER NOT NULL,
  model_release_id TEXT,
  sections TEXT NOT NULL,
  retrieval_snapshot TEXT,
  safety_flag TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ANALYSIS_CITATION (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES ANALYSIS(id),
  evidence_doc_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  supported INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS FOLLOWUP_SUMMARY (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES EPISODE(id),
  content TEXT NOT NULL,
  export_format TEXT,
  exported_at TEXT
);
CREATE TABLE IF NOT EXISTS FEEDBACK (
  id TEXT PRIMARY KEY,
  analysis_id TEXT REFERENCES ANALYSIS(id),
  help_type TEXT,
  unsolved_question TEXT,
  is_error_report INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS SAFETY_EVENT (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES USER(id),
  rule_code TEXT NOT NULL,
  severity TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  source TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS EVIDENCE_DOC (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  license TEXT,
  verified_at TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS EVIDENCE_CHUNK (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES EVIDENCE_DOC(id),
  content TEXT NOT NULL,
  embedding TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS CONTENT_ITEM (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  applicable_scope TEXT,
  not_applicable TEXT,
  current_status TEXT NOT NULL DEFAULT '草稿',
  offline_switch INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS CONTENT_VERSION (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES CONTENT_ITEM(id),
  version INTEGER NOT NULL,
  script TEXT,
  asset_key TEXT,
  subtitle_text TEXT,
  model_asset_version TEXT,
  based_on TEXT,
  published_at TEXT
);
CREATE TABLE IF NOT EXISTS REVIEW_RECORD (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  reviewer_id TEXT,
  decision TEXT NOT NULL,
  review_scope TEXT,
  comment TEXT,
  reviewed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ADMIN_USER (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  mfa_enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS ROLE (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  permissions TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS AUDIT_LOG (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  diff TEXT,
  request_id TEXT,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS MODEL_RELEASE (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  retrieval_strategy TEXT NOT NULL,
  content_lib_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '候选',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS EVAL_RUN (
  id TEXT PRIMARY KEY,
  model_release_id TEXT NOT NULL REFERENCES MODEL_RELEASE(id),
  eval_set_id TEXT NOT NULL,
  metrics TEXT,
  result TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS EVAL_SET (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  case_count INTEGER NOT NULL DEFAULT 0,
  deidentified INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS FEATURE_SWITCH (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS CASE_SUBMISSION (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES USER(id),
  edited_content TEXT NOT NULL,
  consent_scope TEXT,
  status TEXT NOT NULL DEFAULT '待审',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ANALYSIS_TASK (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES EPISODE(id),
  status TEXT NOT NULL DEFAULT '排队',
  payload TEXT,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS QA_SESSION (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES USER(id),
  analysis_id TEXT REFERENCES ANALYSIS(id),
  title TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS QA_MESSAGE (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES QA_SESSION(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  citations TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS SESSION (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES USER(id),
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS QA_FOLLOWUP_QUESTION (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES QA_SESSION(id),
  question TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS FEEDBACK_REPORT (
  feedback_id TEXT PRIMARY KEY,
  severity TEXT,
  status TEXT NOT NULL DEFAULT '待处理',
  resolution TEXT,
  authorized INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_care_event_episode ON CARE_EVENT(episode_id);
CREATE INDEX IF NOT EXISTS idx_analysis_episode ON ANALYSIS(episode_id);
CREATE INDEX IF NOT EXISTS idx_chunk_doc ON EVIDENCE_CHUNK(doc_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON AUDIT_LOG(created_at);
-- 审计日志只追加：数据库层禁止修改和删除
CREATE TRIGGER IF NOT EXISTS audit_log_no_update BEFORE UPDATE ON AUDIT_LOG
BEGIN
  SELECT RAISE(ABORT, 'AUDIT_LOG 只追加不可修改');
END;
CREATE TRIGGER IF NOT EXISTS audit_log_no_delete BEFORE DELETE ON AUDIT_LOG
BEGIN
  SELECT RAISE(ABORT, 'AUDIT_LOG 只追加不可删除');
END;
`;

/** 身份隔离库 DDL（identity.db） */
export const IDENTITY_DDL = `
CREATE TABLE IF NOT EXISTS IDENTITY_PROFILE (
  user_id TEXT PRIMARY KEY,
  phone_hash TEXT NOT NULL UNIQUE,
  phone_enc TEXT NOT NULL,
  real_name_enc TEXT
);
`;

export function createBusinessSchema(db: Database.Database): void {
  db.exec(BUSINESS_DDL);
}

export function createIdentitySchema(db: Database.Database): void {
  db.exec(IDENTITY_DDL);
}
