<template>
  <view class="app-card">
    <view v-if="title" class="app-card__title">
      {{ title }}
      <slot name="extra" />
    </view>
    <slot />
  </view>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
}

defineProps<Props>();
</script>

<style scoped>
.app-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.app-card__title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
