<template>
  <view class="redflag-page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">需要及时寻求专业帮助</text>
      </view>
    </view>

    <view class="alert-card">
      <view class="alert-title-row">
        <image src="/static/icons/ic_error.png" class="alert-icon" />
        <text class="alert-title">建议尽快就医</text>
      </view>
      <text class="alert-body">
        你刚才选择了：{{ detectedSymptoms.join('、') }}。这类变化需要医生及时评估，本产品无法替你判断严重程度，本轮不会生成个性化分析。
      </text>
      <text class="alert-note">本页在网络异常时也可查看。</text>
    </view>

    <button class="danger-btn" @click="callEmergency">
      <text class="danger-icon">☎</text>
      拨打 120 / 前往急诊
    </button>

    <view class="contact-card" @click="findHospital">
      <image src="/static/icons/ic_pin.png" class="contact-icon" />
      <text class="contact-text">查找附近医院</text>
    </view>

    <view class="contact-card" @click="contactDoctor">
      <image src="/static/icons/ic_person.png" class="contact-icon" />
      <text class="contact-text">联系我的主治医生（已保存）</text>
    </view>

    <view class="bring-card">
      <text class="bring-title">就诊时可以带上</text>
      <view class="bring-item">
        <text class="bring-check">✓</text>
        <text class="bring-text">已录入的检查报告原文（2026-08-30 腰椎MRI）</text>
      </view>
      <view class="bring-item">
        <text class="bring-check">✓</text>
        <text class="bring-text">症状开始时间与最近变化记录</text>
      </view>
      <view class="bring-item">
        <text class="bring-check">✓</text>
        <text class="bring-text">正在使用的药物与既有医嘱</text>
      </view>
    </view>

    <button class="soft-btn" @click="generateSummary">
      <image src="/static/icons/ic_doc.png" class="soft-icon" />
      生成一页“就诊交接”摘要（仅整理已有信息）
    </button>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="info-icon" />
      <text class="info-text">此提示由临床审定规则触发，不是诊断结论；请以医生的评估为准。</text>
    </view>

    <view class="footer">
      <text class="link-text" @click="goContent">我已知晓，继续查看已审核科普与复诊摘要</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../../api/request';

const detectedSymptoms = ref<string[]>([]);

// 从上一页携带的参数读取
const pages = getCurrentPages();
const cur = pages[pages.length - 1] as any;
const items = cur?.options?.items || cur?.$page?.options?.items || '';
if (items) {
  detectedSymptoms.value = String(items).split(',');
}

function goBack() {
  uni.navigateBack();
}

function callEmergency() {
  uni.makePhoneCall({ phoneNumber: '120' });
}

function findHospital() {
  uni.showToast({ title: '请在地图应用中搜索附近医院', icon: 'none' });
}

function contactDoctor() {
  uni.showToast({ title: '已保存的主治医生联系方式（演示）', icon: 'none' });
}

async function generateSummary() {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      await api.previewFollowup(episodes[0].id);
    }
    uni.navigateTo({ url: '/pages/followup/followup' });
  } catch (e) {
    uni.showToast({ title: '暂无可整理的内容', icon: 'none' });
  }
}

function goContent() {
  uni.navigateTo({ url: '/pages/content/content' });
}
</script>

<style lang="scss" scoped>
.redflag-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx;
}

.header {
  padding: 32rpx 0 24rpx;
}

.back-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.back-icon {
  width: 36rpx;
  height: 36rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-1);
}

.alert-card {
  background: rgba(217, 59, 59, 0.06);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.alert-title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.alert-icon {
  width: 40rpx;
  height: 40rpx;
}

.alert-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--error);
}

.alert-body {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.7;
  display: block;
  margin-bottom: 16rpx;
}

.alert-note {
  font-size: 22rpx;
  color: var(--text-3);
}

.danger-btn {
  width: 100%;
  height: 96rpx;
  background: var(--error);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.danger-icon {
  font-size: 32rpx;
}

.contact-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: var(--surface);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
}

.contact-icon {
  width: 36rpx;
  height: 36rpx;
}

.contact-text {
  font-size: 28rpx;
  color: var(--text-1);
}

.bring-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.bring-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 20rpx;
}

.bring-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.bring-check {
  color: var(--ok);
  font-size: 26rpx;
  font-weight: 600;
}

.bring-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.5;
}

.soft-btn {
  width: 100%;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.soft-icon {
  width: 32rpx;
  height: 32rpx;
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.info-icon {
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.info-text {
  font-size: 24rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.footer {
  padding: 24rpx 0 48rpx;
}

.link-text {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: var(--primary);
}
</style>
