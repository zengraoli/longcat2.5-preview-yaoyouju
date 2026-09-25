<template>
  <view class="page">
    <view class="header">
      <text class="page-title">{{ content.title }}</text>
      <StatusTag type="ok" label="已发布" />
    </view>

    <view class="video-placeholder">
      <text class="video-icon">▶</text>
      <text class="video-text">视频播放区域</text>
      <text class="video-hint">（演示模式：使用占位图）</text>
    </view>

    <view class="info-card">
      <text class="info-title">适用范围</text>
      <text class="info-text">{{ content.applicable_scope || '暂无' }}</text>
    </view>

    <view class="info-card">
      <text class="info-title">不适用范围</text>
      <text class="info-text">{{ content.not_applicable || '暂无' }}</text>
    </view>

    <view class="info-card">
      <text class="info-title">字幕与文字替代</text>
      <text class="info-text">{{ content.subtitle_text || '暂无' }}</text>
    </view>

    <view class="info-card">
      <text class="info-title">审核信息</text>
      <view class="review-info">
        <text class="review-line">版本: v{{ content.version || '尚未确认' }}</text>
        <text class="review-line">审核状态: 已通过医学审核</text>
        <text class="review-line">审核范围: 医学准确性</text>
      </view>
    </view>

    <view class="disclaimer-card">
      <text class="disclaimer-text">本内容仅作健康教育参考，不构成医疗建议</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';
import { api } from '../../api/request';

const content = ref<any>({});

onMounted(async () => {
  try {
    const contents = await api.getPublishedContents();
    if (contents && contents.length > 0) {
      content.value = contents[0];
    }
  } catch (e) {
    console.error('Failed to load content detail:', e);
  }
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 32rpx;
}

.header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-1);
  flex: 1;
}

.video-placeholder {
  height: 400rpx;
  background: #000;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.video-icon {
  font-size: 80rpx;
  color: #fff;
  margin-bottom: 16rpx;
}

.video-text {
  font-size: 28rpx;
  color: #fff;
}

.video-hint {
  font-size: 20rpx;
  color: rgba(255,255,255,0.5);
  margin-top: 8rpx;
}

.info-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.info-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 16rpx;
  display: block;
}

.info-text {
  font-size: 26rpx;
  color: var(--text-2);
  line-height: 1.6;
}

.review-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.review-line {
  font-size: 24rpx;
  color: var(--text-2);
}

.disclaimer-card {
  background: rgba(199, 119, 0, 0.08);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-top: 24rpx;
}

.disclaimer-text {
  font-size: 22rpx;
  color: var(--warn);
  text-align: center;
  display: block;
}
</style>
