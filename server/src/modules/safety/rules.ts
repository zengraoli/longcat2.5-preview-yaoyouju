/** 红旗规则集与服务范围规则（带规则集版本号） */
export const RULESET_VERSION = 'RF-v4';

export interface RuleDef {
  code: string;
  name: string;
  keywords: string[];
  severity: '高' | '中' | '低';
  action: '提示就医' | '停止个性化分析';
  category: 'red-flag' | 'out-of-scope';
  message: string;
  /** 例外：命中关键词但属于“非该症状”的语境时跳过（如“孩子发烧了”“为了健康瘦了 2 斤”） */
  skip?: (clause: string) => boolean;
}

/* ---------------- 例外语境（关键词命中但不应判红旗） ---------------- */

/** 全身疲劳/劳累语境，且无下肢局部线索 → 不是进行性肌力下降 */
const FATIGUE_CONTEXT = /(加班|熬夜|劳累|疲劳|疲乏|没休息|睡眠不足|压力大|很累|好累|疲惫)/;
const LOCAL_WEAKNESS = /(腿|脚|下肢|走|站|抬|肌力|绊|软|拖|趿|跌)/;

/** 主动减重语境 → 不是病理性消瘦 */
const INTENTIONAL_WEIGHT_LOSS = /(为了健康|减肥|节食|刻意|故意|主动|健身|运动|锻炼)/;

/** 非腰部局部外伤（且无腰部语境）→ 不是“外伤后腰部剧痛” */
const NON_WAIST_BODY_PART = /(手指|脚趾|手背|手臂|胳膊|头|额头|膝盖|肩膀|肩|肘|腕|指甲|脚踝|小腿)/;
const WAIST_CONTEXT = /(腰|背|脊柱|臀|髋|尾椎|骶|尾骨)/;

/** 他人体温（且无本人发热语境）→ 不是“发热伴腰痛” */
const OTHER_PERSON = /(孩子|宝宝|小孩|儿童|家人|朋友|同事|邻居|他|她|老人|父亲|母亲|爷爷|奶奶|外公|外婆|老公|老婆|妻子|丈夫)/;
const SELF_CONTEXT = /(我|自己|本人|我家|我和|我昨天|我今天|我近|我这两|我这段)/;

