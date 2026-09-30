<template>
  <div class="tipbar" :class="`tipbar--${type}`">
    <span class="tipbar__icon">{{ icon }}</span>
    <div class="tipbar__text"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'info' | 'warn' | 'error';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
});

const icon = computed(() => {
  if (props.type === 'error') return '';
  if (props.type === 'warn') return '•';
  return 'ℹ';
});
</script>

<style scoped>
.tipbar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
}
.tipbar--info { background: var(--primary-light); color: var(--primary); }
.tipbar--warn { background: rgba(199, 119, 0, 0.08); color: var(--warn); }
.tipbar--error { background: rgba(217, 59, 59, 0.08); color: var(--error); }
.tipbar__icon { flex-shrink: 0; }
.tipbar__text { flex: 1; }
</style>
