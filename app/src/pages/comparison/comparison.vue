<template>
  <view class="page">
    <view class="header">
      <text class="page-title">原文对照</text>
      <text class="page-subtitle">解释与报告原文的对应关系</text>
    </view>

    <view class="card" v-if="analysis">
      <text class="card-title">分析解释</text>
      <view class="exp-list">
        <view class="exp-item" v-for="(exp, idx) in analysis.sections.explanation" :key="idx">
          <text class="exp-text">{{ exp.text }}</text>
          <view class="link-row">
            <text class="link-label">来源: {{ exp.source || '暂无' }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">报告原文</text>
      <scroll-view scroll-y class="raw-content">
        <text class="raw-text">{{ rawText || '暂无原文' }}</text>
      </scroll-view>
    </view>

    <view class="card" v-if="notMentioned.length > 0">
      <text class="card-title">报告未提及</text>
      <view class="unknown-list">
        <view class="unknown-item" v-for="item in notMentioned" :key="item">
          <text class="unknown-icon">?</text>
          <text class="unknown-text">{{ item }}</text>
        </view>
      </view>
      <text class="note">报告未提及不等于已排除</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api/request';

const analysis = ref<any>(null);
const rawText = ref('');
const notMentioned = ref<string[]>([]);

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) return;
    const episodeId = episodes[0].id;
    const task = await api.createAnalysis({ episodeId });
    analysis.value = await api.getAnalysis(task.taskId);

    const events = await api.getCareEvents(episodeId);
    if (events && events.length > 0) {
      rawText.value = events[0].raw_text || '';
    }

    if (analysis.value.sections.unknown) {
      notMentioned.value = analysis.value.sections.unknown;
    }
  } catch (e) {
    console.error('Failed to load comparison:', e);
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

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.exp-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.exp-item {
  padding: 20rpx;
  background: var(--bg);
  border-radius: 12rpx;
}

.exp-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  display: block;
}

.link-row {
  margin-top: 12rpx;
}

.link-label {
  font-size: 22rpx;
  color: var(--info);
}

.raw-content {
  max-height: 400rpx;
}

.raw-text {
  font-size: 24rpx;
  color: var(--text-2);
  line-height: 1.8;
}

.unknown-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
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
}

.unknown-text {
  font-size: 26rpx;
  color: var(--text-2);
}

.note {
  font-size: 20rpx;
  color: var(--warn);
  margin-top: 16rpx;
  display: block;
}
</style>
