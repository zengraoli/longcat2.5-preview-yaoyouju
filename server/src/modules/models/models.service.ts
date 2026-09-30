import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';
import { ERR } from '../../common/utils/business-exception';

export interface ReleaseView {
  id: string;
  modelName: string;
  promptVersion: string;
  retrievalStrategy: string;
  contentLibVersion: string;
  status: string;
  createdAt: string;
}

export interface EvalRunView {
  id: string;
  modelReleaseId: string;
  evalSetId: string;
  evalSetName: string;
  metrics: Record<string, unknown> | null;
  result: string | null;
  trigger?: string | null;
  createdAt: string;
}

@Injectable()
export class ModelsService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly audit: AuditService,
  ) {}

  /** 发布组合（候选） */
  createRelease(actorId: string, input: {
    modelName: string;
    promptVersion: string;
    retrievalStrategy: string;
    contentLibVersion: string;
  }) {
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO MODEL_RELEASE (id, model_name, prompt_version, retrieval_strategy, content_lib_version, status, created_at)
         VALUES (?, ?, ?, ?, ?, '候选', ?)`,
      )
      .run(id, input.modelName, input.promptVersion, input.retrievalStrategy, input.contentLibVersion, new Date().toISOString());
    this.audit.record({ actorId, action: 'model:create', target: id, diff: input });
    return { id, status: '候选' };
  }

  listReleases(): ReleaseView[] {
    return this.appDb
      .prepare(
        `SELECT id, model_name AS modelName, prompt_version AS promptVersion,
                retrieval_strategy AS retrievalStrategy, content_lib_version AS contentLibVersion,
                status, created_at AS createdAt
         FROM MODEL_RELEASE ORDER BY created_at DESC, rowid DESC`,
      )
      .all() as ReleaseView[];
  }

  listEvalSets() {
    return this.appDb
      .prepare('SELECT id, name, case_count AS caseCount, deidentified FROM EVAL_SET ORDER BY rowid ASC')
      .all();
  }

  /** 新建评测集 */
  createEvalSet(actorId: string, input: { name: string; caseCount: number }) {
    const id = crypto.randomUUID();
    this.appDb
      .prepare('INSERT INTO EVAL_SET (id, name, case_count, deidentified) VALUES (?, ?, ?, 1)')
      .run(id, input.name, input.caseCount);
    this.audit.record({ actorId, action: 'model:eval-set-create', target: id, diff: { name: input.name } });
    return { id, name: input.name };
  }

  /** 评测集的运行记录 */
  listEvalSetRuns(evalSetId: string) {
    const rows = this.appDb
      .prepare(
        `SELECT r.id, r.model_release_id AS modelReleaseId, r.result, r.metrics, r.trigger, r.created_at AS createdAt
         FROM EVAL_RUN r WHERE r.eval_set_id = ? ORDER BY r.created_at DESC, r.rowid DESC LIMIT 20`,
      )
      .all(evalSetId) as Array<{ id: string; modelReleaseId: string; result: string; metrics: string; trigger: string | null; createdAt: string }>;
    return rows.map((r) => ({ ...r, metrics: this.parseMetrics(r.metrics) }));
  }

  /** 全部运行记录（最近，含触发原因与解析后的指标） */
  listAllEvalRuns() {
    const rows = this.appDb
      .prepare(
        `SELECT r.id, r.model_release_id AS modelReleaseId, s.name AS evalSetName, r.result, r.metrics, r.trigger, r.created_at AS createdAt
         FROM EVAL_RUN r JOIN EVAL_SET s ON s.id = r.eval_set_id
         ORDER BY r.created_at DESC, r.rowid DESC LIMIT 20`,
      )
      .all() as Array<{ id: string; modelReleaseId: string; evalSetName: string; result: string; metrics: string; trigger: string | null; createdAt: string }>;
    return rows.map((r) => ({ ...r, metrics: this.parseMetrics(r.metrics) }));
  }

  private parseMetrics(metrics: string | null): { 用例数?: number; 通过数?: number; 通过率?: number } {
    if (!metrics) return {};
    try {
      return JSON.parse(metrics);
    } catch {
      return {};
    }
  }

  /** 导入用例（去标识化，每行一条“输入 | 期望”） */
  importCases(actorId: string, evalSetId: string, content: string) {
    const evalSet = this.appDb.prepare('SELECT id FROM EVAL_SET WHERE id = ?').get(evalSetId) as { id: string } | undefined;
    if (!evalSet) throw new NotFoundException('评测集不存在');
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const insert = this.appDb.prepare(
      `INSERT INTO EVAL_CASE (id, eval_set_id, case_key, input, expected, actual, result, source, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, '未运行', '导入', ?)`,
    );
    let count = 0;
    for (const line of lines) {
      const [input, expected] = line.split('|').map((s) => s.trim());
      if (!input || !expected) continue;
      insert.run(crypto.randomUUID(), evalSetId, `IMP-${Date.now()}-${count}`, input.slice(0, 500), expected.slice(0, 500), new Date().toISOString());
      count += 1;
    }
    if (count > 0) {
      this.appDb.prepare('UPDATE EVAL_SET SET case_count = case_count + ? WHERE id = ?').run(count, evalSetId);
    }
    this.audit.record({ actorId, action: 'model:eval-case-import', target: evalSetId, diff: { count } });
    return { imported: count };
  }

  /** 评测集用例（可按结果过滤） */
  listCases(evalSetId: string, result?: string) {
    if (result) {
      return this.appDb
        .prepare(
          `SELECT id, case_key AS caseKey, input, expected, actual, result, source
           FROM EVAL_CASE WHERE eval_set_id = ? AND result = ? ORDER BY created_at ASC, rowid ASC`,
        )
        .all(evalSetId, result) as Array<{ id: string; caseKey: string; input: string; expected: string; actual: string; result: string; source: string }>;
    }
    return this.appDb
      .prepare(
        `SELECT id, case_key AS caseKey, input, expected, actual, result, source
         FROM EVAL_CASE WHERE eval_set_id = ? ORDER BY created_at ASC, rowid ASC`,
      )
      .all(evalSetId) as Array<{ id: string; caseKey: string; input: string; expected: string; actual: string; result: string; source: string }>;
  }

  /** 标记用例已修复并重跑该评测集 */
  fixCase(actorId: string, caseId: string) {
    const row = this.appDb
      .prepare('SELECT id, eval_set_id AS evalSetId FROM EVAL_CASE WHERE id = ?')
      .get(caseId) as { id: string; evalSetId: string } | undefined;
    if (!row) throw new NotFoundException('用例不存在');
    // 重跑该评测集对应的发布组合（取最近运行过的组合）
    const run = this.appDb
      .prepare(
        `SELECT model_release_id AS modelReleaseId FROM EVAL_RUN
         WHERE eval_set_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1`,
      )
      .get(row.evalSetId) as { modelReleaseId: string } | undefined;
    if (run) {
      this.runEval(actorId, run.modelReleaseId, '标记已修复并重跑');
    }
    this.audit.record({ actorId, action: 'model:eval-case-fix', target: caseId });
    return { id: caseId, fixed: true };
  }

  /** 运行评测（本地模拟实现）：对每个评测集生成指标与结果；trigger 为触发原因 */
  runEval(actorId: string, releaseId: string, trigger = '手动运行'): EvalRunView[] {
    const release = this.appDb
      .prepare('SELECT id, prompt_version AS promptVersion, retrieval_strategy AS retrievalStrategy FROM MODEL_RELEASE WHERE id = ?')
      .get(releaseId) as { id: string; promptVersion: string; retrievalStrategy: string } | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');
    const evalSets = this.appDb
      .prepare('SELECT id, name FROM EVAL_SET ORDER BY rowid ASC')
      .all() as Array<{ id: string; name: string }>;
    const runs: EvalRunView[] = [];
    for (const set of evalSets) {
      // 本地模拟：根据发布组合的提示词与检索策略生成确定性指标（演示用，不调用外部服务）
      const passRate = this.mockPassRate(release.promptVersion, release.retrievalStrategy, set.name);
      const failedCases = this.appDb
        .prepare("SELECT case_key AS caseKey, input, expected, actual FROM EVAL_CASE WHERE eval_set_id = ? AND result = '不通过'")
        .all(set.id) as Array<{ caseKey: string; input: string; expected: string; actual: string }>;
      // 结果判定：通过率达标且评测集内没有未修复的不通过用例才算通过
      const passed = passRate >= 0.8 && failedCases.length === 0;
      const caseCount = 12;
      const metrics = {
        用例数: caseCount,
        通过数: Math.round(caseCount * passRate),
        通过率: passRate,
        失败用例: failedCases.map((c) => ({ 用例: c.caseKey, 输入: c.input, 期望: c.expected, 实际: c.actual, 判定: '不通过' })),
      };
      const result = passed ? '通过' : '阻断发布';
      const id = crypto.randomUUID();
      this.appDb
        .prepare(
          `INSERT INTO EVAL_RUN (id, model_release_id, eval_set_id, metrics, result, trigger, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(id, releaseId, set.id, JSON.stringify(metrics), result, trigger, new Date().toISOString());
      runs.push({
        id,
        modelReleaseId: releaseId,
        evalSetId: set.id,
        evalSetName: set.name,
        metrics,
        result,
        trigger,
        createdAt: new Date().toISOString(),
      });
    }
    this.audit.record({ actorId, action: 'model:eval', target: releaseId, diff: { runs: runs.length } });
    return runs;
  }

  listEvalRuns(releaseId: string): EvalRunView[] {
    const rows = this.appDb
      .prepare(
        `SELECT r.id, r.model_release_id AS modelReleaseId, r.eval_set_id AS evalSetId,
                s.name AS evalSetName, r.metrics, r.result, r.trigger, r.created_at AS createdAt
         FROM EVAL_RUN r JOIN EVAL_SET s ON s.id = r.eval_set_id
         WHERE r.model_release_id = ? ORDER BY r.created_at DESC, r.rowid DESC`,
      )
      .all(releaseId) as Array<{ id: string; modelReleaseId: string; evalSetId: string; evalSetName: string; metrics: string; result: string; trigger: string | null; createdAt: string }>;
    return rows.map((r) => ({ ...r, metrics: this.parseMetrics(r.metrics) }));
  }

  /** 发布流程：候选 → 评测门禁 → 灰度 → 生效；需双人确认（技术负责人发起，超管确认） */
  publish(actorId: string, releaseId: string, permissions: string[] = []) {
    const release = this.appDb
      .prepare('SELECT id, status FROM MODEL_RELEASE WHERE id = ?')
      .get(releaseId) as { id: string; status: string } | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');
    if (release.status === '生效') {
      throw new ConflictException('该发布组合已生效');
    }
    // 评测门禁：所有评测集都必须通过
    const runs = this.appDb
      .prepare('SELECT result FROM EVAL_RUN WHERE model_release_id = ?')
      .all(releaseId) as Array<{ result: string | null }>;
    if (runs.length === 0) {
      throw ERR.EVAL_BLOCKED('评测门禁未通过：请先运行评测');
    }
    const failed = runs.filter((r) => r.result !== '通过');
    if (failed.length > 0) {
      throw ERR.EVAL_BLOCKED('评测门禁未通过，阻断发布');
    }
    // 双人确认：技术负责人发起
    const pending = this.appDb
      .prepare(
        `SELECT reviewer_id AS reviewerId FROM REVIEW_RECORD
         WHERE target_id = ? AND target_type = 'MODEL_RELEASE' AND decision = '模型发布-发起'
         ORDER BY reviewed_at DESC, rowid DESC LIMIT 1`,
      )
      .get(releaseId) as { reviewerId: string } | undefined;
    if (!pending) {
      if (!permissions.includes('model:release')) {
        throw new ForbiddenException('无权限发起模型发布');
      }
      // 发起时把旧的未消费发起记录标记为已消费
      this.appDb
        .prepare("UPDATE REVIEW_RECORD SET consumed = 1 WHERE target_id = ? AND target_type = 'MODEL_RELEASE' AND decision = '模型发布-发起' AND consumed = 0")
        .run(releaseId);
      this.appDb
        .prepare(
          `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
           VALUES (?, ?, 'MODEL_RELEASE', ?, '模型发布-发起', '模型发布第一操作人', NULL, ?)`,
        )
        .run(crypto.randomUUID(), releaseId, actorId, new Date().toISOString());
      this.audit.record({ actorId, action: 'model:publish-initiate', target: releaseId });
      return { id: releaseId, status: '待第二人确认' };
    }
    if (pending.reviewerId === actorId) {
      throw new ConflictException('模型发布需双人确认：不能由同一操作人发起并确认');
    }
    if (!permissions.includes('model:confirm')) {
      throw new ForbiddenException('无权限确认模型发布');
    }
    // 消费发起记录
    this.appDb
      .prepare("UPDATE REVIEW_RECORD SET consumed = 1 WHERE target_id = ? AND target_type = 'MODEL_RELEASE' AND decision = '模型发布-发起' AND consumed = 0")
      .run(releaseId);
    // 超管确认 → 灰度 → 生效；停用其他生效版本
    this.appDb
      .prepare("UPDATE MODEL_RELEASE SET status = '灰度' WHERE id = ?")
      .run(releaseId);
    this.appDb
      .prepare("UPDATE MODEL_RELEASE SET status = '生效' WHERE id = ?")
      .run(releaseId);
    this.appDb
      .prepare("UPDATE MODEL_RELEASE SET status = '已归档' WHERE id != ? AND status = '生效'")
      .run(releaseId);
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'MODEL_RELEASE', ?, '模型发布-确认', '模型发布第二操作人', NULL, ?)`,
      )
      .run(crypto.randomUUID(), releaseId, actorId, new Date().toISOString());
    this.audit.record({ actorId, action: 'model:publish', target: releaseId, diff: { status: '生效' } });
    return { id: releaseId, status: '生效' };
  }

  /** 回滚：当前版本标记已回滚，恢复上一个“已通过全部评测”的版本为生效（需双人确认） */
  rollback(actorId: string, releaseId: string, permissions: string[] = []) {
    const release = this.appDb
      .prepare('SELECT id, status FROM MODEL_RELEASE WHERE id = ?')
      .get(releaseId) as { id: string; status: string } | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');
    // 候选（从未评测/从未生效）不允许回滚
    if (release.status === '候选') {
      throw new ConflictException('候选发布组合未通过评测，不能回滚');
    }
    // 找上一个可回滚的版本：必须已通过全部评测（有评测记录且全部通过），且不是候选
    const prev = this.appDb
      .prepare(
        `SELECT mr.id FROM MODEL_RELEASE mr
         WHERE mr.id != ? AND mr.status != '候选' AND mr.status != '已回滚'
           AND EXISTS (SELECT 1 FROM EVAL_RUN r WHERE r.model_release_id = mr.id)
           AND NOT EXISTS (SELECT 1 FROM EVAL_RUN r WHERE r.model_release_id = mr.id AND r.result != '通过')
         ORDER BY mr.created_at DESC LIMIT 1`,
      )
      .get(releaseId) as { id: string } | undefined;
    if (!prev) {
      throw new ConflictException('没有可回滚的已通过评测版本');
    }
    // 双人确认：技术负责人发起，超管确认
    const pending = this.appDb
      .prepare(
        `SELECT reviewer_id AS reviewerId FROM REVIEW_RECORD
         WHERE target_id = ? AND target_type = 'MODEL_RELEASE' AND decision = '模型回滚-发起' AND consumed = 0
         ORDER BY reviewed_at DESC, rowid DESC LIMIT 1`,
      )
      .get(releaseId) as { reviewerId: string } | undefined;
    if (!pending) {
      if (!permissions.includes('model:release')) {
        throw new ForbiddenException('无权限发起模型回滚');
      }
      // 发起时把旧的未消费发起记录标记为已消费
      this.appDb
        .prepare("UPDATE REVIEW_RECORD SET consumed = 1 WHERE target_id = ? AND target_type = 'MODEL_RELEASE' AND decision = '模型回滚-发起' AND consumed = 0")
        .run(releaseId);
      this.appDb
        .prepare(
          `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
           VALUES (?, ?, 'MODEL_RELEASE', ?, '模型回滚-发起', '模型回滚第一操作人', NULL, ?)`,
        )
        .run(crypto.randomUUID(), releaseId, actorId, new Date().toISOString());
      this.audit.record({ actorId, action: 'model:rollback-initiate', target: releaseId });
      return { id: releaseId, status: '待第二人确认' };
    }
    if (pending.reviewerId === actorId) {
      throw new ConflictException('模型回滚需双人确认：不能由同一操作人发起并确认');
    }
    if (!permissions.includes('model:confirm')) {
      throw new ForbiddenException('无权限确认模型回滚');
    }
    // 消费发起记录
    this.appDb
      .prepare("UPDATE REVIEW_RECORD SET consumed = 1 WHERE target_id = ? AND target_type = 'MODEL_RELEASE' AND decision = '模型回滚-发起' AND consumed = 0")
      .run(releaseId);
    const tx = this.appDb.transaction(() => {
      this.appDb.prepare("UPDATE MODEL_RELEASE SET status = '已回滚' WHERE id = ?").run(releaseId);
      // 恢复上一个已通过评测的版本为生效；同时停用其他生效版本，保证只有一个生效
      this.appDb.prepare("UPDATE MODEL_RELEASE SET status = '已归档' WHERE id != ? AND id != ? AND status = '生效'").run(releaseId, prev.id);
      this.appDb.prepare("UPDATE MODEL_RELEASE SET status = '生效' WHERE id = ?").run(prev.id);
    });
    tx();
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'MODEL_RELEASE', ?, '模型回滚-确认', '模型回滚第二操作人', NULL, ?)`,
      )
      .run(crypto.randomUUID(), releaseId, actorId, new Date().toISOString());
    this.audit.record({ actorId, action: 'model:rollback', target: releaseId, diff: { restored: prev.id } });
    return { id: releaseId, status: '已回滚', restored: prev.id };
  }

  /**
   * 本地模拟的通过率（演示用）：基于提示词与检索策略生成确定性指标。
   * 不同检索策略在不同评测集上表现不同（部分组合低于 0.8 门禁线），
   * 避免“随便写一个策略都全部通过”。
   */
  private mockPassRate(promptVersion: string, retrievalStrategy: string, evalSetName: string): number {
    // 各检索策略的基线通过率（策略 × 评测集）
    const table: Record<string, Record<string, number>> = {
      'keyword-v1': { '错误安慰': 0.84, '关键遗漏': 0.78, '左右侧混淆': 0.72, '隐私': 0.9 },
      'keyword-v2': { '错误安慰': 0.88, '关键遗漏': 0.85, '左右侧混淆': 0.85, '隐私': 0.92 },
      'semantic-v1': { '错误安慰': 0.9, '关键遗漏': 0.82, '左右侧混淆': 0.88, '隐私': 0.76 },
      'hybrid-v1': { '错误安慰': 0.92, '关键遗漏': 0.9, '左右侧混淆': 0.9, '隐私': 0.88 },
    };
    let rate = (table[retrievalStrategy] ?? table['keyword-v1'])[evalSetName] ?? 0.9;
    // 提示词版本调整
    if (promptVersion === 'prompt-p1') rate -= 0.04;
    if (promptVersion === 'prompt-p3') rate += 0.02;
    return Math.round(Math.min(0.99, Math.max(0.5, rate)) * 100) / 100;
  }
}
