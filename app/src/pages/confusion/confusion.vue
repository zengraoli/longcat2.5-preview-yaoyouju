<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">你现在最想解决什么</text>
      </view>
      <text class="step-chip">第 2 / 4 步</text>
    </view>

    <text class="page-desc">选择一个最困扰你的问题（可稍后更改）。系统会按你的选择调整解释的重点、长度和形式。</text>

    <view class="option-list">
      <view
        v-for="opt in options"
        :key="opt.key"
        class="option-card"
        :class="{ selected: selected === opt.key }"
        @click="selected = opt.key"
      >
        <view class="option-icon-wrap">
          <image :src="opt.icon" class="option-icon" />
        </view>
        <view class="option-content">
          <text class="option-title">{{ opt.title }}</text>
          <text class="option-desc">{{ opt.desc }}</text>
        </view>
        <view class="radio" :class="{ checked: selected === opt.key }"></view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">希望的解释方式</text>
      <view class="chip-group">
        <view
          v-for="opt in ['简短要点', '详细说明', '带图示视频', '先看原文对照']"
          :key="opt"
          class="chip"
          :class="{ selected: styles.includes(opt) }"
          @click="toggleStyle(opt)"
        >{{ opt }}</view>
      </view>
      <text class="card-note">不会根据你的选择给你贴任何标签，也不会为了让你更安心而改写事实。</text>
    </view>

    <view class="footer">
      <button class="primary-btn" :disabled="!selected" @click="confirm">下一步</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../../api/request';

const options = [
  { key: 'terms', icon: '/static/icons/ic_doc.png', title: '报告术语', desc: '看懂报告里写的是什么、哪些结论不能得出' },
  { key: 'changes', icon: '/static/icons/ic_pulse.png', title: '病程变化', desc: '这段时间的变化意味着什么、哪些值得记录' },
  { key: 'followup', icon: '/static/icons/ic_calendar.png', title: '复诊准备', desc: '复诊时该问什么、带什么、怎么描述' },
  { key: 'life', icon: '/static/icons/ic_heart.png', title: '生活影响', desc: '日常活动、工作与睡眠要注意什么' },
];

const selected = ref('');
const styles = ref<string[]>([]);

function toggleStyle(opt: string) {
  const idx = styles.value.indexOf(opt);
  if (idx >= 0) styles.value.splice(idx, 1);
  else styles.value.push(opt);
}

function goBack() {
  uni.navigateBack();
}

async function confirm() {
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (episodeId) {
      await api.createCareEvent({
        episodeId,
        eventType: '主要困惑',
        occurredAt: new Date().toISOString(),
        sourceType: '自述',
        rawText: `主要困惑：${options.find((o) => o.key === selected.value)?.title || ''}；解释方式：${styles.value.join('、') || '未选择'}`,
        verifyStatus: '已确认',
      });
    }
  } catch (e) {
    console.error('Failed to save confusion:', e);
  }
  uni.navigateTo({ url: '/pages/report/report' });
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.step-chip {
  font-size: 22rpx;
  color: var(--text-3);
  background: var(--bg);
  border-radius: 16rpx;
  padding: 8rpx 20rpx;
}

.page-desc {
  font-size: 26rpx;
  color: var(--text-2);
  line-height: 1.6;
  display: block;
  margin-bottom: 24rpx;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: var(--surface);
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  padding: 28rpx;
}

.option-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.option-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-icon {
  width: 40rpx;
  height: 40rpx;
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
  font-size: 24rpx;
  color: var(--text-2);
  display: block;
  margin-top: 6rpx;
}

.radio {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid var(--border);
  flex-shrink: 0;
}

.radio.checked {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: inset 0 0 0 6rpx var(--primary-light);
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
  display: block;
  margin-bottom: 24rpx;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.chip {
  padding: 16rpx 40rpx;
  background: var(--bg);
  border-radius: 24rpx;
  font-size: 26rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.chip.selected {
  background: var(--primary);
  color: #fff;
}

.card-note {
  font-size: 24rpx;
  color: var(--text-2);
  line-height: 1.6;
  display: block;
  margin-top: 24rpx;
}

.footer {
  padding: 24rpx 0 48rpx;
}
</style>
