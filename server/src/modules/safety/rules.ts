/** 红旗规则集与服务范围规则（带规则集版本号） */
export const RULESET_VERSION = 'RF-v3';

export interface RuleDef {
  code: string;
  name: string;
  keywords: string[];
  severity: '高' | '中' | '低';
  action: '提示就医' | '停止个性化分析';
  category: 'red-flag' | 'out-of-scope';
  message: string;
}

export const RULES: RuleDef[] = [
  {
    code: 'RF-01',
    name: '大小便功能障碍或鞍区麻木',
    keywords: [
      '大小便', '马尾', '鞍区', '会阴', '失禁', '排便困难', '排尿困难', '小便解不出',
      '小便不出来', '尿不出来', '尿不出', '憋不住尿', '大便控制不住', '大小便控制',
      '大小便功能', '大便失禁', '小便失禁', '屁股周围发麻', '屁股发麻', '会阴发麻', '会阴麻木',
      '解不出小便', '解不出尿', '小便解不出', '尿不出', '尿不出来', '憋不住尿', '大便控制不住',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '出现大小便功能异常或鞍区麻木，请及时就医。',
  },
  {
    code: 'RF-02',
    name: '进行性肌力下降',
    keywords: [
      '肌力下降', '脚尖无力', '足下垂', '走路无力', '进行性无力', '腿越来越没劲',
      '腿越来越没力气', '腿越来越无力', '越来越没力气', '双腿无力', '腿部无力',
      '腿软', '站不住', '脚抬不起来', '抬不起脚', '腿软得站不住',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '出现进行性肌力下降，请及时就医。',
  },
  {
    code: 'RF-03',
    name: '夜间痛醒伴体重下降',
    keywords: ['夜间痛醒', '夜里痛醒', '晚上痛醒', '疼醒', '体重下降', '消瘦', '夜间痛'],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '夜间痛醒伴体重下降，请及时就医检查。',
  },
  {
    code: 'RF-04',
    name: '外伤后腰部剧痛',
    keywords: ['外伤', '摔伤', '车祸', '扭伤后剧痛', '砸伤', '摔了一跤', '摔跤', '摔伤', '跌倒'],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '外伤后腰部剧痛，请及时就医排除骨折等严重情况。',
  },
  {
    code: 'RF-05',
    name: '发热伴腰痛',
    keywords: ['发热', '发烧', '高热', '发冷', '发烧了', '发高烧', '体温38', '体温37', '高烧'],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '发热伴腰痛，可能存在感染，请及时就医。',
  },
  {
    code: 'RF-06',
    name: '疼痛剧烈难以忍受',
    keywords: ['疼痛难忍', '剧烈疼痛', '疼得受不了', '无法入睡', '痛得受不了', '痛得厉害'],
    severity: '中',
    action: '提示就医',
    category: 'red-flag',
    message: '疼痛剧烈难以忍受，建议尽快就医评估。',
  },
  {
    code: 'SC-01',
    name: '诊断类越界请求',
    keywords: [
      '是不是腰椎间盘突出', '是不是癌', '是不是肿瘤', '是什么病', '确诊了吗',
      '帮我判断是不是', '是不是得了',
    ],
    severity: '中',
    action: '停止个性化分析',
    category: 'out-of-scope',
    message: '我们不能作诊断，是否患病需要医生面诊判断，可把这个问题带给医生。',
  },
  {
    code: 'SC-02',
    name: '手术建议越界请求',
    keywords: ['要不要手术', '需要手术吗', '手术建议', '该不该手术', '要不要做手术'],
    severity: '中',
    action: '停止个性化分析',
    category: 'out-of-scope',
    message: '是否手术需要专科医生结合症状、查体与影像综合判断，我们不能给出手术建议。',
  },
  {
    code: 'SC-03',
    name: '用药建议越界请求',
    keywords: ['吃什么药', '用什么药', '用药建议', '开点什么药', '贴什么膏药', '吃点什么药'],
    severity: '中',
    action: '停止个性化分析',
    category: 'out-of-scope',
    message: '我们不能给出用药建议，请把用药问题带给医生或药师。',
  },
];

export interface RuleHit {
  code: string;
  name: string;
  severity: '高' | '中' | '低';
  action: '提示就医' | '停止个性化分析';
  message: string;
}

/** 归一化文本：去除空白字符，避免“大 小 便 失 禁”这类带空格变体绕过规则 */
function normalize(text: string): string {
  return String(text).replace(/\s+/g, '');
}

/** 否定词：含这些词的从句视为“没有出现该症状”，不触发红旗（只匹配明确否定，避免“没劲”“无力”被误判） */
const NEGATION_PATTERN = /没有|正常|否认/;

/** 把文本按标点切分为从句，过滤掉含否定词的从句 */
function effectiveClauses(text: string): string[] {
  return String(text)
    .split(/[，。；、,.;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !NEGATION_PATTERN.test(s));
}

/** 纯函数：在文本中匹配红旗规则（跳过否定句） */
export function matchRedFlags(text: string): RuleHit[] {
  const hits: RuleHit[] = [];
  const clauses = effectiveClauses(text);
  for (const rule of RULES.filter((r) => r.category === 'red-flag')) {
    for (const clause of clauses) {
      const normalized = normalize(clause);
      if (rule.keywords.some((k) => normalized.includes(normalize(k)))) {
        hits.push({
          code: rule.code,
          name: rule.name,
          severity: rule.severity,
          action: rule.action,
          message: rule.message,
        });
        break;
      }
    }
  }
  return hits;
}

/** 纯函数：在文本中匹配越界请求（诊断 / 手术 / 用药） */
export function matchOutOfScope(text: string): RuleHit[] {
  const normalized = normalize(text);
  const hits: RuleHit[] = [];
  for (const rule of RULES.filter((r) => r.category === 'out-of-scope')) {
    if (rule.keywords.some((k) => normalized.includes(normalize(k)))) {
      hits.push({
        code: rule.code,
        name: rule.name,
        severity: rule.severity,
        action: rule.action,
        message: rule.message,
      });
    }
  }
  return hits;
}
