import { describe, it, expect } from 'vitest';
import { escapeHtml } from './html';

describe('escapeHtml（打印弹窗 XSS 防护）', () => {
  it('转义 <img onerror> 等脚本注入', () => {
    const evil = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(evil);
    // 关键：标签起始符 < 被转义，浏览器不再解析为标签，脚本不会执行
    expect(escaped).not.toContain('<img');
    expect(escaped).not.toContain('<script');
    expect(escaped).toContain('&lt;img');
  });

  it('转义 <script> 标签', () => {
    expect(escapeHtml('<script>alert(1)</script>')).not.toContain('<script>');
  });

  it('普通文本不受影响', () => {
    expect(escapeHtml('腰椎间盘突出是常见原因。')).toBe('腰椎间盘突出是常见原因。');
  });
});

/** 红旗事件：命中红旗时派发全局事件，由 AppLayout 统一弹出就医提示 */
describe('红旗全局提示', () => {
  it('showRedFlag 派发带消息的自定义事件', async () => {
    // node 环境下模拟 window
    const dispatched: Event[] = [];
    const g = globalThis as unknown as { window?: Record<string, unknown> };
    g.window = {
      dispatchEvent: (e: Event) => {
        dispatched.push(e);
        return true;
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    const { showRedFlag } = await import('./redflag');
    showRedFlag({ messages: ['测试红旗'] });
    expect(dispatched).toHaveLength(1);
    const detail = (dispatched[0] as CustomEvent).detail as { messages: string[] };
    expect(detail.messages).toEqual(['测试红旗']);
    delete g.window;
  });
});
