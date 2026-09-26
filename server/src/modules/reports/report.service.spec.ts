import { describe, it, expect } from 'vitest';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService();
  });

  it('should extract L5/S1 terms from MRI report', () => {
    const text = '腰椎MRI显示L5/S1椎间盘突出，硬膜囊受压';
    const terms = service.extractTerms(text);
    const termNames = terms.map((t) => t.term);
    expect(termNames).toContain('L5/S1');
    expect(termNames).toContain('椎间盘突出');
    expect(termNames).toContain('硬膜囊受压');
  });

  it('should extract terms with position context', () => {
    const text = 'L4/5椎间盘中央型突出';
    const terms = service.extractTerms(text);
    const comboTerm = terms.find((t) => t.term === 'L4/5');
    expect(comboTerm).toBeDefined();
    expect(comboTerm.position).toContain('L4/5');
  });

  it('should return empty array for non-medical text', () => {
    const text = '今天天气很好，我去公园散步了';
    const terms = service.extractTerms(text);
    expect(terms).toEqual([]);
  });

  it('should filter single-letter fragments but keep combos', () => {
    const text = 'L4/5椎间盘突出，L5/S1椎间盘退变';
    const terms = service.extractTerms(text);
    const termNames = terms.map((t) => t.term);
    expect(termNames).toContain('L4/5');
    expect(termNames).toContain('L5/S1');
    expect(termNames).not.toContain('L4');
    expect(termNames).not.toContain('L5');
    expect(termNames).not.toContain('S1');
    expect(termNames).toContain('突出');
  });
});
