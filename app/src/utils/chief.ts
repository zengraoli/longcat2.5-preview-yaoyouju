/**
 * 从病程数据构建患者陈述。红线：缺失一律显示“尚未确认”，不写死任何症状描述。
 */

export interface ChangeAnswers {
  change: string;
  redFlags: string[];
  side: string;
  onset: string;
}

/** 解析“变化确认”记录的可读文本：变化：x；红旗项：x；侧别：x；开始日期：x */
export function parseChangeText(raw: string | null | undefined): ChangeAnswers {
  const result: ChangeAnswers = { change: '尚未确认', redFlags: [], side: '尚未确认', onset: '尚未确认' };
  if (!raw) return result;
  const get = (key: string) => {
    const m = raw.match(new RegExp(`${key}：([^；]*)`));
    return m?.[1]?.trim() || '';
  };
  const change = get('变化');
  if (change && change !== '尚未确认') result.change = change;
  const flags = get('红旗项');
  if (flags && flags !== '无') result.redFlags = flags.split('、').filter(Boolean);
  const side = get('侧别');
  if (side && side !== '尚未确认') result.side = side;
  const onset = get('开始日期');
  if (onset && onset !== '尚未确认') result.onset = onset;
  return result;
}

export interface ChiefData {
  episode?: { onset_date?: string | null; onset_certainty?: string; status?: string } | null;
  change?: ChangeAnswers | null;
  lastLog?: { sitMinutes?: number | null; topWorry?: string | null; legChange?: string | null } | null;
  analysisUnknown?: string[];
}

/** 大小便/鞍区：根据红旗项记录推导，未回答即“尚未确认” */
export function bowelStatus(change: ChangeAnswers | null): string {
  if (!change) return '尚未确认';
  if (change.redFlags.some((f) => f.includes('大小便'))) return '有（已确认）';
  if (change.redFlags.includes('以上都没有')) return '没有（已确认）';
  return '尚未确认';
}

/** 腿部无力：优先最近一次症状记录，其次分析未知项 */
export function legStatus(data: ChiefData): string {
  const log = data.lastLog?.legChange;
  if (log && log !== '尚未确认') return `${log}（已确认）`;
  const unknown: string[] = data.analysisUnknown || [];
  if (unknown.some((u) => u.includes('腿部无力'))) return '尚未回答（尚未确认）';
  return '尚未确认';
}

/** 构建复诊摘要“主要症状与变化”段落（App A12 / Web W06 共用逻辑） */
export function buildChiefText(data: ChiefData): string {
  const change = data.change || parseChangeText(null);
  const parts: string[] = [];
  const onset = change.onset !== '尚未确认' ? change.onset : (data.episode?.onset_date ? `约 ${data.episode.onset_date.slice(0, 7)}` : '尚未确认');
  parts.push(`目前腰痛开始时间：${onset}`);
  parts.push(`最近变化：${change.change}`);
  parts.push(`主要在：${change.side}`);
  const sit = data.lastLog?.sitMinutes;
  parts.push(`每天能坐约：${sit != null ? sit + ' 分钟' : '尚未确认'}`);
  const worry = data.lastLog?.topWorry;
  parts.push(worry ? `最近担心：${worry}` : '最近担心的事：尚未记录');
  parts.push(`腿部无力：${legStatus(data).replace('（已确认）', '').replace('（尚未确认）', '')}`);
  parts.push(`大小便/鞍区：${bowelStatus(change).replace('（已确认）', '')}`);
  return parts.join('；');
}

/** 构建一页分析“你描述”段落（App A07） */
export function buildSelfDescription(data: ChiefData): string {
  const change = data.change || parseChangeText(null);
  if (change.change === '尚未确认' && change.side === '尚未确认') {
    return '你描述：尚未确认。可在“当前情况-生成分析”中回答 4 个关键问题后自动生成。';
  }
  return `你描述：最近变化为“${change.change}”；主要在${change.side}；大小便/鞍区${bowelStatus(change).replace('（已确认）', '')}；症状开始时间${change.onset}。`;
}
