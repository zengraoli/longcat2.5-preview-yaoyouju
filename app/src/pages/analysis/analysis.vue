<template>
  <view class="page">
    <view class="header">
      <text class="page-title">一页理性分析</text>
      <text class="page-subtitle">基于您的报告证据生成，不作诊断</text>
    </view>

    <view v-if="loading" class="state-card">
      <text class="state-icon">⏳</text>
      <text class="state-text">正在生成分析，请稍候...</text>
      <text class="state-hint">系统正在检索医学证据并生成分析结果</text>
    </view>

    <view v-else-if="failed" class="state-card error">
      <text class="state-icon">⚠️</text>
      <text class="state-text">分析生成失败</text>
      <text class="state-hint">{{ errorMsg }}</text>
      <button class="retry-btn" @click="loadAnalysis">重新生成</button>
    </view>

    <view v-else-if="analysis" class="analysis-content">
      <view class="section-card">
        <text class="section-title">已知</text>
        <view class="known-list">
          <view class="known-item" v-for="item in analysis.sections.known" :key="item">
            <text class="known-dot"></text>
            <text class="known-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">解释</text>
        <view class="explanation-item" v-for="(exp, idx) in analysis.sections.explanation" :key="idx">
          <text class="exp-text">{{ exp.text }}</text>
          <view class="source-link" @click="showSource(exp)">
            <text class="source-text">查看来源</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">未知</text>
        <view class="unknown-list">
          <view class="unknown-item" v-for="item in analysis.sections.unknown" :key="item">
            <text class="unknown-icon">?</text>
            <text class="unknown-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">下一步建议</text>
        <view class="next-list">
          <view class="next-item" v-for="(item, idx) in analysis.sections.nextSteps" :key="idx">
            <text class="num">{{ idx + 1 }}</text>
            <text class="next-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="meta-card">
        <text class="meta-text">模型版本: v{{ analysis.version }}</text>
        <text class="meta-text">生成时间: {{ formatTime(analysis.createdAt) }}</text>
        <text class="meta-disclaimer">本分析由 AI 辅助生成，不构成医疗诊断</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api/request';

const loading = ref(true);
const failed = ref(false);
const errorMsg = ref('');
const analysis = ref<any>(null);

function formatTime(iso: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function showSource(exp: any) {
  uni.showModal({
    title: '来源',
    content: exp.source || '暂无来源信息',
    showCancel: false,
  });
}

async function loadAnalysis() {
  loading.value = true;
  failed.value = false;
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) {
      failed.value = true;
      errorMsg.value = '暂无病程数据';
      return;
    }
    const episodeId = episodes[0].id;
    const task = await api.createAnalysis({ episodeId });
    if (task.safetyMessage) {
      failed.value = true;
      errorMsg.value = task.safetyMessage;
      return;
    }
    analysis.value = await api.getAnalysis(task.taskId);
  } catch (e: any) {
    failed.value = true;
    errorMsg.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAnalysis();
});
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

.state-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 80rpx 32rpx;
  text-align: center;

  &.error {
    border-left: 8rpx solid var(--error);
  }
}

.state-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 24rpx;
}

.state-text {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
}

.state-hint {
  font-size: 24rpx;
  color: var(--text-2);
  margin-top: 12rpx;
  display: block;
}

.retry-btn {
  margin-top: 32rpx;
  background: var(--primary);
  color: #fff;
  font-size: 26rpx;
  border-radius: 16rpx;
  border: none;
  padding: 16rpx 48rpx;
}

.section-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.known-list, .unknown-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.known-item {
  display: flex;
  align-items: center;
}

.known-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--ok);
  margin-right: 16rpx;
}

.known-text {
  font-size: 26rpx;
  color: var(--text-1);
}

.explanation-item {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.exp-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  display: block;
}

.source-link {
  margin-top: 12rpx;
}

.source-text {
  font-size: 22rpx;
  color: var(--info);
}

.unknown-item {
  display: flex;
  align-items: center;
}

.unknown-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: var(--warn);
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.unknown-text {
  font-size: 26rpx;
  color: var(--text-2);
}

.next-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.next-item {
  display: flex;
  align-items: flex-start;
}

.num {
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

.next-text {
  font-size: 26rpx;
  color: var(--text-1);
  flex: 1;
}

.meta-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 24rpx;
}

.meta-text {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-bottom: 8rpx;
}

.meta-disclaimer {
  font-size: 20rpx;
  color: var(--warn);
  margin-top: 12rpx;
  display: block;
}
</style>
