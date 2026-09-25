<template>
  <view class="tab-bar">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: activeTab === tab.key }"
      @click="switchTab(tab)"
    >
      <text class="tab-icon">{{ tab.icon }}</text>
      <text class="tab-label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  tabs: { key: string; label: string; icon: string; path: string }[];
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'change', key: string): void;
}>();

function switchTab(tab: { key: string; label: string; icon: string; path: string }) {
  emit('change', tab.key);
  uni.switchTab({ url: tab.path });
}
</script>

<style lang="scss" scoped>


.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100rpx;
  background: var(--surface);
  border-top: 1rpx solid var(--border);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100rpx;

  .tab-icon {
    font-size: 36rpx;
    margin-bottom: 4rpx;
  }

  .tab-label {
    font-size: 20rpx;
    color: var(--text-2);
  }

  &.active {
    .tab-label {
      color: var(--primary);
      font-weight: 500;
    }
  }
}
</style>
