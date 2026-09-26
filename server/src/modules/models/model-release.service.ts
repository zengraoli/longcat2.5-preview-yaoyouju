import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class ModelReleaseService {
  createRelease(dto: { modelName: string; promptVersion: string; retrievalStrategy: string; contentLibVersion: string }) {
    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO model_release (id, model_name, prompt_version, retrieval_strategy, content_lib_version, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, dto.modelName, dto.promptVersion, dto.retrievalStrategy, dto.contentLibVersion, '候选',
    );
    return { id, ...dto, status: '候选' };
  }

  submitForEval(dto: { modelReleaseId: string; evalSetId: string; triggerReason: string }) {
    const db = getDb();
    const release = db.prepare('SELECT * FROM model_release WHERE id = ?').get(dto.modelReleaseId) as any | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');
    if (release.status !== '候选') throw new BadRequestException('只有候选状态可提交评测');

    const runId = randomUUID();
    db.prepare('INSERT INTO eval_run (id, model_release_id, eval_set_id, metrics, result) VALUES (?, ?, ?, ?, ?)').run(
      runId, dto.modelReleaseId, dto.evalSetId, JSON.stringify({}), 'pending',
    );
    return { runId, modelReleaseId: dto.modelReleaseId, evalSetId: dto.evalSetId, status: 'pending' };
  }

  submitEvalResult(dto: { modelReleaseId: string; evalSetId: string; metrics: Record<string, number>; result: string; failedCases?: any[] }) {
    const db = getDb();
    const run = db.prepare('SELECT * FROM eval_run WHERE model_release_id = ? AND eval_set_id = ? ORDER BY created_at DESC LIMIT 1').get(dto.modelReleaseId, dto.evalSetId) as any | undefined;
    if (!run) throw new NotFoundException('评测运行不存在');

    db.prepare('UPDATE eval_run SET metrics = ?, result = ? WHERE id = ?').run(JSON.stringify(dto.metrics), dto.result, run.id);

    if (dto.result === '通过') {
      db.prepare("UPDATE model_release SET status = '灰度' WHERE id = ?").run(dto.modelReleaseId);
    }

    return { submitted: true, runId: run.id, result: dto.result };
  }

  publish(dto: { releaseId: string }) {
    const db = getDb();
    const release = db.prepare('SELECT * FROM model_release WHERE id = ?').get(dto.releaseId) as any | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');

    const runs = db.prepare('SELECT * FROM eval_run WHERE model_release_id = ?').all(dto.releaseId) as any[];
    const allPassed = runs.length > 0 && runs.every((r: any) => r.result === '通过');
    if (!allPassed) throw new BadRequestException('评测门禁未通过，无法发布');

    if (release.status !== '灰度') throw new BadRequestException('只有灰度状态可发布为生效');

    db.prepare("UPDATE model_release SET status = '生效' WHERE id = ?").run(dto.releaseId);
    db.prepare('INSERT INTO audit_log (id, actor_id, action, target, diff, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), 'system', 'model.published', dto.releaseId, JSON.stringify({ previousStatus: '灰度' }), new Date().toISOString(),
    );
    return { published: true, releaseId: dto.releaseId, status: '生效' };
  }

  rollback(dto: { releaseId: string }) {
    const db = getDb();
    const release = db.prepare('SELECT * FROM model_release WHERE id = ?').get(dto.releaseId) as any | undefined;
    if (!release) throw new NotFoundException('发布组合不存在');
    db.prepare("UPDATE model_release SET status = '已回滚' WHERE id = ?").run(dto.releaseId);
    db.prepare('INSERT INTO audit_log (id, actor_id, action, target, diff, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), 'system', 'model.rollback', dto.releaseId, JSON.stringify({ previousStatus: release.status }), new Date().toISOString(),
    );
    return { rolledBack: true, releaseId: dto.releaseId };
  }

  getReleases() {
    const db = getDb();
    return db.prepare('SELECT * FROM model_release ORDER BY rowid DESC').all();
  }

  getEvalRuns(releaseId: string) {
    const db = getDb();
    return db.prepare('SELECT * FROM eval_run WHERE model_release_id = ? ORDER BY rowid DESC').all(releaseId);
  }
}
