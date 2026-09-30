/** 大模型适配层：可替换接口，默认本地模拟实现（不调用任何外部服务） */

export interface AnalysisContext {
  episodeId: string;
  events: Array<{
    eventType: string;
    sourceType: string;
    rawText: string;
    verifyStatus: string;
    occurredAt: string;
  }>;
  reports: Array<{ rawText: string; reportDate: string | null }>;
  symptomLogs: Array<Record<string, unknown>>;
}

export interface EvidenceChunk {
  id: string;
  docId: string;
  docTitle: string;
  docSourceType: string;
  content: string;
  position: number;
}

export interface DraftSection {
  text: string;
  source: string | null;
}

export interface AnalysisDraft {
  已知: DraftSection[];
  解释: DraftSection[];
  未知: DraftSection[];
  下一步: DraftSection[];
  视频: Array<{ title: string; contentId: string; reason: string }>;
}

export interface CitationCheckResult {
  supported: Array<{ statement: string; evidenceDocId: string }>;
  unsupported: string[];
}

export interface LlmAdapter {
  readonly name: string;
  /** 生成五段草稿（约束：缺失即未知，不补写概率） */
  generateDraft(context: AnalysisContext, evidence: EvidenceChunk[]): AnalysisDraft;
  /** 陈述提取与引用核对：剔除无依据的陈述 */
  verifyCitations(statements: string[], evidence: EvidenceChunk[]): CitationCheckResult;
}

/** 本地模拟实现：按模板和证据片段生成 */
export class LocalMockLlmAdapter implements LlmAdapter {
  readonly name = 'local-mock-v1';

  generateDraft(context: AnalysisContext, evidence: EvidenceChunk[]): AnalysisDraft {
    const known: DraftSection[] = [];
    const explanations: DraftSection[] = [];
    const unknown: DraftSection[] = [];
    const nextSteps: DraftSection[] = [];

    // 已知：只写来源明确、已确认的事实
    for (const event of context.events) {
      if (event.verifyStatus === '已确认' && event.rawText) {
        known.push({ text: event.rawText, source: event.eventType });
      }
    }
    if (known.length === 0) {
      known.push({ text: '病程中已确认的事实尚未记录（已录入但尚未确认的信息会在“仍缺哪些信息”中标出）。', source: null });
    }

    // 解释：基于证据库片段生成，每条带来源
    for (const chunk of evidence) {
      explanations.push({ text: chunk.content, source: chunk.docId });
    }
    if (explanations.length === 0) {
      unknown.push({ text: '证据库中暂无可引用的解释。', source: null });
    }

    // 未知：缺失即未知，不补写概率
    const hasSymptomLog = context.symptomLogs.length > 0;
    if (!hasSymptomLog) {
      unknown.push({ text: '症状对日常生活的影响尚未确认。', source: null });
    }
    // 有腿部症状但病因未确认时，显式标出（需医生查体判断，不补写概率）
    const hasLegSymptom = context.events.some(
      (e) => e.rawText && /麻木|腿|脚/.test(e.rawText),
    );
    if (hasLegSymptom) {
      unknown.push({
        text: '腿部症状是否与影像上的椎间盘突出相关，尚未确认，需要医生查体判断。',
        source: null,
      });
    }
    for (const event of context.events) {
      if (event.verifyStatus === '尚未确认' && event.rawText) {
        unknown.push({ text: `「${event.rawText}」尚未确认。`, source: null });
      }
    }

    // 下一步：只来自用户的医嘱与通用就医建议；不把证据库中的病名表述写入下一步，
    // 避免对尚未确诊的用户造成病名暗示（产品红线：不作诊断）
    for (const event of context.events) {
      if (event.eventType === '医嘱' && event.rawText) {
        nextSteps.push({ text: event.rawText, source: '医嘱' });
      }
    }
    nextSteps.push({ text: '如症状持续或加重，请前往正规医疗机构就诊。', source: null });

    return {
      已知: known.slice(0, 8),
      解释: explanations.slice(0, 8),
      未知: unknown.slice(0, 8),
      下一步: nextSteps.slice(0, 8),
      视频: [],
    };
  }

  /** 引用核对：陈述必须在证据片段中找到关键词支持，否则剔除 */
  verifyCitations(statements: string[], evidence: EvidenceChunk[]): CitationCheckResult {
    const supported: Array<{ statement: string; evidenceDocId: string }> = [];
    const unsupported: string[] = [];
    for (const statement of statements) {
      const hit = evidence.find((chunk) => this.isSupported(statement, chunk.content));
      if (hit) {
        supported.push({ statement, evidenceDocId: hit.docId });
      } else {
        unsupported.push(statement);
      }
    }
    return { supported, unsupported };
  }

  private isSupported(statement: string, evidenceContent: string): boolean {
    // 取陈述中的实词（长度 ≥ 2 的连续中文/英文片段）与证据做包含匹配
    const tokens = statement.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z0-9/]{2,}/g) ?? [];
    if (tokens.length === 0) return false;
    const keyTokens = tokens.filter((t) => t.length >= 2);
    return keyTokens.some((t) => evidenceContent.includes(t));
  }
}
