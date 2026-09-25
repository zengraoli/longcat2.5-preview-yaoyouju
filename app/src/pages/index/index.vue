<template>
  <view class="page">
    <view class="header">
      <text class="title">腰有据</text>
      <text class="subtitle">腰痛理解与复诊助手</text>
    </view>
    <view class="content">
      <StatusTag type="info" label="首页开发中" />
    </view>
    <TabBar :tabs="tabs" active-tab="index" @change="onTabChange" />
  </view>
</template>

<script setup lang="ts">
import StatusTag from '../../components/StatusTag.vue';
import TabBar from '../../components/TabBar.vue';

const tabs = [
  { key: 'index', label: '当前情况', icon: '🏠', path: '/pages/index/index' },
  { key: 'qa', label: '问与解释', icon: '💬', path: '/pages/qa/qa' },
  { key: 'timeline', label: '病程', icon: '📋', path: '/pages/timeline/timeline' },
  { key: 'followup', label: '复诊准备', icon: '📝', path: '/pages/followup/followup' },
  { key: 'mine', label: '我的', icon: '👤', path: '/pages/mine/mine' },
];

function onTabChange(key: string) {
  console.log('tab changed:', key);
}
</script>

<style lang="scss" scoped>


.page {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 120rpx;
}

.header {
  padding: 48rpx 32rpx;
  background: var(--surface);

  .title {
    font-size: 40rpx;
    font-weight: 600;
    color: var(--text-1);
    display: block;
  }

  .subtitle {
    font-size: 24rpx;
    color: var(--text-2);
    margin-top: 8rpx;
    display: block;
  }
}

.content {
  padding: 32rpx;
}
</style>
