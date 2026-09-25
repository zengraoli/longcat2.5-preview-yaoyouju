<template>
  <view class="fallback-page">
    <view class="fallback-card">
      <text class="fallback-icon">⚠️</text>
      <text class="fallback-title">服务暂时不可用</text>
      <text class="fallback-desc">{{ reason }}</text>

      <view class="fallback-actions">
        <button class="retry-btn" @click="retry">重试</button>
      </view>

      <view class="fallback-note">
        <text class="note-title">您仍然可以：</text>
        <view class="note-item">
          <text class="note-icon">📋</text>
          <text class="note-text">查看已有的病程记录</text>
        </view>
        <view class="note-item">
          <text class="note-icon">📝</text>
          <text class="note-text">预览和导出复诊摘要</text>
        </view>
        <view class="note-item">
          <text class="note-icon">📖</text>
          <text class="note-text">浏览已审核的健康教育内容</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const reason = ref('模型服务暂时不可用，请稍后重试');

function retry() {
  uni.reLaunch({ url: '/pages/index/index' });
}
</script>

<style lang="scss" scoped>
.fallback-page {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.fallback-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 64rpx 48rpx;
  text-align: center;
  width: 100%;
}

.fallback-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 32rpx;
}

.fallback-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-1);
  display: block;
  margin-bottom: 16rpx;
}

.fallback-desc {
  font-size: 26rpx;
  color: var(--text-2);
  display: block;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.retry-btn {
  background: var(--primary);
  color: #fff;
  font-size: 28rpx;
  border-radius: 20rpx;
  border: none;
  padding: 20rpx 64rpx;
  margin-bottom: 48rpx;
}

.fallback-note {
  text-align: left;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 24rpx;
}

.note-title {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 16rpx;
}

.note-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.note-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.note-text {
  font-size: 24rpx;
  color: var(--text-2);
}
</style>
