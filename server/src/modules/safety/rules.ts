/** 红旗规则集与服务范围规则（带规则集版本号） */
export const RULESET_VERSION = 'RF-v5';

export interface RuleDef {
  code: string;
  name: string;
  keywords: string[];
  /** 正则关键词：在归一化文本上匹配，匹配片段内部再做一次否定判断 */
  regexes?: RegExp[];
  severity: '高' | '中' | '低';
  action: '提示就医' | '停止个性化分析';
  category: 'red-flag' | 'out-of-scope';
  message: string;
  /** 例外：命中关键词但属于“非该症状”的语境时跳过（如“孩子发烧了”“为了健康瘦了 2 斤”） */
  skip?: (clause: string) => boolean;
}

/* ---------------- 例外语境（关键词命中但不应判红旗） ---------------- */

/** 全身疲劳/劳累语境，且无下肢局部线索 → 不是进行性肌力下降 */
const FATIGUE_CONTEXT = /(加班|熬夜|劳累|疲劳|疲乏|没休息|睡眠不足|压力大|很累|好累|疲惫|忙了一天|工作累|没睡好)/;
const LOCAL_WEAKNESS = /(腿|脚|下肢|走|站|抬|肌力|绊|软|拖|趿|跌|蹲|脚尖|脚背|麻)/;

/** 主动减重语境 → 不是病理性消瘦；但“没减肥/未减肥”说明并非主动 */
const INTENTIONAL_WEIGHT_LOSS = /(为了健康|减肥|节食|刻意|故意|主动|健身|运动|锻炼|控制饮食|减脂|瘦身)/;
const NOT_INTENTIONAL = /(没|没有|未|不曾|从未|不是|并非)[^，。；]{0,4}(?:减肥|节食|减脂|瘦身)/;

/** 非腰部局部外伤（且无腰部语境）→ 不是“外伤后腰部剧痛” */
const NON_WAIST_BODY_PART = /(手指|脚趾|手背|手臂|胳膊|头|额头|膝盖|肩膀|肩|肘|腕|指甲|脚踝|小腿|眼睛|牙齿|耳朵|脖子)/;
/** 非身体的物件摔落/损坏 → 不是外伤 */
const OBJECT_DAMAGE = /(手机|屏幕|电脑|笔记本|水龙头|杯子|碗|盘子|电视|门|窗|花瓶|眼镜|键盘|杯子)/;
const WAIST_CONTEXT = /(腰|背|脊柱|臀|髋|尾椎|骶|尾骨)/;

/** 他人语境（且无本人发热语境）→ 不是“本人发热” */
const OTHER_PERSON = /(孩子|宝宝|小孩|儿童|家人|朋友|同事|邻居|他|她|老人|父亲|母亲|爸爸|妈妈|爷爷|奶奶|外公|外婆|老公|老婆|妻子|丈夫|女儿|儿子|哥哥|姐姐|弟弟|妹妹)/;
/** 本人在发烧的语境 */
const SELF_FEVER = /(我|自己|本人)(?:也|还|同时|最近|昨天|今天|这|近|一量|测|量|发|烧|热|现在)/;

/** 他人做肿瘤治疗（化疗/放疗）→ 不是本人肿瘤病史 */
const OTHER_TUMOR = /(孩子|宝宝|家人|家里人|朋友|同事|邻居|父亲|母亲|爸爸|妈妈|爷爷|奶奶|外公|外婆|老公|老婆|妻子|丈夫|女儿|儿子|哥哥|姐姐|弟弟|妹妹|老人)[^，。；]{0,8}(化疗|放疗|癌|肿瘤|ca)/;

