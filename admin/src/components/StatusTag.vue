<template>
  <span class="status-tag" :class="`status-tag--${tone}`">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  tone?: 'ok' | 'warn' | 'error' | 'info' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'neutral',
});

// 根据标签文案推断色调（三端语义一致）
const tone = computed(() => {
  if (props.tone !== 'neutral') return props.tone;
  if (['已确认', '已同意', '已审核 v2', '已审核 v1', '自述', '已发布', '通过', '正常', '已录入', '已清除', '已标注：随访中'].includes(props.label)) return 'ok';
  if (['尚未确认', '未经核实', '待确认', '未开启', '待处理', '待审'].includes(props.label)) return 'warn';
  if (['有冲突', '已下线 · 更正中', '高', '失败', '阻断', '阻断发布', '已回滚', '已停用', '已过期', '已撤回', '已关闭'].includes(props.label)) return 'error';
  if (['系统生成', '不作诊断', '报告原文', '中', '低', '已授权', '已归档'].includes(props.label)) return 'info';
  return 'neutral';
});
</script>

<style scoped>
.status-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}
.status-tag--ok { color: var(--ok); background: rgba(30, 158, 90, 0.1); }
.status-tag--warn { color: var(--warn); background: rgba(199, 119, 0, 0.1); }
.status-tag--error { color: var(--error); background: rgba(217, 59, 59, 0.1); }
.status-tag--info { color: var(--info); background: rgba(47, 111, 216, 0.1); }
.status-tag--neutral { color: var(--text-2); background: var(--bg); }
</style>
