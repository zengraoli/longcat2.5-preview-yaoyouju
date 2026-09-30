import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { EvidenceRetrieval } from '../../ai/retrieval';
import { matchOutOfScope, matchRedFlags, RuleHit } from '../safety/rules';
import { SafetyService } from '../safety/safety.service';

export interface QaMessageView {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Array<{ docId: string; docTitle: string; content: string }>;
  createdAt: string;
}

const REASSURANCE_PATTERN = /确定吗|真的吗|一定|保证|没事吧|会不会有事|能放心吗|没问题吧|你说的是真的/;

/** 严重程度类问题：不作诊断、不评分，稳定解释并转为复诊问题 */
const SEVERITY_PATTERN = /是不是很严重|严重吗|厉害吗|要紧吗|有多严重|是不是很厉害|严重不严重|是不是很要紧|会不会很严重/;

const STABLE_EXPLANATION =
  '我们理解你的担心，同样的回答再说明一次：我们不作诊断，也不能保证症状的具体原因；影像上的表现与症状严重程度并不完全一致。这个问题建议带给医生，由医生面诊判断。'

/** 询问“哪些变化要提前就医 / 红旗信号”类问题：直接列出需及时就医的信号 */
const RED_FLAG_INFO_PATTERN = /哪些.*就医|什么.*就医|提前就医|要就医|需就医|红旗|危险信号|警示信号|哪些.*信号|什么情况.*就医|哪些症状|严重表现|要立即就医|尽快就医/;

const RED_FLAG_INFO_ANSWER =
  '出现以下变化请及时就医：1）大小便控制不了、失禁或解不出，会阴、肛门、臀部麻木或没知觉；2）腿部或脚越来越无力、发软、抬不起来、走路绊倒；3）夜里疼得睡不着，或体重明显下降；4）摔倒、跌伤、撞伤后腰部剧痛；5）发烧、发冷、怕冷伴腰痛；6）疼痛剧烈、止痛药压不住；7）有肿瘤病史又出现新发腰痛。';


