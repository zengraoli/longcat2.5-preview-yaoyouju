/** 红旗规则表（与 server 端 RULES 一致，用于后台展示） */

export interface RuleInfo {
  code: string;
  name: string;
  severity: '高' | '中' | '低';
  action: '提示就医' | '停止个性化分析';
  category: 'red-flag' | 'out-of-scope';
}

export const RULES: RuleInfo[] = [
  { code: 'RF-01', name: '大小便功能障碍或鞍区麻木', severity: '高', action: '提示就医', category: 'red-flag' },
  { code: 'RF-02', name: '进行性肌力下降', severity: '高', action: '提示就医', category: 'red-flag' },
  { code: 'RF-03', name: '夜间痛醒伴体重下降', severity: '高', action: '提示就医', category: 'red-flag' },
  { code: 'RF-04', name: '外伤后腰部剧痛', severity: '高', action: '提示就医', category: 'red-flag' },
  { code: 'RF-05', name: '发热伴腰痛', severity: '高', action: '提示就医', category: 'red-flag' },
  { code: 'RF-06', name: '疼痛剧烈难以忍受', severity: '中', action: '提示就医', category: 'red-flag' },
  { code: 'SC-01', name: '诊断类越界请求', severity: '中', action: '停止个性化分析', category: 'out-of-scope' },
  { code: 'SC-02', name: '手术建议越界请求', severity: '中', action: '停止个性化分析', category: 'out-of-scope' },
  { code: 'SC-03', name: '用药建议越界请求', severity: '中', action: '停止个性化分析', category: 'out-of-scope' },
];

export const RULESET_VERSION = 'RF-v3';
