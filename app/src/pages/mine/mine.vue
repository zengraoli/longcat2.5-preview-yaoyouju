<template>
  <view class="page">
    <view class="header">
      <text class="page-title">我的</text>
      <image src="/static/icons/ic_gear.png" class="gear-icon" />
    </view>

    <!-- 身份信息 -->
    <view class="card identity-card">
      <view class="avatar">U</view>
      <view class="identity-info">
        <text class="identity-phone">{{ maskedPhone }}（匿名内部标识 U-8F3K…，分析内容与身份信息分离存储）</text>
        <text class="identity-note">手机号仅用于登录与找回，不进入分析内容。</text>
      </view>
    </view>

    <!-- 数据与授权 -->
    <view class="card">
      <text class="card-section-title">数据与授权</text>

      <view class="menu-item" @click="goConsent">
        <view class="menu-left">
          <image src="/static/icons/ic_shield.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">我的同意记录</text>
            <text class="menu-desc">健康信息处理：已同意 {{ consentTime }} · 分享/产品改进：未开启</text>
          </view>
        </view>
        <view class="menu-right">
          <text class="tag-recall">可撤回</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="menu-item" @click="revokeHealth">
        <view class="menu-left">
          <image src="/static/icons/ic_close.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">撤回“处理健康信息”的同意</text>
            <text class="menu-desc">撤回后停止个性化分析，已审核科普与已导出摘要仍可用</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>

      <view class="menu-item" @click="exportData">
        <view class="menu-left">
          <image src="/static/icons/ic_download.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">导出我的全部数据</text>
            <text class="menu-desc">可读格式（PDF / JSON），包含病程、报告原文与分析版本</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>

      <view class="menu-item danger" @click="deleteData">
        <view class="menu-left">
          <image src="/static/icons/ic_trash.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">删除账户与数据</text>
            <text class="menu-desc">覆盖公开卡片、索引、向量、缓存与派生摘要</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 分享与社区 -->
    <view class="card">
      <text class="card-section-title">分享与社区</text>
      <view class="menu-item">
        <view class="menu-left">
          <image src="/static/icons/ic_person.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">案例投稿（二期）</text>
            <text class="menu-desc">单独授权 · 预览 · 去除第三方信息 · 人工审核 · 可撤回</text>
          </view>
        </view>
        <view class="menu-right">
          <text class="tag-muted">尚未开放</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 服务信息 -->
    <view class="card">
      <text class="card-section-title">服务信息</text>

      <view class="menu-item" @click="showBoundary">
        <view class="menu-left">
          <image src="/static/icons/ic_info.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">服务范围与不做的事</text>
            <text class="menu-desc">不作诊断、不给手术判断、不调整药物、不生成严重程度总分</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>

      <view class="menu-item" @click="goEmergency">
        <view class="menu-left">
          <image src="/static/icons/ic_warn.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title emergency-title">紧急就医提示</text>
            <text class="menu-desc">无需登录，网络异常时也可查看</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>

      <view class="menu-item" @click="showSources">
        <view class="menu-left">
          <image src="/static/icons/ic_doc.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">临床审定与来源说明</text>
            <text class="menu-desc">谁审核了内容、依据是什么、如何举报错误</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>

      <view class="menu-item" @click="showVersion">
        <view class="menu-left">
          <image src="/static/icons/ic_gear.png" class="menu-icon" />
          <view class="menu-text">
            <text class="menu-title">版本信息</text>
            <text class="menu-desc">App v0.1.0 · 分析模型 M-2609 · 内容库 2026-09</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <button class="logout-btn" @click="logout">退出登录</button>

    <view class="warn-alert">
      <image src="/static/icons/ic_warn.png" class="alert-icon" />
      <text class="alert-text">删除会覆盖公开卡片、搜索索引、向量和缓存和派生摘要；备份与依法需要保留的信息按政策管理，不承诺瞬时全网删除。</text>
    </view>

    <MainTabBar active-tab="mine" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MainTabBar from '../../components/MainTabBar.vue';
import { api, clearToken } from '../../api/request';

const maskedPhone = ref('138****1234');
const consentTime = ref('');

function goConsent() {
  uni.showToast({ title: '见上方“我的同意记录”', icon: 'none' });
}

async function revokeHealth() {
  uni.showModal({
    title: '撤回同意',
    content: '撤回后停止个性化分析，已审核科普与已导出摘要仍可用。确定撤回？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await api.revokeConsent('健康信息处理');
        uni.showToast({ title: '已撤回授权', icon: 'success' });
      } catch (e: any) {
        uni.showToast({ title: e.message, icon: 'none' });
      }
    },
  });
}

function exportData() {
  uni.showToast({ title: '数据导出为演示功能', icon: 'none' });
}

function deleteData() {
  uni.showModal({
    title: '确认删除',
    content: '此操作将删除你的所有数据，且不可恢复。确定继续吗？',
    confirmColor: '#D93B3B',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '演示环境未实际删除', icon: 'none' });
      }
    },
  });
}

function goEmergency() {
  uni.showModal({
    title: '紧急就医提示',
    content: '如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。',
    showCancel: false,
    confirmText: '我知道了',
  });
}

function showBoundary() {
  uni.showModal({
    title: '服务范围与不做的事',
    content: '本产品不作诊断、不给手术判断、不调整药物、不生成严重程度总分。',
    showCancel: false,
  });
}

function showSources() {
  uni.showModal({
    title: '临床审定与来源说明',
    content: '内容由临床审核人员审定；每条解释带来源与版本；错误可通过“反馈与举报”提交。',
    showCancel: false,
  });
}

function showVersion() {
  uni.showModal({
    title: '版本信息',
    content: 'App v0.1.0 · 分析模型 M-2609 · 内容库 2026-09',
    showCancel: false,
  });
}

function logout() {
  uni.showModal({
    title: '退出登录',
    content: '确定退出当前账户？',
    success: (res) => {
      if (res.confirm) {
        clearToken();
        uni.reLaunch({ url: '/pages/login/login' });
      }
    },
  });
}

onMounted(async () => {
  try {
    const list = await api.getConsent();
    const health = list.find((c: any) => c.scope === '健康信息处理' && c.granted);
    if (health?.grantedAt) consentTime.value = health.grantedAt.slice(0, 10);
  } catch (e) {
    console.error('Failed to load consent:', e);
  }
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 160rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 0 24rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-1);
}

.gear-icon {
  width: 40rpx;
  height: 40rpx;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.identity-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.identity-phone {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
}

.identity-note {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-top: 8rpx;
}

.card-section-title {
  font-size: 24rpx;
  color: var(--text-3);
  display: block;
  margin-bottom: 16rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid var(--border);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  flex: 1;
}

.menu-icon {
  width: 40rpx;
  height: 40rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.menu-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
}

.menu-item.danger .menu-title {
  color: var(--error);
}

.emergency-title {
  color: var(--error) !important;
}

.menu-desc {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-top: 6rpx;
  line-height: 1.5;
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.tag-recall {
  font-size: 20rpx;
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.tag-muted {
  font-size: 20rpx;
  color: var(--text-3);
  background: var(--bg);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.arrow {
  font-size: 32rpx;
  color: var(--text-3);
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  background: var(--surface);
  border: none;
  border-radius: 20rpx;
  font-size: 28rpx;
  color: var(--text-1);
  margin-bottom: 24rpx;
}

.warn-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(199, 119, 0, 0.08);
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
  color: var(--warn);
  line-height: 1.6;
  flex: 1;
}
</style>
