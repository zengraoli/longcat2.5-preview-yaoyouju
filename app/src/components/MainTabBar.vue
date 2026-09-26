<template>
  <view class="tab-bar">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: activeTab === tab.key }"
      @click="switchTab(tab)"
    >
      <image :src="activeTab === tab.key ? tab.activeIcon : tab.icon" class="tab-icon" />
      <text class="tab-label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  activeTab: string;
}>();

const tabs = [
  { key: 'index', label: '当前情况', icon: '/static/icons/tab_home.png', activeIcon: '/static/icons/tab_home_active.png', path: '/pages/index/index' },
  { key: 'qa', label: '问与解释', icon: '/static/icons/tab_chat.png', activeIcon: '/static/icons/tab_chat_active.png', path: '/pages/qa/qa' },
  { key: 'timeline', label: '病程', icon: '/static/icons/tab_pulse.png', activeIcon: '/static/icons/tab_pulse_active.png', path: '/pages/timeline/timeline' },
  { key: 'followup', label: '复诊准备', icon: '/static/icons/tab_doc.png', activeIcon: '/static/icons/tab_doc_active.png', path: '/pages/followup/followup' },
  { key: 'mine', label: '我的', icon: '/static/icons/tab_person.png', activeIcon: '/static/icons/tab_person_active.png', path: '/pages/mine/mine' },
];

function switchTab(tab: { key: string; path: string }) {
  if (props.activeTab === tab.key) return;
  uni.navigateTo({ url: tab.path });
}
</script>

<style lang="scss" scoped>
.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100rpx;
  background: var(--surface);
  border-top: 2rpx solid var(--border);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100rpx;
}

.tab-icon {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 4rpx;
}

.tab-label {
  font-size: 20rpx;
  color: var(--text-3);
}

.tab-item.active .tab-label {
  color: var(--primary);
  font-weight: 500;
}
</style>
