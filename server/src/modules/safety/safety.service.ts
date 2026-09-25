import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

export interface SafetyCheckResult {
  passed: boolean;
  action: 'none' | '提示就医' | '停止个性化分析';
  ruleCode?: string;
  message?: string;
}

@Injectable()
export class SafetyService {
  private readonly RULE_SET_VERSION = 'RF-v1.0';

  private readonly RED_FLAG_RULES: { code: string; keywords: string[] }[] = [
    { code: 'RF-01', keywords: ['马尾综合征', '大小便失禁', '鞍区麻木'] },
    { code: 'RF-02', keywords: ['下肢无力', '足下垂', '进行性肌力下降'] },
    { code: 'RF-03', keywords: ['发热', '感染', '高热不退'] },
    { code: 'RF-04', keywords: ['外伤', '跌倒', '车祸'] },
    { code: 'RF-05', keywords: ['夜间痛醒', '体重下降', '癌症病史'] },
    { code: 'RF-06', keywords: ['胸痛', '呼吸困难', '下肢肿胀'] },
  ];

  private readonly OUT_OF_SCOPE_KEYWORDS = ['诊断', '手术', '用药', '开药', '处方', '吃什么药', '要不要手术'];

  checkRedFlags(text: string): SafetyCheckResult {
    for (const rule of this.RED_FLAG_RULES) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          return {
            passed: false,
            action: '提示就医',
            ruleCode: rule.code,
            message: `检测到可能与"${keyword}"相关的症状，建议尽快就医`,
          };
        }
      }
    }
    return { passed: true, action: 'none' };
  }

  checkScope(text: string): SafetyCheckResult {
    for (const keyword of this.OUT_OF_SCOPE_KEYWORDS) {
      if (text.includes(keyword)) {
        return {
          passed: false,
          action: '停止个性化分析',
          ruleCode: 'SCOPE-01',
          message: '该问题涉及诊断、手术或用药建议，超出服务范围，建议咨询医生',
        };
      }
    }
    return { passed: true, action: 'none' };
  }

  fullCheck(text: string): SafetyCheckResult {
    const redFlagResult = this.checkRedFlags(text);
    if (!redFlagResult.passed) return redFlagResult;
    return this.checkScope(text);
  }

  recordSafetyEvent(userId: string, ruleCode: string, severity: string, actionTaken: string, source: string): void {
    const db = getDb();
    db.prepare('INSERT INTO safety_event (id, user_id, rule_code, severity, action_taken, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), userId, ruleCode, severity, actionTaken, new Date().toISOString(),
    );
  }

  getRuleSetVersion(): string {
    return this.RULE_SET_VERSION;
  }
}
