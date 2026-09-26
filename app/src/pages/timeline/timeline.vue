<template>
  <view class="page">
    <view class="header">
      <text class="page-title">病程时间线</text>
      <text class="page-subtitle">按事件记录您的病程变化</text>
    </view>

    <view class="timeline">
      <view class="timeline-item" v-for="(item, idx) in timeline" :key="item.id">
        <view class="timeline-left">
          <view class="timeline-dot" :class="{ first: idx === 0 }"></view>
          <view class="timeline-line" v-if="idx < timeline.length - 1"></view>
        </view>
        <view class="timeline-right">
          <view class="timeline-card">
            <view class="card-header">
              <text class="card-type">{{ item.event_type }}</text>
              <text class="card-time">{{ formatDate(item.occurred_at) }}</text>
            </view>
            <text class="card-source">来源: {{ item.source_type }}</text>
            <text class="card-text">{{ item.raw_text || '暂无描述' }}</text>
            <view class="card-footer">
              <StatusTag
                :type="item.verify_status === '已确认' ? 'ok' : item.verify_status === '有冲突' ? 'error' : 'warn'"
                :label="item.verify_status"
              />
            </view>
            <view v-if="item.sit_minutes !== null && item.sit_minutes !== undefined" class="symptom-info">
              <text class="symptom-text">坐了 {{ item.sit_minutes }} 分钟</text>
              <text class="symptom-text" v-if="item.top_worry">担心: {{ item.top_worry }}</text>
              <text class="symptom-text">腿部变化: {{ item.leg_change || '尚未确认' }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="timeline.length === 0">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无病程记录</text>
        <button class="sub-btn" @click="goRecord">记录今天</button>
      </view>
    </view>
      <MainTabBar active-tab="timeline" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';
import { api } from '../../api/request';
import MainTabBar from '../../components/MainTabBar.vue';

const timeline = ref<any[]>([]);

function formatDate(iso: string) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function goRecord() {
  uni.navigateTo({ url: '/pages/today/today' });
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) return;
    const episodeId = episodes[0].id;
    timeline.value = await api.getTimeline(episodeId);
  } catch (e) {
    console.error('Failed to load timeline:', e);
  }
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
  display: block;
}

.page-subtitle {
  font-size: 24rpx;
  color: var(--text-2);
  margin-top: 12rpx;
  display: block;
}

.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  margin-bottom: 24rpx;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40rpx;
  margin-right: 24rpx;
}

.timeline-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;

  &.first {
    background: var(--ok);
  }
}

.timeline-line {
  flex: 1;
  width: 4rpx;
  background: var(--border);
  margin-top: 8rpx;
}

.timeline-right {
  flex: 1;
}

.timeline-card {
  background: var(--surface);
  border-radius: 20rpx;
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.card-type {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
}

.card-time {
  font-size: 20rpx;
  color: var(--text-3);
}

.card-source {
  font-size: 20rpx;
  color: var(--text-3);
  display: block;
  margin-bottom: 12rpx;
}

.card-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.5;
  display: block;
}

.card-footer {
  margin-top: 16rpx;
}

.symptom-info {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid var(--border);
}

.symptom-text {
  font-size: 22rpx;
  color: var(--text-2);
  display: block;
  margin-bottom: 8rpx;
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 26rpx;
  color: var(--text-3);
  display: block;
  margin-bottom: 24rpx;
}

.sub-btn {
  background: var(--primary-light);
  color: var(--primary);
  font-size: 24rpx;
  border-radius: 12rpx;
  border: none;
  padding: 12rpx 32rpx;
}
</style>