@Injectable()
export class QaService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly retrieval: EvidenceRetrieval,
    private readonly safety: SafetyService,
  ) {}

  /** 创建会话（基于当前分析上下文） */
  createSession(userId: string, analysisId: string | null, title: string | null) {
    const analysis = analysisId
      ? (this.appDb
          .prepare(
            `SELECT a.id, a.episode_id AS episodeId FROM ANALYSIS a
             JOIN EPISODE e ON e.id = a.episode_id WHERE a.id = ? AND e.user_id = ?`,
          )
          .get(analysisId, userId) as { id: string; episodeId: string } | undefined)
      : undefined;
    if (analysisId && !analysis) {
      throw new NotFoundException('分析不存在');
    }
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO QA_SESSION (id, user_id, analysis_id, title, created_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, userId, analysis?.id ?? null, title ?? null, new Date().toISOString());
    return { id, analysisId: analysis?.id ?? null, title: title ?? null };
  }

  listSessions(userId: string) {
    return this.appDb
      .prepare(
        `SELECT id, analysis_id AS analysisId, title, created_at AS createdAt
         FROM QA_SESSION WHERE user_id = ? ORDER BY created_at DESC, rowid DESC`,
      )
      .all(userId);
  }

  getSession(userId: string, sessionId: string) {
    const session = this.appDb
      .prepare(
        `SELECT id, user_id AS userId, analysis_id AS analysisId, title, created_at AS createdAt
         FROM QA_SESSION WHERE id = ? AND user_id = ?`,
      )
      .get(sessionId, userId) as
      | { id: string; userId: string; analysisId: string | null; title: string | null; createdAt: string }
      | undefined;
    if (!session) throw new NotFoundException('会话不存在');
    const messages = this.appDb
      .prepare(
        `SELECT id, role, content, citations, created_at AS createdAt
         FROM QA_MESSAGE WHERE session_id = ? ORDER BY created_at ASC, rowid ASC`,
      )
      .all(sessionId) as Array<{
      id: string;
      role: string;
      content: string;
      citations: string | null;
      createdAt: string;
    }>;
    return {
      ...session,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations ? JSON.parse(m.citations) : [],
        createdAt: m.createdAt,
      })),
    };
  }

  /** 提问：越界明确不答并可加入复诊问题；反复求保证时稳定解释并结束本轮 */
  async ask(
    userId: string,
    sessionId: string,
    question: string,
  ): Promise<{
    message: QaMessageView;
    outOfScope: RuleHit[];
    roundEnded: boolean;
    followupQuestionAdded: boolean;
  }> {
    const session = this.getSession(userId, sessionId);
    const now = new Date().toISOString();
    // 保存用户消息
    const userMsgId = crypto.randomUUID();
    this.appDb
      .prepare('INSERT INTO QA_MESSAGE (id, session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, NULL, ?)')
      .run(userMsgId, sessionId, 'user', question, now);

    // 红旗信号：立即提示就医并记录安全事件（分析提交时会扫描提问记录，拦截后续分析）
    const redFlags = matchRedFlags(question);
    if (redFlags.length > 0) {
      this.safety.checkAndRecord(userId, 'qa-ask', question);
      const content = `${redFlags[0].message} 你可以先记录这次变化，并尽快就医；本轮不会生成个性化分析。`;
      const msgId = crypto.randomUUID();
      this.appDb
        .prepare('INSERT INTO QA_MESSAGE (id, session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, NULL, ?)')
        .run(msgId, sessionId, 'assistant', content, now);
      return {
        message: { id: msgId, role: 'assistant', content, citations: [], createdAt: now },
        outOfScope: redFlags.map((h) => ({ code: h.code, name: h.name, severity: h.severity, action: h.action, message: h.message })),
        roundEnded: true,
        followupQuestionAdded: false,
      };
    }

    // 越界判定：诊断、手术、用药明确不答
    const outOfScope = matchOutOfScope(question);
    if (outOfScope.length > 0) {
      this.safety.checkAndRecord(userId, 'qa-ask', question);
      const content =
        `${outOfScope[0].message} 你可以把这个问题加入复诊问题清单，复诊时带给医生。`;
      const msgId = crypto.randomUUID();
      this.appDb
        .prepare('INSERT INTO QA_MESSAGE (id, session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, NULL, ?)')
        .run(msgId, sessionId, 'assistant', content, now);
      return {
        message: { id: msgId, role: 'assistant', content, citations: [], createdAt: now },
        outOfScope,
        roundEnded: false,
        followupQuestionAdded: false,
      };
    }

    // 询问“哪些变化要提前就医”类问题：直接列出需及时就医的信号
    if (RED_FLAG_INFO_PATTERN.test(question)) {
      const msgId = crypto.randomUUID();
      this.appDb
        .prepare('INSERT INTO QA_MESSAGE (id, session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, NULL, ?)')
        .run(msgId, sessionId, 'assistant', RED_FLAG_INFO_ANSWER, now);
      return {
        message: { id: msgId, role: 'assistant', content: RED_FLAG_INFO_ANSWER, citations: [], createdAt: now },
        outOfScope: [],
        roundEnded: false,
        followupQuestionAdded: false,
      };
    }

    // 严重程度类问题：不作诊断、不评分，给出稳定解释并转为复诊问题
    if (SEVERITY_PATTERN.test(question)) {
      const content =
        '我们不能评估你的症状严重程度，这需要医生结合查体与检查来判断。可以把“我的情况严重吗”这个问题加入复诊问题清单，复诊时请医生评估。';
      const msgId = crypto.randomUUID();
      this.appDb
        .prepare('INSERT INTO QA_MESSAGE (id, session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, NULL, ?)')
        .run(msgId, sessionId, 'assistant', content, now);
      return {
        message: { id: msgId, role: 'assistant', content, citations: [], createdAt: now },
        outOfScope: [{ code: 'SC-04', name: '严重程度评估', severity: '中', action: '停止个性化分析', message: content }],
        roundEnded: false,
        followupQuestionAdded: false,
      };
    }

    // 反复求保证：给出稳定解释并结束本轮
    const isReassurance = REASSURANCE_PATTERN.test(question);
    if (isReassurance) {
      const previous = this.appDb
        .prepare(
          `SELECT content FROM QA_MESSAGE WHERE session_id = ? AND role = 'assistant' ORDER BY created_at DESC, rowid DESC LIMIT 1`,
        )
        .get(sessionId) as { content: string } | undefined;
      const roundEnded = previous?.content === STABLE_EXPLANATION;
      const evidence = this.retrieval.search('影像 症状 不一致 诊断', 1);
      const citations = evidence.map((e) => ({ docId: e.docId, docTitle: e.docTitle, content: e.content }));
      const msgId = crypto.randomUUID();
      this.appDb
        .prepare('INSERT INTO QA_MESSAGE (id, session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(msgId, sessionId, 'assistant', STABLE_EXPLANATION, JSON.stringify(citations), now);
      return {
        message: { id: msgId, role: 'assistant', content: STABLE_EXPLANATION, citations, createdAt: now },
        outOfScope: [],
        roundEnded,
        followupQuestionAdded: false,
      };
    }

    // 正常回答：基于证据库检索，引用来源
    const evidence = this.retrieval.search(question, 3);
    let content: string;
    let citations: Array<{ docId: string; docTitle: string; content: string }> = [];
    if (evidence.length > 0) {
      citations = evidence.map((e) => ({ docId: e.docId, docTitle: e.docTitle, content: e.content }));
      content = evidence.map((e) => e.content).join('\n');
    } else {
      content = '证据库中暂无与这个问题相关的资料。建议把这个问题加入复诊问题清单，复诊时带给医生。';
    }
    const msgId = crypto.randomUUID();
    this.appDb
      .prepare('INSERT INTO QA_MESSAGE (id, session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(msgId, sessionId, 'assistant', content, JSON.stringify(citations), now);
    return {
      message: { id: msgId, role: 'assistant', content, citations, createdAt: now },
      outOfScope: [],
      roundEnded: false,
      followupQuestionAdded: false,
    };
  }

  /** 一键加入复诊问题 */
  addFollowupQuestion(userId: string, sessionId: string, question: string) {
    this.getSession(userId, sessionId);
    const id = crypto.randomUUID();
    this.appDb
      .prepare('INSERT INTO QA_FOLLOWUP_QUESTION (id, session_id, question, created_at) VALUES (?, ?, ?, ?)')
      .run(id, sessionId, question, new Date().toISOString());
    return { added: true, question };
  }

  listFollowupQuestions(userId: string, sessionId: string) {
    this.getSession(userId, sessionId);
    return this.appDb
      .prepare(
        `SELECT id, question, created_at AS createdAt FROM QA_FOLLOWUP_QUESTION
         WHERE session_id = ? ORDER BY created_at ASC, rowid ASC`,
      )
      .all(sessionId) as Array<{ id: string; question: string; createdAt: string }>;
  }
}
