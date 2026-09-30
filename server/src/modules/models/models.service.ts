import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';

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

  /** 运行评测（本地模拟实现）：对每个评测集生成指标与结果 */
  runEval(actorId: string, releaseId: string): EvalRunView[] {
    const release = this.appDb
      .prepare('SELECT id FROM MODEL_RELEASE WHERE id = ?')
      .get(releaseId) as { id: string } | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');
    const evalSets = this.appDb
      .prepare('SELECT id, name FROM EVAL_SET ORDER BY rowid ASC')
      .all() as Array<{ id: string; name: string }>;
    const runs: EvalRunView[] = [];
    for (const set of evalSets) {
      // 本地模拟：根据评测集名称生成确定性的指标（演示用，不调用外部服务）
      const passRate = this.mockPassRate(set.name);
      const passed = passRate >= 0.8;
      const metrics = {
        用例数: 12,
        通过数: Math.round(12 * passRate),
        通过率: passRate,
        失败用例: passed ? [] : [{ 用例: '去标识化用例', 期望: '不作诊断', 实际: '给出了诊断性表述', 判定: '不通过' }],
      };
      const result = passed ? '通过' : '阻断发布';
      const id = crypto.randomUUID();
      this.appDb
        .prepare(
          `INSERT INTO EVAL_RUN (id, model_release_id, eval_set_id, metrics, result, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(id, releaseId, set.id, JSON.stringify(metrics), result, new Date().toISOString());
      runs.push({
        id,
        modelReleaseId: releaseId,
        evalSetId: set.id,
        evalSetName: set.name,
        metrics,
        result,
        createdAt: new Date().toISOString(),
      });
    }
    this.audit.record({ actorId, action: 'model:eval', target: releaseId, diff: { runs: runs.length } });
    return runs;
  }

  listEvalRuns(releaseId: string): EvalRunView[] {
    return this.appDb
      .prepare(
        `SELECT r.id, r.model_release_id AS modelReleaseId, r.eval_set_id AS evalSetId,
                s.name AS evalSetName, r.metrics, r.result, r.created_at AS createdAt
         FROM EVAL_RUN r JOIN EVAL_SET s ON s.id = r.eval_set_id
         WHERE r.model_release_id = ? ORDER BY r.created_at DESC, r.rowid DESC`,
      )
      .all(releaseId) as EvalRunView[];
  }

  /** 发布流程：候选 → 评测门禁 → 灰度 → 生效；门禁未通过则阻断发布 */
  publish(actorId: string, releaseId: string) {
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
      throw new ConflictException('评测门禁未通过：请先运行评测');
    }
    const failed = runs.filter((r) => r.result !== '通过');
    if (failed.length > 0) {
      throw new ConflictException('评测门禁未通过，阻断发布');
    }
    // 灰度 → 生效；停用其他生效版本
    this.appDb
      .prepare("UPDATE MODEL_RELEASE SET status = '灰度' WHERE id = ?")
      .run(releaseId);
    this.appDb
      .prepare("UPDATE MODEL_RELEASE SET status = '生效' WHERE id = ?")
      .run(releaseId);
    this.appDb
      .prepare("UPDATE MODEL_RELEASE SET status = '已归档' WHERE id != ? AND status = '生效'")
      .run(releaseId);
    this.audit.record({ actorId, action: 'model:publish', target: releaseId, diff: { status: '生效' } });
    return { id: releaseId, status: '生效' };
  }

  /** 回滚：当前版本标记已回滚，恢复上一个生效版本 */
  rollback(actorId: string, releaseId: string) {
    const release = this.appDb
      .prepare('SELECT id FROM MODEL_RELEASE WHERE id = ?')
      .get(releaseId) as { id: string } | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');
    this.appDb
      .prepare("UPDATE MODEL_RELEASE SET status = '已回滚' WHERE id = ?")
      .run(releaseId);
    // 恢复上一个候选版本为生效（演示：取最新的非当前版本）
    const prev = this.appDb
      .prepare("SELECT id FROM MODEL_RELEASE WHERE id != ? ORDER BY created_at DESC LIMIT 1")
      .get(releaseId) as { id: string } | undefined;
    if (prev) {
      this.appDb
        .prepare("UPDATE MODEL_RELEASE SET status = '生效' WHERE id = ?")
        .run(prev.id);
    }
    this.audit.record({ actorId, action: 'model:rollback', target: releaseId });
    return { id: releaseId, status: '已回滚' };
  }

  /** 本地模拟的通过率（演示用）：基于评测集名称生成确定性的指标 */
  private mockPassRate(evalSetName: string): number {
    // 所有评测集默认通过（演示用），门禁阻断通过手动构造失败用例演示
    return 1;
  }
}
