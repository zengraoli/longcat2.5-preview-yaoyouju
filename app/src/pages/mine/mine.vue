<template>
  <view class="page">
    <view class="header">
      <text class="page-title">我的</text>
    </view>

    <view class="card">
      <text class="card-title">同意记录</text>
      <view class="consent-list">
        <view class="consent-item" v-for="item in consentList" :key="item.scope">
          <view class="consent-info">
            <text class="consent-scope">{{ item.scope }}</text>
            <text class="consent-status">{{ item.granted ? '已授权' : '未授权' }}</text>
          </view>
          <button
            v-if="item.granted"
            class="revoke-btn"
            @click="revokeConsent(item.scope)"
          >
            撤回
          </button>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">数据管理</text>
      <view class="action-item" @click="exportData">
        <text class="action-label">导出我的数据</text>
        <text class="action-arrow">></text>
      </view>
      <view class="action-item danger" @click="deleteData">
        <text class="action-label">删除所有数据</text>
        <text class="action-arrow">></text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">服务边界</text>
      <text class="boundary-text">本产品不作诊断，不提供用药或手术建议。分析结果仅供参考，不能替代专业医疗意见。</text>
    </view>

    <view class="card">
      <text class="card-title">反馈与举报</text>
      <view class="action-item" @click="goFeedback">
        <text class="action-label">提交反馈或举报错误</text>
        <text class="action-arrow">></text>
      </view>
    </view>
      <MainTabBar active-tab="mine" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api/request';
import MainTabBar from '../../components/MainTabBar.vue';

const consentList = ref<any[]>([]);

function exportData() {
  uni.showToast({ title: '数据导出功能开发中', icon: 'none' });
}

function deleteData() {
  uni.showModal({
    title: '确认删除',
    content: '此操作将删除您的所有数据，且不可恢复。确定继续吗？',
    confirmColor: '#D93B3B',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '数据已删除', icon: 'success' });
      }
    },
  });
}

function goFeedback() {
  uni.navigateTo({ url: '/pages/feedback/feedback' });
}

async function revokeConsent(scope: string) {
  try {
    await api.revokeConsent(scope);
    uni.showToast({ title: '已撤回授权', icon: 'success' });
    loadConsent();
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
}

async function loadConsent() {
  try {
    consentList.value = await api.getConsent();
  } catch (e) {
    console.error('Failed to load consent:', e);
  }
}

onMounted(() => {
  loadConsent();
});
</script>

<style lang="scss" scoped>
.page { padding-bottom: 160rpx;
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
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.consent-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.consent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: var(--bg);
  border-radius: 12rpx;
}

.consent-info {
  flex: 1;
}

.consent-scope {
  font-size: 26rpx;
  color: var(--text-1);
  display: block;
}

.consent-status {
  font-size: 20rpx;
  color: var(--text-3);
  margin-top: 4rpx;
  display: block;
}

.revoke-btn {
  background: transparent;
  color: var(--error);
  font-size: 24rpx;
  border: 2rpx solid var(--error);
  border-radius: 12rpx;
  padding: 8rpx 24rpx;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);

  &:last-child {
    border-bottom: none;
  }

  &.danger .action-label {
    color: var(--error);
  }
}

.action-label {
  font-size: 26rpx;
  color: var(--text-1);
}

.action-arrow {
  font-size: 28rpx;
  color: var(--text-3);
}

.boundary-text {
  font-size: 24rpx;
  color: var(--text-2);
  line-height: 1.6;
}
</style>
