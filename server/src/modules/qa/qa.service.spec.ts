import { describe, it, expect } from 'vitest';
import { QaService } from './qa.service';

describe('QaService', () => {
  let service: QaService;

  beforeEach(() => {
    service = new QaService({ fullCheck: () => ({ passed: true, action: 'none' }) } as any);
  });

  it('should detect out-of-scope - diagnosis', () => {
    expect(service.isOutOfScope('我这是什么诊断')).toBe(true);
  });

  it('should detect out-of-scope - medication', () => {
    expect(service.isOutOfScope('应该吃什么药')).toBe(true);
  });

  it('should detect out-of-scope - surgery', () => {
    expect(service.isOutOfScope('要不要手术')).toBe(true);
  });

  it('should not flag normal questions', () => {
    expect(service.isOutOfScope('腰痛怎么缓解')).toBe(false);
  });

  it('should detect reassurance seeking', () => {
    expect(service.isReassurance('你能保证一定能治好吗')).toBe(true);
  });

  it('should detect reassurance - certainty', () => {
    expect(service.isReassurance('这个病一定会好吗')).toBe(true);
  });
});