export const RULES: RuleDef[] = [
  {
    code: 'RF-01',
    name: '大小便功能障碍或鞍区麻木',
    keywords: [
      // 失禁 / 控制不住
      '大小便失禁', '大便失禁', '小便失禁', '失禁', '失紧',
      '大小便控制不了', '大小便控制不住', '大小便失控',
      '控制不了大小便', '控制不住大小便', '管不住大小便', '憋不住大小便',
      '控制不了小便', '控制不住小便', '管不住小便', '憋不住小便', '小便控制不住', '小便控制不了',
      '控制不了大便', '控制不住大便', '管不住大便', '憋不住大便', '大便控制不住', '大便控制不了',
      '大小便功能', '大小便功能异常', '大小便异常', '大小便不正常', '大小便不太正常', '大小便有问题',
      '排尿异常', '排便异常', '排尿不正常', '排便不正常', '大小便不正常',
      '憋不住尿', '憋不住屎', '小便憋不住', '大便憋不住', '尿裤子', '尿了一裤子', '尿了一身', '尿湿裤', '尿湿床单', '尿湿床',
      '尿床', '漏尿', '漏屎', '拉裤子', '拉在裤', '拉在床', '大便拉在', '屎拉在', '兜不住',
      '大便兜不住', '大小便兜不住', '不知不觉尿', '尿在裤子里', '尿在裤', '尿湿', '收不住',
      // 排尿 / 排便困难
      '尿不出', '尿不出来', '尿不出来', '排不出尿', '排不了小便', '排不了尿', '小便排不出',
      '解不出小便', '解不出尿', '排尿困难', '排尿不顺畅', '排尿不畅', '排尿费劲', '排尿费力',
      '尿潴留', '尿不尽', '尿不干净', '尿滴沥', '排尿无力', '尿无力', '撒尿没劲', '撒尿无力',
      '一咳嗽就漏', '咳嗽漏尿', '打喷嚏漏尿',
      '大便失控', '小便失控', '没办法控制小便', '没办法控制大便', '无法控制小便', '无法控制大便',
      '不能排尿', '无法排尿', '无法小便', '小便困难',
      '大便困难', '排便困难', '排不出大便', '拉不出屎', '拉不出大便', '便秘',
      // 感觉丧失
      '没有尿意', '感觉不到尿意', '尿意消失', '没有便意', '感觉不到便意', '便意消失',
      '拉屎没感觉', '拉屎没知觉', '拉屎都没感觉', '拉屎都没知觉', '拉屎都没',
      '大便没感觉', '大便没知觉', '解大便没感觉', '解大便没知觉',
      '擦屁股感觉不到', '擦屁股没感觉', '擦屁股没知觉', '感觉不到自己有没有排',
      '尿了一床', '没尿干净',
    ],
    regexes: [
      // 会阴 / 肛门 / 鞍区 / 臀 / 裆 / 大腿内侧 + 麻木或感觉异常
      /(?:会阴|肛门|肛周|屁眼|鞍区|马鞍区|裆部|下体|下面|下身|阴部|屁股|臀部|大腿内侧|两腿之间)[^，。；]{0,10}(?:麻|木木|木的|发木|发麻|没感觉|没知觉|感觉不到|感觉减退|感觉异常|感觉消失)/,
      /(?:麻|木木|木的|发木|发麻|没感觉|没知觉|感觉不到|感觉减退|感觉异常)[^，。；]{0,6}(?:会阴|肛门|肛周|屁眼|鞍区|马鞍区|裆部|下体|下面|下身|阴部|屁股|臀部|大腿内侧|两腿之间)/,
      /(?:会阴|肛门|肛周|屁眼|鞍区|马鞍区|裆部|下体|下面|下身|阴部|屁股|臀部)[^，。；]{0,6}(?:知觉|感觉)[^，。；]{0,3}(?:都没有|没有|全无)/,
      /(?:拉屎|大便|小便|尿|排便)[^，。；]{0,6}(?:一点)?(?:感觉|知觉)[^，。；]{0,3}(?:都没有|没有|全无)/,
      // 排尿等待很久 / 需要用力 / 收不住
      /(?:排尿|小便|尿尿|撒尿|排便|拉屎|大便)[^，。；]{0,6}(?:等很久|等好|要等|用力|使劲|半天|费劲|费事|困难|吃力|滴滴答答|收不住|没劲|无力)/,
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
      '肌力下降', '进行性无力', '足下垂',
      '踩棉花', '像踩棉花',
      '腿软', '腿就软', '腿发软', '双腿发软', '腿打软', '打软腿', '两腿发软',
      '腿没劲', '双腿没劲', '腿无力', '双腿无力', '腿部无力', '腿越来越没力', '腿越来越无力',
      '腿越来越软', '腿越来越没劲', '越来越没力气', '腿使不上劲', '使不上劲', '用不上力', '用不上劲',
      '腿抬不起来', '腿抬不动', '抬不起腿', '腿抬不起', '抬腿困难', '上楼梯腿抬不动', '上楼腿抬不动',
      '站不起来', '站不起', '蹲下去站不起来', '蹲下站不起来', '蹲下起不来', '蹲下站不起', '蹲下后站不起',
      '站不住', '站不稳', '走不动', '走不了', '走几步就', '走着走着',
      '脚尖提不起来', '脚尖抬不起', '脚尖踮不起', '踮不起脚尖', '踮不起脚', '脚尖使不上劲', '脚尖无力',
      '脚背翘不起', '脚背翘不起来', '脚背抬不起来', '脚抬不起来', '抬不起脚', '抬不起来', '抬不起',
      '勾不起来', '勾不起', '脚拖地', '拖着脚走', '走路脚拖',
      '脚使不上劲', '脚用不上力', '脚没劲', '脚没力', '脚无力', '使不上', '抬不动', '起不来',
      '腿一软', '绊倒', '走路绊', '绊一下', '绊了', '腿变细', '腿细了', '明显变细',
      '一天比一天细', '一天比一天瘦', '细了一圈', '腿麻的范围', '麻的范围一天比一天',
      '没有力气', '没力气', '使不上力', '无力',
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
      '夜间痛醒', '夜里痛醒', '晚上痛醒', '半夜痛醒', '半夜疼醒', '夜里疼醒', '睡觉会痛醒', '会痛醒',
      '疼醒', '痛醒', '半夜总是疼得爬起来', '疼得爬起来', '痛得爬起来', '疼得睡不着', '痛得睡不着',
      '疼得睡不好', '痛得睡不好', '疼得无法入睡', '痛得无法入睡', '无法入睡',
      '夜里疼', '夜里痛', '晚上疼得', '晚上痛得', '半夜疼', '半夜痛', '夜间痛', '夜间疼',
      '越到晚上越痛', '越到晚上越疼', '躺着也不减轻', '躺着不减轻', '休息也不减轻', '休息不减轻', '一点不减轻',
      '一点不缓解', '休息也不缓解', '躺不住',
      '体重下降', '体重减轻', '体重降了', '体重轻了', '体重掉了', '体重少了', '明显消瘦', '消瘦',
      '越来越瘦', '人瘦了', '瘦了好多', '瘦了很多', '瘦了', '最近瘦了', '没减肥', '没减肥体重',
      '一个月少了', '三个月掉了', '掉了',
    ],
    regexes: [
      /(?:掉|少|降|轻)了?[0-9一二三四五六七八九十两]+(?:斤|公斤|kg)/,
      /体重[^，。；]{0,6}(?:下降|减轻|掉了|少了|降了)/,
      /(?:裤腰|裤子|衣服)[^，。；]{0,6}(?:松|大)/,
      /(?:疼|痛)[^，。；]{0,6}(?:从床上)?(?:坐起来|爬起来)/,
      /(?:躺不住|越静越疼|躺不下)/,
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '夜间痛醒伴体重下降，请及时就医检查。',
    skip: (clause) => INTENTIONAL_WEIGHT_LOSS.test(clause) && !NOT_INTENTIONAL.test(clause),
  },
  {
    code: 'RF-04',
    name: '外伤后腰部剧痛',
    keywords: [
      '外伤', '摔伤', '摔了一跤', '摔跤', '摔倒', '跌倒', '滑了一跤', '滑倒', '跌伤', '跌落', '摔下来',
      '从楼梯', '楼梯上摔', '从梯子', '从高处', '高处跌', '从车上摔', '从凳子', '从椅子', '从床上摔',
      '屁股着地', '臀部着地', '腰部着地', '被车撞', '车撞了', '被撞', '撞倒', '撞伤', '撞车', '车祸',
      '出了车祸', '追尾', '砸伤', '砸到', '压伤', '坠落', '坠楼', '被撞倒', '踩空',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '外伤后腰部剧痛，请及时就医排除骨折等严重情况。',
    skip: (clause) =>
      (NON_WAIST_BODY_PART.test(clause) || OBJECT_DAMAGE.test(clause)) && !WAIST_CONTEXT.test(clause),
  },
  {
    code: 'RF-05',
    name: '发热伴腰痛',
    keywords: [
      '发烧', '发热', '高烧', '高热', '低烧', '低热', '发烧了', '发热了',
      '寒战', '打寒战', '打摆子', '发抖', '浑身发冷', '发冷', '身上很烫', '浑身发烫', '全身发烫', '一直在烧', '一直烧', '持续发烧', '持续发热',
      '三十七度五', '三十八度', '三十九度', '四十度', '三十八度多', '一量体温三十八',
      '体温38', '体温39', '体温40', '38度', '38.5', '38.6', '38.2', '38.9', '39度', '39.1', '40度',
    ],
    regexes: [
      // 38 度及以上（带度/℃或小数写法）；避免命中“40 分钟”这类数字
      /(?<![\d.])3[89](?:\.\d+)?(?:度|℃)/,
      /(?<![\d.])4[0-2](?:\.\d+)?(?:度|℃)/,
      /(?<![\d.])3[89]\.\d+(?![\d])/,
      /(?<![\d.])4[0-2]\.\d+(?![\d])/,
      // 37.3–37.9 属低热，37.0–37.2 不算
      /(?<![\d.])37\.[3-9]\d?(?![\d])/,
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '发热伴腰痛，可能存在感染，请及时就医。',
    skip: (clause) => {
      if (OTHER_PERSON.test(clause) && !SELF_FEVER.test(clause)) return true;
      if (/(正常|没事|医生说)/.test(clause)) return true;
      return false;
    },
  },
  {
    code: 'RF-06',
    name: '疼痛剧烈难以忍受',
    keywords: [
      '疼痛难忍', '剧烈疼痛', '疼得受不了', '痛得受不了', '痛得厉害', '疼得厉害',
      '疼得打滚', '痛得打滚', '疼得撞墙', '痛得撞墙', '疼得直哭', '痛得直哭', '疼得哭', '痛得哭',
      '疼得冒冷汗', '痛得冒冷汗', '痛到冒冷汗', '疼到冒冷汗', '冒冷汗',
      '止痛药压不住', '止痛药止不住', '止痛药不管用', '止痛药没用', '止痛药没效果', '止痛药没效',
      '吃止痛药也不管', '吃了布洛芬也没用', '布洛芬没用', '吃药也没用', '吃了药也没用',
      '疼得整夜', '痛得整夜', '湿透', '不顶用',
    ],
    regexes: [
      /止痛药[^，。；]{0,3}(?:压不住|止不住|不管用|没用|没效果|没效|无效|不顶用)/,
      /布洛芬[^，。；]{0,4}(?:不顶用|没用|不管用|无效)/,
      /(?:疼|痛)得[^，。；]{0,3}(?:打滚|撞墙|直哭|冒冷汗|受不了|翻来覆去|直哼哼|哼哼)/,
      /(?:疼|痛)[^，。；]{0,4}湿透/,
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
      '癌', '癌症', '癌史', '患有癌', '得过癌', '恶性肿瘤', '恶性', '肿瘤', '化疗', '放疗',
      '转移灶', '骨转移', 'ca术后', 'ca病史', 'ca化疗', '前列腺ca', '占位',
    ],
    severity: '高',
    action: '提示就医',
    category: 'red-flag',
    message: '有肿瘤病史且出现新发腰痛，请及时就医排查。',
    skip: (clause) => OTHER_TUMOR.test(clause),
  },
  {
    code: 'SC-01',
    name: '诊断类越界请求',
    keywords: [
      '是不是腰椎间盘突出', '是不是癌', '是不是肿瘤', '是什么病', '确诊了吗',
      '帮我判断是不是', '是不是得了', '我这是什么病', '什么病',
    ],
    severity: '中',
    action: '停止个性化分析',
    category: 'out-of-scope',
    message: '我们不能作诊断，是否患病需要医生面诊判断，可把这个问题带给医生。',
  },
  {
    code: 'SC-02',
    name: '手术建议越界请求',
    keywords: ['要不要手术', '需要手术吗', '手术建议', '该不该手术', '要不要做手术', '必须手术吗'],
    severity: '中',
    action: '停止个性化分析',
    category: 'out-of-scope',
    message: '是否手术需要专科医生结合症状、查体与影像综合判断，我们不能给出手术建议。',
  },
  {
    code: 'SC-03',
    name: '用药建议越界请求',
    keywords: ['吃什么药', '用什么药', '用药建议', '开点什么药', '贴什么膏药', '吃点什么药', '推荐什么药'],
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

/** 归一化文本：去除空白字符并小写拉丁字母，避免“大 小 便 失 禁”“CA”这类变体绕过规则 */
function normalize(text: string): string {
  return String(text).replace(/\s+/g, '').toLowerCase();
}

/**
 * 否定词（紧邻关键词时视为“没有出现该症状”）。
 * - 单字“不”只在紧邻 1 字内生效，避免把“不知不觉尿裤子”“动不动就尿裤子”“不小心摔倒”整句否定；
 * - “无 / 未”在紧邻 2 字内生效；
 * - 多字否定词（没有 / 未见 / 排除 / 否认…）在 8 字窗口内生效；
 * - 后置否定（“大小便都还好”“马尾神经排列规整”“受压不明显”）在关键词后 14 字内生效。
 */
const NEG_BEFORE_SINGLE = ['不'];
const NEG_BEFORE_SHORT = ['无', '未'];
const NEG_BEFORE_LONG = [
  '没有', '未见', '未发现', '未出现', '未触及', '无明显', '无明确', '不存在', '排除', '否认',
  '不曾', '从未', '无殊', '未伴', '不伴有', '未合并',
];
const NEG_AFTER = [
  '都还好', '还好', '正常', '没问题', '未见异常', '未见明显异常', '已排除', '都正常',
  '能自己控制', '可以自己控制', '控制良好', '控制正常', '控制没问题', '无异常', '没有异常',
  '无减退', '无受压', '未受压', '走行自然', '未见明显受压', '无明显受压', '未见明显',
  '无压痛', '无麻木', '无感觉异常', '未见异常改变', '未见明显异常改变', '恢复良好',
  '已恢复', '恢复好', '已痊愈', '痊愈', '已好转', '排列规整', '规整', '不明显', '对称存在',
  '感觉对称', '阴性', '未查及', '无殊',
];
/** 以“否认 / 排除 / 未见…”开头的报告式整句否定（用于“否认糖尿病、肿瘤及外伤史”这类并列） */
const CLAUSE_DENIAL = /^(否认|排除|未见|未发现|不存在|未触及|未出现)/;

/** 把从句按转折词切成语段（“但”前后的否定不互通） */
function segmentsOf(clause: string): string[] {
  return clause.split(/(?:但|但是|不过|然而|可是|却)/).map((s) => s.trim()).filter((s) => s.length > 0);
}

/** 判断关键词匹配处是否被否定（否定词与关键词须同处一个语段） */
function isNegated(segment: string, keyword: string, fromIndex: number): boolean {
  const idx = segment.indexOf(keyword, fromIndex);
  if (idx < 0) return false;
  if (CLAUSE_DENIAL.test(segment)) return true;
  const before8 = segment.slice(Math.max(0, idx - 8), idx);
  const immediate1 = segment.slice(Math.max(0, idx - 1), idx);
  const immediate2 = segment.slice(Math.max(0, idx - 2), idx);
  if (NEG_BEFORE_SINGLE.includes(immediate1)) return true;
  if (NEG_BEFORE_SHORT.some((n) => immediate2.endsWith(n))) return true;
  if (NEG_BEFORE_LONG.some((n) => before8.includes(n))) return true;
  const after = segment.slice(idx + keyword.length, idx + keyword.length + 14);
  if (NEG_AFTER.some((n) => after.includes(n))) return true;
  return false;
}

/** 正则匹配片段内部的否定（如“会阴部没有麻木”“会阴部感觉对称存在”） */
function regexMatchNegated(matched: string): boolean {
  if (/^(否认|排除|未见|未发现|不存在|未触及|未出现)/.test(matched)) return true;
  if (/(?:没有|未见|无|未|不|否认|排除)[^，。；]{0,3}(?:麻|木|没感觉|没知觉|感觉不到|感觉减退|感觉异常|感觉消失)/.test(matched)) {
    return true;
  }
  if (/(?:都还好|还好|正常|未见异常|无异常|对称存在|感觉对称|排列规整|规整|不明显|无麻木|无感觉异常|无减退)/.test(matched)) {
    return true;
  }
  return false;
}

/** 在单个从句中匹配关键词（跳过被局部否定的匹配；支持正则关键词） */
function matchInClause(clause: string, rule: RuleDef): boolean {
  const normalized = normalize(clause);
  const segments = segmentsOf(normalized);
  for (const keyword of rule.keywords) {
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
  for (const re of rule.regexes ?? []) {
    for (const seg of segments) {
      const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
      const global = new RegExp(re.source, flags);
      let m: RegExpExecArray | null;
      while ((m = global.exec(seg)) !== null) {
        if (!regexMatchNegated(m[0])) return true;
        if (m.index === global.lastIndex) global.lastIndex += 1;
      }
    }
  }
  return false;
}

/** 纯函数：在文本中匹配红旗规则（跳过局部否定与例外语境） */
export function matchRedFlags(text: string): RuleHit[] {
  const hits: RuleHit[] = [];
  const clauses = String(text)
    .split(/[，。；,\n!?！？]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const rule of RULES.filter((r) => r.category === 'red-flag')) {
    for (const clause of clauses) {
      if (rule.skip?.(clause)) continue;
      if (matchInClause(clause, rule)) {
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

/** 按规则代码取规则命中信息（用于把历史安全事件还原成红旗提示） */
export function ruleHitByCode(code: string): RuleHit | null {
  const rule = RULES.find((r) => r.code === code);
  if (!rule) return null;
  return { code: rule.code, name: rule.name, severity: rule.severity, action: rule.action, message: rule.message };
}

/** 就医提示的分类清单（与规则集一致，供 /safety/tips 使用） */
export const SAFETY_TIPS: string[] = [
  '大小便功能异常或鞍区麻木',
  '进行性下肢肌力下降',
  '夜间痛醒伴体重明显下降',
  '外伤后腰部剧痛',
  '发热伴腰痛',
  '疼痛剧烈、止痛药无法缓解',
  '有肿瘤病史又出现新发腰痛',
];
