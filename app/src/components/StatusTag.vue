<template>
  <view class="status-tag" :class="type">
    <text class="tag-text">{{ label }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: 'ok' | 'warn' | 'error' | 'info';
  label: string;
}>();

const colorMap = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  error: 'var(--error)',
  info: 'var(--info)',
};
</script>

<style lang="scss" scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 500;

  &.ok {
    background: rgba(30, 158, 90, 0.1);
    color: var(--ok);
  }

  &.warn {
    background: rgba(199, 119, 0, 0.1);
    color: var(--warn);
  }

  &.error {
    background: rgba(217, 59, 59, 0.1);
    color: var(--error);
  }

  &.info {
    background: rgba(47, 111, 216, 0.1);
    color: var(--info);
  }
}
</style>
