<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">一页分析</text>
      </view>
    </view>

    <view class="offline-icon-wrap">
      <image src="/static/icons/ic_wifi_off.png" class="offline-icon" />
    </view>

    <text class="fallback-title">本次无法完成个性化解释</text>
    <text class="fallback-desc">
      模型或来源校验暂时不可用。我们不会无限重试，也不会重复计费。你已核对的信息已经保存，稍后可以直接生成分析。
    </text>

    <view class="tag-row">
      <text class="err-code">错误码 ANL-503</text>
      <text class="ok-tag">已保存核对信息</text>
      <text class="ok-tag">未计费</text>
    </view>

    <text class="section-label">现在仍然可以使用</text>

    <view class="card">
      <view class="avail-item">
        <image src="/static/icons/ic_play.png" class="avail-icon" />
        <view class="avail-info">
          <text class="avail-title">已审核科普</text>
          <text class="avail-desc">8 个视频/图文，含字幕与文字替代，不依赖模型</text>
        </view>
        <text class="avail-tag">可用</text>
      </view>
    </view>

    <view class="card">
      <view class="avail-item">
        <image src="/static/icons/ic_doc.png" class="avail-icon" />
        <view class="avail-info">
          <text class="avail-title">复诊摘要</text>
          <text class="avail-desc">基于你已有的记录与报告原文生成，可导出</text>
        </view>
        <text class="avail-tag">可用</text>
      </view>
    </view>

    <view class="card">
      <view class="avail-item">
        <image src="/static/icons/ic_pulse.png" class="avail-icon" />
        <view class="avail-info">
          <text class="avail-title">病程记录</text>
          <text class="avail-desc">继续记录今天；数据只保存在你的账户</text>
        </view>
        <text class="avail-tag">可用</text>
      </view>
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">低带宽下本页与核心文字仍可阅读；网络异常时也能看到基础求助说明。</text>
    </view>

    <view class="emergency-bar" @click="goEmergency">
      <image src="/static/icons/ic_warn.png" class="emergency-icon" />
      <text class="emergency-text">出现严重症状？查看就医提示（不依赖网络）</text>
    </view>

    <view class="footer">
      <button class="retry-btn" @click="retry">稍后重试（约 2 分钟后可用）</button>
      <text class="link-text" @click="goHome">返回当前情况</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const reason = ref('模型服务暂时不可用，请稍后重试');

function goBack() {
  uni.navigateBack();
}

function goEmergency() {
  uni.showModal({
    title: '紧急就医提示',
    content: '如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。',
    showCancel: false,
    confirmText: '我知道了',
  });
}

function retry() {
  uni.reLaunch({ url: '/pages/index/index' });
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 48rpx;
}

.header {
  padding: 32rpx 0 48rpx;
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

.offline-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 32rpx;
}

.offline-icon {
  width: 120rpx;
  height: 120rpx;
  background: rgba(199, 119, 0, 0.1);
  border-radius: 50%;
  padding: 32rpx;
}

.fallback-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-1);
  text-align: center;
  display: block;
  margin-bottom: 24rpx;
}

.fallback-desc {
  font-size: 26rpx;
  color: var(--text-2);
  line-height: 1.7;
  text-align: center;
  display: block;
  margin-bottom: 32rpx;
}

.tag-row {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  flex-wrap: wrap;
  margin-bottom: 48rpx;
}

.err-code {
  font-size: 22rpx;
  color: var(--text-2);
  background: var(--bg);
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
}

.ok-tag {
  font-size: 22rpx;
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
}

.section-label {
  font-size: 26rpx;
  color: var(--text-1);
  display: block;
  margin-bottom: 16rpx;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.avail-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avail-icon {
  width: 56rpx;
  height: 56rpx;
  background: var(--primary-light);
  border-radius: 12rpx;
  padding: 10rpx;
  flex-shrink: 0;
}

.avail-info {
  flex: 1;
}

.avail-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
}

.avail-desc {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-top: 4rpx;
}

.avail-tag {
  font-size: 22rpx;
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  flex-shrink: 0;
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
}

.alert-icon {
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.alert-text {
  font-size: 24rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.emergency-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(217, 59, 59, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  margin: 24rpx 0;
}

.emergency-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.emergency-text {
  font-size: 26rpx;
  color: var(--error);
  font-weight: 500;
  flex: 1;
}

.footer {
  padding: 24rpx 0;
}

.retry-btn {
  width: 100%;
  height: 96rpx;
  background: var(--surface);
  border: 2rpx solid var(--border);
  border-radius: 20rpx;
  font-size: 28rpx;
  color: var(--text-1);
}

.link-text {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: var(--primary);
  margin-top: 32rpx;
}
</style>
