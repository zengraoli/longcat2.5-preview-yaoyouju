<template>
  <view class="redflag-page">
    <view class="alert-header">
      <text class="alert-title">⚠️ 检测到需要关注的症状</text>
      <text class="alert-subtitle">以下症状可能提示需要尽快就医的情况</text>
    </view>

    <view class="alert-card">
      <text class="alert-text">您填写了以下症状：</text>
      <view class="symptom-list">
        <view class="symptom-item" v-for="s in detectedSymptoms" :key="s">
          <text class="symptom-dot"></text>
          <text class="symptom-name">{{ s }}</text>
        </view>
      </view>
      <text class="alert-advice">建议您尽快前往医院急诊或专科就诊，排除严重情况。</text>
    </view>

    <view class="action-card">
      <text class="action-title">紧急联系方式</text>
      <view class="contact-item" @click="callEmergency">
        <text class="contact-icon">📞</text>
        <text class="contact-text">急救电话 120</text>
      </view>
      <view class="contact-item" @click="findHospital">
        <text class="contact-icon">🏥</text>
        <text class="contact-text">查找附近医院</text>
      </view>
    </view>

    <view class="tips-card">
      <text class="tips-title">在就医前，您可以：</text>
      <view class="tip-item">
        <text class="tip-num">1</text>
        <text class="tip-text">保持冷静，避免剧烈活动</text>
      </view>
      <view class="tip-item">
        <text class="tip-num">2</text>
        <text class="tip-text">记录症状出现的时间和变化</text>
      </view>
      <view class="tip-item">
        <text class="tip-num">3</text>
        <text class="tip-text">准备好之前的检查报告</text>
      </view>
    </view>

    <button class="primary-btn" @click="goHome">我已知晓，返回首页</button>
    <button class="emergency-btn" @click="callEmergency">拨打 120</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const detectedSymptoms = ref<string[]>([]);

function callEmergency() {
  uni.makePhoneCall({ phoneNumber: '120' });
}

function findHospital() {
  uni.showToast({ title: '请在地图应用中搜索附近医院', icon: 'none' });
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
}
</script>

<style lang="scss" scoped>
.redflag-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 32rpx;
}

.alert-header {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  border-left: 8rpx solid var(--error);
}

.alert-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--error);
  display: block;
}

.alert-subtitle {
  font-size: 24rpx;
  color: var(--text-2);
  margin-top: 12rpx;
  display: block;
}

.alert-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.alert-text {
  font-size: 26rpx;
  color: var(--text-1);
  display: block;
  margin-bottom: 20rpx;
}

.symptom-list {
  margin-bottom: 24rpx;
}

.symptom-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.symptom-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--error);
  margin-right: 16rpx;
}

.symptom-name {
  font-size: 26rpx;
  color: var(--text-1);
}

.alert-advice {
  font-size: 26rpx;
  color: var(--error);
  font-weight: 500;
  line-height: 1.6;
}

.action-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.action-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border);
}

.contact-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.contact-text {
  font-size: 26rpx;
  color: var(--primary);
}

.tips-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.tip-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.tip-text {
  font-size: 24rpx;
  color: var(--text-2);
  flex: 1;
}

.primary-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--primary);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;
  margin-bottom: 16rpx;
}

.emergency-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--error);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;
}
</style>
