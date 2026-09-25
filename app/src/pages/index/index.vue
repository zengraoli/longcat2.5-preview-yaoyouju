<template>
  <view class="home-page">
    <view class="header">
      <text class="page-title">当前情况</text>
      <view class="emergency-btn" @click="goEmergency">
        <text class="emergency-text">紧急求助</text>
      </view>
    </view>

    <view class="section" v-if="pendingItems.length > 0">
      <text class="section-title">待确认项</text>
      <view class="card" v-for="item in pendingItems" :key="item.id">
        <text class="card-text">{{ item.text }}</text>
        <StatusTag type="warn" label="尚未确认" />
      </view>
    </view>

    <view class="section">
      <text class="section-title">最新分析</text>
      <view class="card" v-if="latestAnalysis">
        <text class="analysis-summary">{{ latestAnalysis.summary }}</text>
        <text class="analysis-version">版本 v{{ latestAnalysis.version }}</text>
      </view>
      <view class="card empty" v-else>
        <text class="empty-text">尚未生成分析</text>
        <button class="sub-btn" @click="goToAnalysis">生成分析</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">快捷入口</text>
      <view class="quick-grid">
        <view class="quick-item" @click="goToPage('/pages/qa/qa')">
          <text class="quick-icon">💬</text>
          <text class="quick-label">问与解释</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/timeline/timeline')">
          <text class="quick-icon">📋</text>
          <text class="quick-label">病程记录</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/followup/followup')">
          <text class="quick-icon">📝</text>
          <text class="quick-label">复诊准备</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/mine/mine')">
          <text class="quick-icon">👤</text>
          <text class="quick-label">我的</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="followupCountdown !== null">
      <text class="section-title">复诊倒计时</text>
      <view class="card">
        <text class="countdown-text">距离下次复诊还有 {{ followupCountdown }} 天</text>
      </view>
    </view>

    <TabBar :tabs="tabs" active-tab="index" @change="onTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';
import TabBar from '../../components/TabBar.vue';
import { api } from '../../api/request';

const tabs = [
  { key: 'index', label: '当前情况', icon: '🏠', path: '/pages/index/index' },
  { key: 'qa', label: '问与解释', icon: '💬', path: '/pages/qa/qa' },
  { key: 'timeline', label: '病程', icon: '📋', path: '/pages/timeline/timeline' },
  { key: 'followup', label: '复诊准备', icon: '📝', path: '/pages/followup/followup' },
  { key: 'mine', label: '我的', icon: '👤', path: '/pages/mine/mine' },
];

const pendingItems = ref<{ id: string; text: string }[]>([]);
const latestAnalysis = ref<{ summary: string; version: number } | null>(null);
const followupCountdown = ref<number | null>(null);

function goEmergency() {
  uni.showModal({
    title: '紧急就医提示',
    content: '如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。',
    showCancel: false,
    confirmText: '我知道了',
  });
}

function goToPage(url: string) {
  uni.navigateTo({ url });
}

function goToAnalysis() {
  uni.navigateTo({ url: '/pages/qa/qa' });
}

function onTabChange(key: string) {
  console.log('tab changed:', key);
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      const latest = episodes[0];
      pendingItems.value = [
        { id: '1', text: `发病日期: ${latest.onset_date || '尚未确认'}` },
        { id: '2', text: `病程状态: ${latest.status}` },
      ];
    }
  } catch (e) {
    console.error('Failed to load episodes:', e);
  }
});
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 140rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48rpx 32rpx 24rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--text-1);
}

.emergency-btn {
  padding: 12rpx 24rpx;
  background: rgba(217, 59, 59, 0.1);
  border-radius: 20rpx;
}

.emergency-text {
  font-size: 22rpx;
  color: var(--error);
}

.section {
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-text {
  font-size: 26rpx;
  color: var(--text-1);
  flex: 1;
}

.card.empty {
  flex-direction: column;
  align-items: flex-start;
}

.empty-text {
  font-size: 26rpx;
  color: var(--text-3);
  margin-bottom: 16rpx;
}

.analysis-summary {
  font-size: 26rpx;
  color: var(--text-1);
}

.analysis-version {
  font-size: 20rpx;
  color: var(--text-3);
  margin-top: 8rpx;
  display: block;
}

.sub-btn {
  background: var(--primary-light);
  color: var(--primary);
  font-size: 24rpx;
  border-radius: 12rpx;
  border: none;
  padding: 12rpx 28rpx;
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.quick-item {
  width: calc(50% - 8rpx);
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.quick-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.quick-label {
  font-size: 24rpx;
  color: var(--text-2);
}

.countdown-text {
  font-size: 26rpx;
  color: var(--primary);
  font-weight: 500;
}
</style>
