/**
 * AI 任务 Worker：独立进程（npm run worker），轮询 SQLite 任务表消费分析任务。
 * 流程：取排队任务 → 证据库受控检索 → 大模型适配层生成草稿 → 陈述提取与引用核对 → 保存分析版本。
 * 失败不无限重试：最多 3 次，超过后标记失败并记录错误。
 */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { AnalysisContext, LocalMockLlmAdapter } from '../ai/llm-adapter';
import { EvidenceRetrieval } from '../ai/retrieval';
import { RULESET_VERSION } from '../modules/safety/rules';

const MAX_ATTEMPTS = 3;

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[worker] ${new Date().toISOString()} ${message}`);
}

function openDb(): Database.Database {
  const resolved = path.resolve(process.cwd(), process.env.DB_PATH ?? './data/app.db');
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = new Database(resolved);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

interface TaskRow {
  id: string;
  episode_id: string;
  status: string;
  attempts: number;
}

function loadContext(db: Database.Database, episodeId: string) {
  const events = db
    .prepare(
      `SELECT event_type AS eventType, source_type AS sourceType, raw_text AS rawText,
              verify_status AS verifyStatus, occurred_at AS occurredAt
       FROM CARE_EVENT WHERE episode_id = ? ORDER BY occurred_at ASC, rowid ASC`,
    )
    .all(episodeId) as AnalysisContext['events'];
  const reports = db
    .prepare(
      `SELECT r.raw_text AS rawText, r.report_date AS reportDate
       FROM REPORT r JOIN CARE_EVENT e ON e.id = r.care_event_id
       WHERE e.episode_id = ? ORDER BY r.report_date ASC`,
    )
    .all(episodeId) as AnalysisContext['reports'];
  const symptomLogs = db
    .prepare(
      `SELECT s.sit_minutes AS sitMinutes, s.planned_activity_done AS plannedActivityDone,
              s.sleep_impact AS sleepImpact, s.top_worry AS topWorry, s.leg_change AS legChange
       FROM SYMPTOM_LOG s JOIN CARE_EVENT e ON e.id = s.care_event_id
       WHERE e.episode_id = ?`,
    )
    .all(episodeId) as AnalysisContext['symptomLogs'];
  return { episodeId, events, reports, symptomLogs };
}

function buildQuery(context: ReturnType<typeof loadContext>): string {
  // 用病程事件与报告原文构造检索查询
  const parts: string[] = [];
  for (const e of context.events) {
    if (e.rawText) parts.push(String(e.rawText));
  }
  for (const r of context.reports) {
    if (r.rawText) parts.push(String(r.rawText));
  }
  return parts.join(' ');
}

function recommendContent(db: Database.Database, query: string) {
  // 视频推荐开关关闭时不推荐视频
  const videoSwitch = db
    .prepare("SELECT enabled FROM FEATURE_SWITCH WHERE key = '视频推荐'")
    .get() as { enabled: number } | undefined;
  if (!videoSwitch?.enabled) return [];
  const tokens = (query.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z0-9/]{2,}/g) ?? []).filter(
    (t) => t.length >= 2,
  );
  const items = db
    .prepare(
      `SELECT id, title, applicable_scope AS applicableScope
       FROM CONTENT_ITEM WHERE current_status = '已发布' AND offline_switch = 0`,
    )
    .all() as Array<{ id: string; title: string; applicableScope: string }>;
  const scored = items
    .map((item) => {
      let score = 0;
      for (const token of tokens) {
        if (item.title.includes(token) || (item.applicableScope ?? '').includes(token)) score += 1;
      }
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return scored.map(({ item }) => ({
    title: item.title,
    contentId: item.id,
    reason: '与当前病程关键词匹配',
  }));
}

function processTask(db: Database.Database, task: TaskRow, llm: LocalMockLlmAdapter, retrieval: EvidenceRetrieval) {
  const context = loadContext(db, task.episode_id);
  const query = buildQuery(context);
  const evidence = retrieval.search(query);
  if (evidence.length === 0) {
    throw new Error('证据库检索失败：没有可用的证据片段');
  }
  const draft = llm.generateDraft(context, evidence);

  // 陈述提取与引用核对：剔除无依据的陈述
  const allStatements = draft.解释.map((s) => s.text);
  const check = llm.verifyCitations(allStatements, evidence);
  const supportedTexts = new Set(check.supported.map((s) => s.statement));
  const verified解释 = draft.解释.filter((s) => supportedTexts.has(s.text));
  if (verified解释.length === 0) {
    throw new Error('来源校验失败：所有解释陈述均无证据支持');
  }

  const videos = recommendContent(db, query);
  const sections = {
    已知: draft.已知,
    解释: verified解释,
    未知: draft.未知,
    下一步: draft.下一步,
    视频: videos,
  };
  // 使用当前生效的模型发布版本
  const release = db
    .prepare("SELECT id FROM MODEL_RELEASE WHERE status = '生效' ORDER BY created_at DESC LIMIT 1")
    .get() as { id: string } | undefined;
  const modelReleaseId = release?.id ?? 'release-1';
  // 内容库版本：取已发布内容的最大版本号（不再固定为 content-c1）
  const maxContentVersion = (
    db.prepare("SELECT MAX(version) AS v FROM CONTENT_VERSION v JOIN CONTENT_ITEM i ON i.id = v.item_id WHERE i.current_status = '已发布'").get() as { v: number | null }
  ).v;
  const contentLibVersion = maxContentVersion ? `content-c${maxContentVersion}` : 'content-c1';
  const retrievalSnapshot = {
    evidenceDocs: [...new Set(evidence.map((e) => e.docId))],
    modelRelease: modelReleaseId,
    contentLibVersion,
    rulesetVersion: RULESET_VERSION,
  };

  const now = new Date().toISOString();
  const version =
    ((db.prepare('SELECT COUNT(*) AS c FROM ANALYSIS WHERE episode_id = ?').get(task.episode_id) as { c: number }).c) + 1;
  db.prepare(
    `INSERT INTO ANALYSIS (id, episode_id, version, model_release_id, sections, retrieval_snapshot, safety_flag, created_at)
     VALUES (?, ?, ?, ?, ?, ?, '通过', ?)`,
  ).run(task.id, task.episode_id, version, modelReleaseId, JSON.stringify(sections), JSON.stringify(retrievalSnapshot), now);

  const insertCitation = db.prepare(
    'INSERT INTO ANALYSIS_CITATION (id, analysis_id, evidence_doc_id, statement, supported) VALUES (?, ?, ?, ?, 1)',
  );
  const crypto = require('node:crypto') as typeof import('node:crypto');
  for (const s of check.supported) {
    insertCitation.run(crypto.randomUUID(), task.id, s.evidenceDocId, s.statement);
  }
  return { analysisId: task.id, citations: check.supported.length, unsupported: check.unsupported.length };
}

function main() {
  const db = openDb();
  const llm = new LocalMockLlmAdapter();
  const retrieval = new EvidenceRetrieval(db);
  const pollMs = parseInt(process.env.WORKER_POLL_MS ?? '1000', 10);
  log(`started, polling every ${pollMs}ms`);

  const tick = () => {
    let task: TaskRow | undefined;
    try {
      task = db
        .prepare(`SELECT id, episode_id AS episode_id, status, attempts FROM ANALYSIS_TASK WHERE status = '排队' ORDER BY created_at ASC, rowid ASC LIMIT 1`)
        .get() as TaskRow | undefined;
    } catch {
      // 表尚未创建（服务正在启动），下轮再试
      return;
    }
    if (!task) return;
    // 认领任务
    db.prepare(`UPDATE ANALYSIS_TASK SET status = '处理中', updated_at = ? WHERE id = ? AND status = '排队'`).run(
      new Date().toISOString(),
      task.id,
    );
    log(`processing task ${task.id} (episode ${task.episode_id})`);
    try {
      const result = processTask(db, task, llm, retrieval);
      db.prepare(`UPDATE ANALYSIS_TASK SET status = '完成', updated_at = ? WHERE id = ?`).run(
        new Date().toISOString(),
        task.id,
      );
      log(`task ${task.id} completed: ${result.citations} citations, ${result.unsupported} unsupported removed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const attempts = task.attempts + 1;
      const status = attempts >= MAX_ATTEMPTS ? '失败' : '排队';
      db.prepare(`UPDATE ANALYSIS_TASK SET status = ?, error = ?, attempts = ?, updated_at = ? WHERE id = ?`).run(
        status,
        message,
        attempts,
        new Date().toISOString(),
        task.id,
      );
      log(`task ${task.id} failed (attempt ${attempts}/${MAX_ATTEMPTS}): ${message}`);
    }
  };

  tick();
  setInterval(tick, pollMs);
}

main();
