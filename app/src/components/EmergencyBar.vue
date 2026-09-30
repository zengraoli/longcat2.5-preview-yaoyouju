<template>
  <view class="emergency-bar" @click="emit('click')">
    <Icon name="warning" :size="18" class="emergency-bar__icon" />
    <text class="emergency-bar__text">出现严重症状？无需登录，立即查看就医提示</text>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits<{ click: [] }>();
</script>

<style scoped>
.emergency-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(217, 59, 59, 0.08);
}
.emergency-bar__icon { color: var(--error); font-size: 16px; }
.emergency-bar__text { color: var(--error); font-size: 13px; flex: 1; }
</style>
