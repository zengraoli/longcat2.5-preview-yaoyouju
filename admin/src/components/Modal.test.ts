import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Modal from './Modal.vue';

/** 弹层：有确认文案时默认展示确认按钮（历史调用未传 showActions 也能提交） */
describe('Modal 弹层', () => {
  it('有 confirmText 时展示确认按钮', () => {
    const wrapper = mount(Modal, {
      props: { open: true, title: '新建内容', confirmText: '创建' },
      attachTo: document.body,
    });
    const texts = Array.from(document.body.querySelectorAll('button')).map((b) => b.textContent);
    expect(texts).toContain('创建');
    expect(texts).toContain('取消');
    wrapper.unmount();
  });

  it('无 confirmText 时不展示操作区', () => {
    const wrapper = mount(Modal, {
      props: { open: true, title: '红旗规则表' },
    });
    expect(wrapper.text()).not.toContain('取消');
  });

  it('点击确认按钮触发 confirm 事件', async () => {
    const wrapper = mount(Modal, {
      props: { open: true, title: '测试', confirmText: '确定' },
      attachTo: document.body,
    });
    const buttons = Array.from(document.body.querySelectorAll('button'));
    const confirmBtn = buttons.find((b) => b.textContent === '确定');
    expect(confirmBtn).toBeTruthy();
    await confirmBtn?.dispatchEvent(new Event('click'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('confirm')).toBeTruthy();
    wrapper.unmount();
  });

  it('按回车触发确认（窗口级 keydown 监听）', async () => {
    const wrapper = mount(Modal, {
      props: { open: true, title: '测试', confirmText: '确定' },
      attachTo: document.body,
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('confirm')).toBeTruthy();
    wrapper.unmount();
  });
});
