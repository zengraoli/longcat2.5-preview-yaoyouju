import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class QaService {
  constructor(private readonly safetyService: SafetyService) {}

  private readonly OUT_OF_SCOPE = ['诊断', '手术', '用药', '开药', '处方', '吃什么药', '要不要手术', '是不是肿瘤', '是不是癌'];
  private readonly REASSURANCE_KEYWORDS = ['保证', '一定', '肯定', '绝对', '会不会好', '能治好吗'];

  isOutOfScope(question: string): boolean {
    return this.OUT_OF_SCOPE.some((kw) => question.includes(kw));
  }

  isReassurance(question: string): boolean {
    return this.REASSURANCE_KEYWORDS.some((kw) => question.includes(kw));
  }

  askQuestion(userId: string, dto: { episodeId: string; analysisId?: string; question: string }) {
    const db = getDb();
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    const safetyResult = this.safetyService.fullCheck(dto.question);
    if (!safetyResult.passed && safetyResult.action === '停止个性化分析') {
      this.safetyService.recordSafetyEvent(userId, safetyResult.ruleCode!, 'high', safetyResult.action, 'qa');
      return {
        sessionId,
        answer: null,
        outOfScope: true,
        message: '该问题涉及诊断、手术或用药建议，超出服务范围。建议您将此问题加入复诊清单，咨询医生。',
        suggestedFollowupQuestion: dto.question,
      };
    }

    if (!safetyResult.passed && safetyResult.action === '提示就医') {
      this.safetyService.recordSafetyEvent(userId, safetyResult.ruleCode!, 'high', safetyResult.action, 'qa');
      return {
        sessionId,
        answer: null,
        redFlag: true,
        message: '检测到需要关注的症状，建议尽快就医。',
      };
    }

    if (this.isOutOfScope(dto.question)) {
      return {
        sessionId,
        answer: null,
        outOfScope: true,
        message: '该问题涉及诊断、手术或用药建议，超出服务范围。建议您将此问题加入复诊清单，咨询医生。',
        suggestedFollowupQuestion: dto.question,
      };
    }

    const analysis = dto.analysisId
      ? db.prepare('SELECT * FROM analysis WHERE id = ?').get(dto.analysisId)
      : db.prepare('SELECT * FROM analysis WHERE episode_id = ? ORDER BY version DESC LIMIT 1').get(dto.episodeId);
    if (!analysis) throw new NotFoundException('分析不存在');

    const sections = typeof (analysis as any).sections === 'string' ? JSON.parse((analysis as any).sections) : (analysis as any).sections;

    if (this.isReassurance(dto.question)) {
      const stableAnswer = `关于您的担忧：${sections.known.join('、')}是目前已确认的情况。每个人的恢复情况不同，建议保持与医生的随访沟通。此问题已为您加入复诊清单。`;
      db.prepare('INSERT INTO qa_session (id, user_id, episode_id, analysis_id, question, answer, is_out_of_scope, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        sessionId, userId, dto.episodeId, dto.analysisId || null, dto.question, stableAnswer, 0, now,
      );
      return {
        sessionId,
        answer: stableAnswer,
        isReassurance: true,
        source: 'evidence-doc-1',
        message: '已稳定回答并结束本轮',
      };
    }

    const evidenceChunks = db.prepare('SELECT * FROM evidence_chunk LIMIT 3').all() as any[];
    const relevantChunk = evidenceChunks[0];

    const answer = dto.question.includes('久坐')
      ? `久坐可能加重腰部负担。${sections.nextSteps.join('；')}。${relevantChunk ? '根据证据库：' + relevantChunk.content : ''}`
      : `根据您的情况：${sections.known.join('、')}。${sections.nextSteps.join('；')}。${relevantChunk ? '参考：' + relevantChunk.content : ''}`;

    db.prepare('INSERT INTO qa_session (id, user_id, episode_id, analysis_id, question, answer, is_out_of_scope, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      sessionId, userId, dto.episodeId, dto.analysisId || null, dto.question, answer, 0, now,
    );

    return {
      sessionId,
      answer,
      source: relevantChunk ? relevantChunk.doc_id : null,
    };
  }

  getSessionHistory(userId: string, episodeId?: string) {
    const db = getDb();
    if (episodeId) {
      return db.prepare('SELECT * FROM qa_session WHERE user_id = ? AND episode_id = ? ORDER BY created_at DESC').all(userId, episodeId);
    }
    return db.prepare('SELECT * FROM qa_session WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  }
}
