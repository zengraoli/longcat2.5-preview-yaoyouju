<template>
  <view class="bottom-tab">
    <view
      v-for="item in items"
      :key="item.pagePath"
      class="bottom-tab__item"
      :class="{ 'bottom-tab__item--active': current === item.pagePath }"
      @click="switchTo(item.pagePath)"
    >
      <text class="bottom-tab__icon">{{ item.icon }}</text>
      <text class="bottom-tab__text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
}

interface Props {
  items: TabItem[];
  current: string;
}

defineProps<Props>();

function switchTo(pagePath: string) {
  uni.switchTab({ url: `/${pagePath}` });
}
</script>

<style scoped>
.bottom-tab {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}
.bottom-tab__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  gap: 2px;
}
.bottom-tab__icon {
  font-size: 20px;
  color: var(--text-3);
}
.bottom-tab__text {
  font-size: 11px;
  color: var(--text-3);
}
.bottom-tab__item--active .bottom-tab__icon,
.bottom-tab__item--active .bottom-tab__text {
  color: var(--primary);
}
</style>
