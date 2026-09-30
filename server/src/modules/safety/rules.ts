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
      '小便不出来', '尿不出来', '尿不出', '排不出来', '排不出尿', '排尿费劲', '尿费力',
      '才尿得出', '尿尿很费劲', '用力才尿', '憋不住尿', '大便控制不住', '大小便控制',
      '大小便功能', '大便失禁', '小便失禁', '拉在裤子里', '拉在裤上', '拉裤子',
      '大便拉在', '上厕所没感觉', '没有尿意', '没有便意', '肛门周围麻', '肛门麻',
      '肛周麻', '会阴发麻', '会阴麻木', '下体麻木', '下体麻', '屁股周围发麻', '屁股发麻',
      '解不出小便', '解不出尿', '小便排不出来', '尿排不出来',
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
      '腿软', '站不住', '脚抬不起来', '抬不起脚', '腿软得站不住', '没有力气',
      '腿没劲', '双腿没劲', '两条腿都没劲', '两条腿没劲', '腿都没劲', '脚拖地',
      '走路脚拖', '拖着脚走', '脚背翘不起来', '脚背翘不起', '翘不起来', '翘不起',
      '脚背抬不起来', '走路脚拖地',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '出现进行性肌力下降，请及时就医。',
  },
  {
    code: 'RF-03',
    name: '夜间痛醒伴体重下降',
    keywords: [
      '夜间痛醒', '夜里痛醒', '晚上痛醒', '疼醒', '痛醒', '体重下降', '消瘦', '夜间痛',
      '半夜痛醒', '半夜疼醒', '睡觉会痛醒', '会痛醒', '夜里疼醒', '晚上睡觉会痛醒',
      '瘦了', '体重减轻', '瘦了10斤', '最近瘦了',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '夜间痛醒伴体重下降，请及时就医检查。',
  },
  {
    code: 'RF-04',
    name: '外伤后腰部剧痛',
    keywords: [
      '外伤', '摔伤', '车祸', '扭伤后剧痛', '砸伤', '摔了一跤', '摔跤', '摔伤', '跌倒',
      '摔下来', '滚下来', '从楼梯', '楼梯上摔', '被车撞', '车撞了', '撞到', '被撞',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '外伤后腰部剧痛，请及时就医排除骨折等严重情况。',
  },
  {
    code: 'RF-05',
    name: '发热伴腰痛',
    keywords: [
      '发热', '发烧', '高热', '发冷', '发高烧', '体温38', '体温39', '39度', '39℃',
      '烧到39', '高烧', '发烧了',
    ],
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

/**
 * 否定词（紧邻关键词时视为“没有出现该症状”）。
 * 只匹配关键词前后紧邻的明确否定，避免“没有外伤但大小便失禁”被整句否定，
 * 也避免“大小便失禁没有好转”被误否定。
 * 单字否定词窗口 2 字（“不发烧”），多字否定词窗口 4 字（“排除了马尾”）。
 */
const BEFORE_NEGATIONS_SHORT = ['不', '无', '未', '没'];
const BEFORE_NEGATIONS_LONG = ['没有', '未见', '不会', '排除', '否认', '不曾', '从未'];
const AFTER_NEGATIONS = ['都还好', '还好', '没问题', '正常', '未见明显异常', '未见异常', '已排除', '都正常'];

/** 判断关键词匹配处是否被局部否定 */
function isNegated(clause: string, keyword: string, fromIndex: number): boolean {
  const idx = clause.indexOf(keyword, fromIndex);
  if (idx < 0) return false;
  const before2 = clause.slice(Math.max(0, idx - 2), idx);
  const before4 = clause.slice(Math.max(0, idx - 4), idx);
  const after = clause.slice(idx + keyword.length, idx + keyword.length + 8);
  // 前 2 个字符内出现单字否定（如“不发烧”“无发热”）
  if (BEFORE_NEGATIONS_SHORT.some((n) => before2.includes(n))) return true;
  // 前 4 个字符内出现多字否定（如“未见马尾”“排除了马尾”“没有发烧”）
  if (BEFORE_NEGATIONS_LONG.some((n) => before4.includes(n))) return true;
  // 后 6 个字符内出现否定（如“大小便都还好”“大小便没问题”“马尾神经未见明显异常”）
  if (AFTER_NEGATIONS.some((n) => after.includes(n))) return true;
  return false;
}

/** 在单个从句中匹配关键词（跳过被局部否定的匹配） */
function matchInClause(clause: string, keywords: string[]): boolean {
  const normalized = normalize(clause);
  for (const keyword of keywords) {
    const nk = normalize(keyword);
    let from = 0;
    while (from <= normalized.length - nk.length) {
      const idx = normalized.indexOf(nk, from);
      if (idx < 0) break;
      if (!isNegated(normalized, nk, idx)) return true;
      from = idx + nk.length;
    }
  }
  return false;
}

/** 纯函数：在文本中匹配红旗规则（跳过局部否定） */
export function matchRedFlags(text: string): RuleHit[] {
  const hits: RuleHit[] = [];
  const clauses = String(text).split(/[，。；、,.;\n]/).map((s) => s.trim()).filter((s) => s.length > 0);
  for (const rule of RULES.filter((r) => r.category === 'red-flag')) {
    for (const clause of clauses) {
      if (matchInClause(clause, rule.keywords)) {
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
