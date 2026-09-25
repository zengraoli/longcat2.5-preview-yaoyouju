import { describe, it, expect } from 'vitest';
import { SafetyService } from './safety.service';

describe('SafetyService', () => {
  let service: SafetyService;

  beforeEach(() => {
    service = new SafetyService();
  });

  it('should pass for normal text', () => {
    const result = service.fullCheck('腰痛三个月，久坐加重');
    expect(result.passed).toBe(true);
    expect(result.action).toBe('none');
  });

  it('should detect red flag RF-01', () => {
    const result = service.fullCheck('腰痛伴有大小便失禁');
    expect(result.passed).toBe(false);
    expect(result.ruleCode).toBe('RF-01');
    expect(result.action).toBe('提示就医');
  });

  it('should detect red flag RF-02', () => {
    const result = service.fullCheck('最近出现足下垂');
    expect(result.passed).toBe(false);
    expect(result.ruleCode).toBe('RF-02');
  });

  it('should detect out of scope - diagnosis', () => {
    const result = service.fullCheck('我这是什么诊断');
    expect(result.passed).toBe(false);
    expect(result.action).toBe('停止个性化分析');
    expect(result.ruleCode).toBe('SCOPE-01');
  });

  it('should detect out of scope - medication', () => {
    const result = service.fullCheck('应该吃什么药');
    expect(result.passed).toBe(false);
    expect(result.action).toBe('停止个性化分析');
  });

  it('should prioritize red flags over scope', () => {
    const result = service.fullCheck('腰痛伴有大小便失禁，应该吃什么药');
    expect(result.ruleCode).toBe('RF-01');
    expect(result.action).toBe('提示就医');
  });
});
