<template>
  <view class="home-page">
    <view class="header">
      <text class="page-title">当前情况</text>
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
        <view class="quick-item" @click="goToPage('/pages/today/today')">
          <image src="/static/icons/ic_pen.png" class="quick-icon" />
          <text class="quick-label">记录今天</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/report/report')">
          <image src="/static/icons/ic_upload.png" class="quick-icon" />
          <text class="quick-label">录入报告</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/qa/qa')">
          <image src="/static/icons/ic_chat.png" class="quick-icon" />
          <text class="quick-label">问与解释</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/followup/followup')">
          <image src="/static/icons/ic_doc.png" class="quick-icon" />
          <text class="quick-label">复诊摘要</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="recommendItems.length > 0">
      <text class="section-title">为你推荐</text>
      <view class="card" v-for="item in recommendItems" :key="item.id" @click="goToContent">
        <view class="rec-info">
          <text class="rec-title">{{ item.title }}</text>
          <text class="rec-meta">{{ item.type }} · 已审核 v{{ item.version || 1 }}</text>
          <text class="rec-reason" v-if="item.recommendReason">推荐理由：{{ item.recommendReason }}</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="followupCountdown !== null">
      <text class="section-title">复诊倒计时</text>
      <view class="card">
        <text class="countdown-text">距离下次复诊还有 {{ followupCountdown }} 天</text>
      </view>
    </view>

    <view class="section emergency-section">
      <view class="emergency-bar" @click="goEmergency">
        <image src="/static/icons/ic_warn.png" class="emergency-icon" />
        <text class="emergency-text">症状突然变化或出现严重信号？查看就医提示</text>
      </view>
    </view>
      <MainTabBar active-tab="index" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';
import { api } from '../../api/request';
import MainTabBar from '../../components/MainTabBar.vue';

const pendingItems = ref<{ id: string; text: string }[]>([]);
const latestAnalysis = ref<{ summary: string; version: number } | null>(null);
const followupCountdown = ref<number | null>(null);
const recommendItems = ref<any[]>([]);

function goToContent() {
  goToPage('/pages/content/content');
}

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
  uni.navigateTo({ url: '/pages/change/change' });
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
  try {
    recommendItems.value = await api.getPublishedContents();
  } catch (e) {
    console.error('Failed to load contents:', e);
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
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
}

.emergency-section {
  margin-bottom: 160rpx;
}

.emergency-bar {
  display: flex;
  align-items: center;
  background: rgba(217, 59, 59, 0.1);
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
}

.emergency-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
}

.emergency-text {
  font-size: 26rpx;
  color: var(--error);
  font-weight: 500;
  flex: 1;
}

.quick-label {
  font-size: 24rpx;
  color: var(--text-2);
}

.rec-info {
  display: flex;
  flex-direction: column;
}

.rec-title {
  font-size: 26rpx;
  color: var(--text-1);
  font-weight: 500;
}

.rec-meta {
  font-size: 22rpx;
  color: var(--text-3);
  margin-top: 6rpx;
}

.rec-reason {
  font-size: 22rpx;
  color: var(--text-2);
  margin-top: 6rpx;
}

.countdown-text {
  font-size: 26rpx;
  color: var(--primary);
  font-weight: 500;
}
</style>