export const RULES: RuleDef[] = [
  {
    code: 'RF-01',
    name: '大小便功能障碍或鞍区麻木',
    keywords: [
      '大小便', '马尾', '鞍区', '会阴', '失禁', '排便困难', '排尿困难', '小便解不出',
      '小便不出来', '尿不出来', '尿不出', '排不出来', '排不出尿', '排尿费劲', '尿费力',
      '才尿得出', '尿尿很费劲', '用力才尿', '憋不住尿', '憋不住', '大便控制不住',
      '大小便控制不住', '大小便控制不了', '大小便控制不住',
      '大小便功能', '大便失禁', '小便失禁', '拉在裤子里', '拉在裤上', '拉裤子',
      '大便拉在', '上厕所没感觉', '没有尿意', '没有便意', '肛门周围麻', '肛门麻',
      '肛周麻', '肛周发麻', '肛周麻木', '会阴发麻', '会阴麻木', '下体麻木', '下体麻', '屁股周围发麻', '屁股发麻',
      '解不出小便', '解不出尿', '小便排不出来', '尿排不出来',
      // 补充：控制不了/漏尿/尿潴留/鞍区感觉异常等常见表述
      '控制不了大小便', '管不住大小便', '憋不住大小便', '控制不住大便', '控制不住小便',
      '控制不了大便', '控制不了小便', '大便失控', '小便失控', '大小便失控',
      '小便控制不住', '控制不住小便',
      '没办法控制小便', '无法控制小便', '无法控制大便', '控制不了',
      '尿裤子', '尿湿裤', '大小便不正常', '大小便异常', '排尿不正常', '排便不正常',
      '排尿异常', '排便异常', '大小便不太正常', '大小便有问题',
      '解小便困难', '解小便很困难', '解小便费劲', '解小便', '不能排尿', '无法排尿',
      '尿不干净', '小便不干净', '尿不尽', '尿潴留', '排尿无力', '尿无力', '尿滴沥',
      '撒尿没劲', '滴滴答答', '尿线细', '尿流变细', '一咳嗽就漏', '咳嗽漏尿',
      '打喷嚏漏尿', '漏尿', '解大便没知觉', '解大便没有感觉', '解大便没感觉',
      '大便没知觉', '大便没有感觉', '肛门没感觉', '肛门没有感觉', '肛门没知觉',
      '肛门无感觉', '裆部发麻', '裆部麻木', '裆部麻', '裆部感觉',
      '两腿之间麻木', '两腿之间发麻', '两腿之间麻', '腿之间麻', '腿之间发麻',
      '屁股麻', '屁股没知觉', '屁股没有感觉', '屁股没感觉', '臀部麻木', '臀麻',
      '没知觉', '没有知觉', '麻了没知觉', '麻了没有知觉',
      '会阴部麻木', '会阴部发麻', '会阴部麻', '马鞍区', '鞍区麻木', '鞍区发麻',
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
      // 补充：腿软/绊倒/蹲起困难/踮脚无力等表述
      '腿越来越软', '腿发软', '双腿发软', '腿打软', '打软腿', '站不稳', '绊倒',
      '走路绊', '脚使不上劲', '使不上劲', '脚用不上力', '用不上劲', '脚没劲',
      '踮不起脚尖', '踮不起脚', '脚尖踮不起', '踮不起', '脚尖无力',
      '腿抬不起来', '腿抬不动', '抬不起腿', '腿抬不起', '抬腿困难', '腿使不上劲',
      '蹲下站不起来', '蹲下起不来', '蹲下站不起', '蹲下后站不起', '蹲下无法站起',
      '上楼梯腿抬不动', '上楼梯困难', '上楼腿抬不动', '脚尖使不上劲',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '出现进行性肌力下降，请及时就医。',
    skip: (clause) => FATIGUE_CONTEXT.test(clause) && !LOCAL_WEAKNESS.test(clause),
  },
  {
    code: 'RF-03',
    name: '夜间痛醒伴体重下降',
    keywords: [
      '夜间痛醒', '夜里痛醒', '晚上痛醒', '疼醒', '痛醒', '体重下降', '消瘦', '夜间痛',
      '半夜痛醒', '半夜疼醒', '睡觉会痛醒', '会痛醒', '夜里疼醒', '晚上睡觉会痛醒',
      '瘦了', '体重减轻', '瘦了10斤', '最近瘦了',
      // 补充：夜里疼得睡不着/体重掉了 N 斤等表述
      '疼得睡不着', '痛得睡不着', '夜里疼得', '夜里痛得', '疼得睡不好', '痛得睡不好',
      '疼得无法入睡', '痛得无法入睡', '夜里疼', '夜里痛', '晚上疼得', '晚上痛得',
      '掉了15斤', '掉了10斤', '掉了8斤', '掉了5斤', '掉了20斤', '体重掉了',
      '体重降了', '体重轻了', '瘦了15斤', '瘦了10斤', '瘦了8斤', '瘦了5斤',
      '瘦了20斤', '瘦了好多', '瘦了很多', '明显消瘦', '越来越瘦', '人瘦了',
      're:掉了\\d+斤', 're:瘦了\\d+斤', 're:体重掉了\\d+斤',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '夜间痛醒伴体重下降，请及时就医检查。',
    skip: (clause) => INTENTIONAL_WEIGHT_LOSS.test(clause),
  },
  {
    code: 'RF-04',
    name: '外伤后腰部剧痛',
    keywords: [
      '外伤', '摔伤', '车祸', '扭伤后剧痛', '砸伤', '摔了一跤', '摔跤', '摔伤', '跌倒',
      '摔下来', '滚下来', '从楼梯', '楼梯上摔', '被车撞', '车撞了', '撞到', '被撞',
      // 补充：摔倒/跌落/滑倒/屁股着地/撞车等表述
      '摔倒', '摔了', '跌下来', '跌落', '掉下来', '从梯子', '从高处', '高处跌',
      '滑倒', '屁股着地', '臀部着地', '腰部着地', '撞车', '出了车祸', '被撞伤',
      '砸伤', '压伤', '坠落', '坠楼', '从车上摔', '从凳子', '从椅子', '从床上摔',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '外伤后腰部剧痛，请及时就医排除骨折等严重情况。',
    skip: (clause) => NON_WAIST_BODY_PART.test(clause) && !WAIST_CONTEXT.test(clause),
  },
  {
    code: 'RF-05',
    name: '发热伴腰痛',
    keywords: [
      '发热', '发烧', '高热', '发冷', '发高烧', '体温38', '体温39', '39度', '39℃',
      '烧到39', '高烧', '发烧了',
      // 补充：低烧/寒战/发烫/具体体温等表述
      '低烧', '持续低烧', '一直低烧', '低热', '发抖', '怕冷', '打寒战', '寒战',
      '浑身发冷', '身上很烫', '浑身发烫', '全身发烫', '发烫', '体温37',
      '37.9℃', '37.9度', '37.8℃', '37.8度', '37.7℃', '37.7度',
      '37.6℃', '37.6度', '37.5℃', '37.5度', '37.4℃', '37.4度',
      '37.3℃', '37.3度', '37.9', '37.8', '37.7', '37.6', '37.5', '37.4', '37.3',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '发热伴腰痛，可能存在感染，请及时就医。',
    skip: (clause) => OTHER_PERSON.test(clause) && !SELF_CONTEXT.test(clause),
  },
  {
    code: 'RF-06',
    name: '疼痛剧烈难以忍受',
    keywords: [
      '疼痛难忍', '剧烈疼痛', '疼得受不了', '无法入睡', '痛得受不了', '痛得厉害',
      // 补充：痛得打滚/止痛药压不住等表述
      '痛得打滚', '疼得打滚', '打滚', '止痛药压不住', '止痛药止不住', '止痛药不管用',
      '止痛药没用', '止痛药没效果', '吃止痛药也不管', '止痛药压不住痛', '疼得整夜',
      '痛得整夜', '疼得撞墙', '痛得撞墙', '疼得冒冷汗', '痛得冒冷汗',
    ],
    severity: '中',
    action: '提示就医',
    category: 'red-flag',
    message: '疼痛剧烈难以忍受，建议尽快就医评估。',
  },
  {
    code: 'RF-07',
    name: '肿瘤病史',
    keywords: [
      '癌症', '肿瘤', '得过癌', '恶性肿瘤', '化疗', '放疗', '癌史', '患有癌',
      '转移', '占位', '癌',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '有肿瘤病史且出现新发腰痛，请及时就医排查。',
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
 * 单字否定词窗口 6 字（“不存在马尾”“没有大小便失禁”），多字否定词窗口 6 字（“排除了马尾”）。
 * 按“但 / 但是 / 不过 / 然而 / 可是”切分语段：否定词与关键词必须在同一语段内，
 * 避免“没有外伤但大小便失禁”被整句否定，也避免“大小便失禁没有好转”被误否定。
 */
const BEFORE_NEGATIONS_SHORT = ['不', '无', '未', '没'];
const BEFORE_NEGATIONS_LONG = ['没有', '未见', '不会', '排除', '否认', '不曾', '从未', '未触及', '无明'];
const AFTER_NEGATIONS = [
  '都还好', '还好', '没问题', '正常', '未见明显异常', '未见异常', '已排除', '都正常',
  '能自己控制', '可以自己控制', '控制良好', '控制正常', '控制没问题', '无异常',
  '无减退', '无受压', '未受压', '走行自然', '未见明显受压', '无明显受压', '未见明显',
  '无压痛', '无麻木', '无感觉异常', '未见异常改变', '未见明显异常改变',
  '没有异常', '未见受压', '恢复良好', '已恢复', '恢复好', '已痊愈', '痊愈', '已好转',
];

/** 把从句按转折词切成语段（“但”前后的否定不互通） */
function segmentsOf(clause: string): string[] {
  return clause.split(/(?:但|但是|不过|然而|可是)/).map((s) => s.trim()).filter((s) => s.length > 0);
}

/** 判断关键词匹配处是否被局部否定（否定词与关键词须同处一个语段） */
function isNegated(segment: string, keyword: string, fromIndex: number): boolean {
  const idx = segment.indexOf(keyword, fromIndex);
  if (idx < 0) return false;
  const before6 = segment.slice(Math.max(0, idx - 6), idx);
  const after = segment.slice(idx + keyword.length, idx + keyword.length + 12);
  // 前 6 个字符内出现单字否定（如“不发烧”“无发热”“不存在马尾”）
  if (BEFORE_NEGATIONS_SHORT.some((n) => before6.includes(n))) return true;
  // 前 6 个字符内出现多字否定（如“未见马尾”“排除了马尾”“没有发烧”）
  if (BEFORE_NEGATIONS_LONG.some((n) => before6.includes(n))) return true;
  // 后 12 个字符内出现否定（如“大小便都还好”“马尾神经未见明显异常”“大小便能自己控制”）
  if (AFTER_NEGATIONS.some((n) => after.includes(n))) return true;
  return false;
}

/** 在单个从句中匹配关键词（跳过被局部否定的匹配；支持 re: 前缀正则关键词） */
function matchInClause(clause: string, keywords: string[]): boolean {
  const normalized = normalize(clause);
  // 按转折词切语段：否定词与关键词必须在同一语段内才生效
  const segments = segmentsOf(normalized);
  for (const keyword of keywords) {
    if (keyword.startsWith('re:')) {
      // 正则关键词：在归一化文本上整体匹配（如“掉了 15 斤”的任意斤数变体）
      try {
        if (new RegExp(keyword.slice(3), 'u').test(normalized)) return true;
      } catch {
        // 非法正则按普通字符串处理
        if (normalized.includes(keyword.slice(3))) return true;
      }
      continue;
    }
    const nk = normalize(keyword);
    for (const seg of segments) {
      let from = 0;
      while (from <= seg.length - nk.length) {
        const idx = seg.indexOf(nk, from);
        if (idx < 0) break;
        if (!isNegated(seg, nk, idx)) return true;
        from = idx + nk.length;
      }
    }
  }
  return false;
}

/** 纯函数：在文本中匹配红旗规则（跳过局部否定与例外语境） */
export function matchRedFlags(text: string): RuleHit[] {
  const hits: RuleHit[] = [];
  const clauses = String(text)
    .split(/[，。；、,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const rule of RULES.filter((r) => r.category === 'red-flag')) {
    for (const clause of clauses) {
      if (rule.skip?.(clause)) continue;
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
