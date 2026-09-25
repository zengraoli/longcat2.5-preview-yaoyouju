<template>
  <view class="page">
    <view class="header">
      <text class="page-title">核对信息</text>
      <text class="page-subtitle">请确认以下信息是否准确</text>
    </view>

    <view class="card">
      <view class="info-row">
        <text class="info-label">来源类型</text>
        <text class="info-value">{{ info.sourceType || '尚未确认' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">报告日期</text>
        <text class="info-value">{{ info.reportDate || '尚未确认' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">核实状态</text>
        <StatusTag :type="info.verifyStatus === '已确认' ? 'ok' : 'warn'" :label="info.verifyStatus || '尚未确认'" />
      </view>
    </view>

    <view class="card">
      <text class="card-title">抽取的术语</text>
      <view class="term-list" v-if="info.extractedTerms && info.extractedTerms.length > 0">
        <view class="term-item" v-for="term in info.extractedTerms" :key="term.term">
          <text class="term-name">{{ term.term }}</text>
          <text class="term-pos">{{ term.position }}</text>
        </view>
      </view>
      <text class="empty-hint" v-else>暂无抽取术语</text>
    </view>

    <view class="card">
      <text class="card-title">原文内容</text>
      <text class="raw-text">{{ info.rawText || '尚未录入' }}</text>
    </view>

    <view class="action-row">
      <button class="edit-btn" @click="goEdit">修改</button>
      <button class="primary-btn" @click="confirm">确认无误</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';

const info = ref<any>({});

onMounted(async () => {
  try {
    const episodes = await (await import('../../api/request')).api.getEpisodes();
    if (episodes && episodes.length > 0) {
      const episodeId = episodes[0].id;
      const { api } = await import('../../api/request');
      const events = await api.getCareEvents(episodeId);
      if (events && events.length > 0) {
        const reportId = events[0].id;
        info.value = await api.getStructuredInfo(reportId);
      }
    }
  } catch (e) {
    console.error('Failed to load structured info:', e);
  }
});

function goEdit() {
  uni.navigateBack();
}

function confirm() {
  uni.showToast({ title: '已确认', icon: 'success' });
  setTimeout(() => uni.navigateTo({ url: '/pages/index/index' }), 1000);
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 32rpx;
}

.header {
  margin-bottom: 32rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-1);
  display: block;
}

.page-subtitle {
  font-size: 24rpx;
  color: var(--text-2);
  margin-top: 12rpx;
  display: block;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border);

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 26rpx;
  color: var(--text-2);
}

.info-value {
  font-size: 26rpx;
  color: var(--text-1);
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.term-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.term-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: var(--bg);
  border-radius: 12rpx;
}

.term-name {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--primary);
  margin-right: 16rpx;
}

.term-pos {
  font-size: 22rpx;
  color: var(--text-2);
  flex: 1;
}

.empty-hint {
  font-size: 24rpx;
  color: var(--text-3);
}

.raw-text {
  font-size: 24rpx;
  color: var(--text-1);
  line-height: 1.6;
}

.action-row {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.edit-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--surface);
  color: var(--text-1);
  font-size: 28rpx;
  border-radius: 20rpx;
  border: 2rpx solid var(--border);
}

.primary-btn {
  flex: 2;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--primary);
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;
}
</style>
