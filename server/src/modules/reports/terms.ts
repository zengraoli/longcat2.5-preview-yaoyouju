/** 报告术语抽取：在原文中查找术语并记录位置 */

const TERMS = [
  'L5/S1', 'L4/5', 'L3/4', 'L2/3', 'L1/2',
  '椎间盘突出', '椎间盘膨出', '椎管狭窄', '腰椎生理曲度', '生理曲度',
  '骨质增生', '许莫氏结节', '终板炎', '硬膜囊', '神经根', '马尾',
  '椎体滑脱', '侧弯', '椎间隙狭窄', '黄韧带肥厚', '骨赘', '退变', '变性',
  '膨隆', '突出', '脱出', '游离', '中央型', '旁中央型', '外侧型', '极外侧型',
  '肩上型', '肩下型', '椎间孔型', '硬膜外', '硬膜下', '蛛网膜下腔',
  '脑脊液', '马尾神经', '圆锥', '终丝', '神经根袖', '背根神经节',
  '椎动脉', '脊髓', '脊髓圆锥', '脊髓中央管', '脊髓空洞', '脊髓炎',
  '脊髓梗死', '脊髓压迫', '脊髓损伤',
  '颈椎', '胸椎', '腰椎', '骶椎', '尾椎', '椎间盘', '纤维环', '髓核',
  '软骨终板', '前纵韧带', '后纵韧带', '黄韧带', '棘上韧带', '棘间韧带',
];

export interface TermHit {
  term: string;
  position: number;
}

/** 抽取术语及其在原文中的位置（字符下标）；同一术语多次出现会记录多次 */
export function extractTerms(text: string): TermHit[] {
  const hits: TermHit[] = [];
  for (const term of TERMS) {
    let from = 0;
    while (from <= text.length - term.length) {
      const idx = text.indexOf(term, from);
      if (idx === -1) break;
      hits.push({ term, position: idx });
      from = idx + term.length;
    }
  }
  return hits.sort((a, b) => a.position - b.position);
}

/** 模拟 OCR：返回示例文本（演示用，不调用外部服务） */
export function mockOcr(): { text: string; engine: string } {
  return {
    engine: 'mock-ocr-v1',
    text: '腰椎 MRI 报告：L4/5、L5/S1 椎间盘突出，L5/S1 为著；腰椎生理曲度存在。',
  };
}
