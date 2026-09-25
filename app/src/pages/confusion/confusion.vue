<template>
  <view class="page">
    <view class="header">
      <text class="page-title">选择您最想了解的</text>
      <text class="page-subtitle">我们会针对您的困惑提供更有针对性的分析</text>
    </view>

    <view class="option-list">
      <view
        v-for="opt in options"
        :key="opt.key"
        class="option-card"
        :class="{ selected: selected === opt.key }"
        @click="selected = opt.key"
      >
        <view class="option-icon">{{ opt.icon }}</text>
        <view class="option-content">
          <text class="option-title">{{ opt.title }}</text>
          <text class="option-desc">{{ opt.desc }}</text>
        </view>
        <view class="option-check" v-if="selected === opt.key">
          <text class="check-mark">✓</text>
        </view>
      </view>
    </view>

    <button class="primary-btn" :disabled="!selected" @click="confirm">确认选择</button>
    <button class="skip-btn" @click="skip">跳过这步</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const options = [
  { key: 'terms', icon: '📖', title: '报告术语', desc: '理解检查报告中的专业术语' },
  { key: 'changes', icon: '📈', title: '病程变化', desc: '症状是好转了还是加重了' },
  { key: 'followup', icon: '🏥', title: '复诊准备', desc: '为下次复诊做好准备' },
  { key: 'life', icon: '🏠', title: '生活影响', desc: '腰痛对日常生活的影响' },
];

const selected = ref('');

function confirm() {
  uni.navigateTo({ url: '/pages/report/report' });
}

function skip() {
  uni.navigateTo({ url: '/pages/report/report' });
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 32rpx;
}

.header {
  margin-bottom: 40rpx;
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

.option-list {
  margin-bottom: 40rpx;
}

.option-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  border: 2rpx solid transparent;

  &.selected {
    border-color: var(--primary);
    background: var(--primary-light);
  }
}

.option-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
}

.option-desc {
  font-size: 22rpx;
  color: var(--text-2);
  margin-top: 8rpx;
  display: block;
}

.option-check {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-mark {
  color: #fff;
  font-size: 24rpx;
}

.primary-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: var(--primary);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;

  &[disabled] {
    opacity: 0.5;
  }
}

.skip-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background: transparent;
  color: var(--text-2);
  font-size: 26rpx;
  border: none;
  margin-top: 16rpx;
}
</style>
