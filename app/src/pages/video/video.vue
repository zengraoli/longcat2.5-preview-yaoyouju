<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">审核视频</text>
      </view>
      <image src="/static/icons/ic_share.png" class="action-icon" />
    </view>

    <!-- 视频播放区 -->
    <view class="player">
      <view class="player-screen">
        <view class="play-circle" @click="playing = !playing">
          <image src="/static/icons/ic_play.png" class="play-icon" v-if="!playing" />
          <text class="pause-text" v-else>暂停</text>
        </view>
        <text class="player-caption">示意动画：L5/S1 节段位置（非本人影像）</text>
      </view>
      <view class="player-progress">
        <text class="time-text">0:00 / 2:10</text>
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: playing ? '30%' : '0%' }"></view>
        </view>
        <text class="cc-tag">CC 开</text>
      </view>
    </view>

    <view class="info-card">
      <text class="video-title">{{ content.title || '腰椎节段位置：L5/S1 在哪里' }}</text>
      <view class="tag-row">
        <text class="src-tag tag-ok">已审核 v2</text>
        <text class="src-tag tag-muted">临床审定 · 2026-08</text>
      </view>
      <text class="basis-text">依据：指南 G-03 · 科普 #12</text>
      <view class="tag-row">
        <text class="src-tag tag-info">字幕</text>
        <text class="src-tag tag-info">文字替代</text>
      </view>
    </view>

    <view class="card reason-card">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="reason-text">{{ reasonText }}</text>
    </view>

    <view class="card">
      <text class="card-title">适用范围</text>
      <view class="scope-row">
        <text class="scope-label">适用</text>
        <text class="scope-value">{{ content.applicable_scope || '想了解报告中“L5/S1”“节段”等术语的含义' }}</text>
      </view>
      <view class="scope-row">
        <text class="scope-label">不适用</text>
        <text class="scope-value">{{ content.not_applicable || '判断自己的突出程度、是否需要手术、康复动作选择' }}</text>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">文字替代（全文）</text>
        <text class="collapse-btn" @click="subtitleOpen = !subtitleOpen">{{ subtitleOpen ? '收起' : '展开' }}</text>
      </view>
      <text class="subtitle-text" v-if="subtitleOpen">{{ subtitleText }}</text>
    </view>

    <view class="card retell-card">
      <text class="card-title">看完后，用一句话说说你理解了了什么（可选）</text>
      <text class="card-note">这用来检查视频有没有造成新的误解，不是考试，也不会影响你的分析结果。</text>
      <input class="input" v-model="retell" placeholder="例如：L5/S1 是腰椎最下面那个椎间盘的位置…" placeholder-class="placeholder" />
      <button class="primary-btn small" @click="submitRetell">提交</button>
    </view>

    <view class="card">
      <text class="card-title">这条内容对你有帮助吗？</text>
      <view class="chip-group">
        <view
          v-for="opt in ['看懂了', '没看懂', '内容有误（举报）']"
          :key="opt"
          class="chip"
          :class="{ selected: feedback === opt }"
          @click="feedback = opt"
        >{{ opt }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api/request';

const pages = getCurrentPages();
const cur = pages[pages.length - 1] as any;
const queryId = cur?.options?.id || '';
const queryTitle = cur?.options?.title || '';

const content = ref<any>({});
const reasonText = ref('为什么推荐给你：你的报告中提到了与该内容相关的术语。示意图不是你的真实病变，不能据此判断本人病因。');
const playing = ref(false);
const subtitleOpen = ref(true);
const retell = ref('');
const feedback = ref('');

const subtitleText = ref(
  '脊柱由一节节椎骨组成，腰椎有 5 节，从上到下叫 L1 到 L5；L5 下面是骶骨 S1。两节骨头之间的软骨叫椎间盘，“L5/S1”就是第 5 腰椎和第 1 骶椎之间的那个椎间盘……'
);

function goBack() {
  uni.navigateBack();
}

function submitRetell() {
  if (!retell.value.trim()) {
    uni.showToast({ title: '请填写复述内容', icon: 'none' });
    return;
  }
  uni.showToast({ title: '已提交，谢谢反馈', icon: 'success' });
  retell.value = '';
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      const reports = await api.getReportsByEpisode(episodes[0].id);
      if (reports && reports.length > 0) {
        reasonText.value = `为什么推荐给你：你的报告（${reports[0].report_date}）提到了与该内容相关的术语。示意图不是你的真实病变，不能据此判断本人病因。`;
      }
    }
  } catch (e) {
    console.error('Failed to load report context:', e);
  }
  try {
    // 内容详情从已发布列表读取（/contents/:id 仅后台可访问）
    const list = await api.getPublishedContents();
    const found = queryId ? list.find((c: any) => c.id === queryId) : list[0];
    if (found) {
      content.value = found;
      content.value.title = queryTitle || found.title;
    } else {
      content.value = {};
    }
  } catch (e) {
    console.error('Failed to load content detail:', e);
  }
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 48rpx;
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

.action-icon {
  width: 36rpx;
  height: 36rpx;
}

.player {
  background: #2B3440;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.player-screen {
  height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.play-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon {
  width: 44rpx;
  height: 44rpx;
  background: var(--primary);
  border-radius: 8rpx;
  padding: 8rpx;
  margin-left: 6rpx;
}

.pause-text {
  color: var(--primary);
  font-size: 24rpx;
  font-weight: 500;
}

.player-caption {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.player-progress {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
}

.time-text {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.progress-track {
  flex: 1;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3rpx;
}

.progress-fill {
  height: 100%;
  background: var(--surface);
  border-radius: 3rpx;
}

.cc-tag {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(255, 255, 255, 0.4);
  border-radius: 8rpx;
  padding: 2rpx 10rpx;
  flex-shrink: 0;
}

.info-card {
  padding: 8rpx 0 24rpx;
}

.video-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-1);
  display: block;
  margin-bottom: 12rpx;
}

.basis-text {
  font-size: 24rpx;
  color: var(--text-2);
  display: block;
  margin: 10rpx 0;
}

.tag-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.src-tag {
  font-size: 20rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.tag-ok {
  background: rgba(30, 158, 90, 0.1);
  color: var(--ok);
}

.tag-muted {
  background: var(--bg);
  color: var(--text-3);
}

.tag-info {
  background: rgba(47, 111, 216, 0.08);
  color: var(--info);
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
  margin-bottom: 20rpx;
}

.card-note {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin: -8rpx 0 16rpx;
}

.reason-card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: var(--primary-light);
}

.alert-icon {
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.reason-text {
  font-size: 24rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.scope-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.scope-row:last-child {
  margin-bottom: 0;
}

.scope-label {
  font-size: 24rpx;
  color: var(--text-2);
  width: 96rpx;
  flex-shrink: 0;
}

.scope-value {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.card-head .card-title {
  margin-bottom: 0;
}

.collapse-btn {
  font-size: 24rpx;
  color: var(--text-3);
}

.subtitle-text {
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--text-1);
}

.retell-card {
  background: var(--primary-light);
}

.input {
  width: 100%;
  height: 88rpx;
  background: var(--surface);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
  box-sizing: border-box;
  margin-bottom: 20rpx;
}

.primary-btn.small {
  padding: 0 40rpx;
  height: 72rpx;
  font-size: 26rpx;
  border-radius: 12rpx;
  align-self: flex-start;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  padding: 14rpx 32rpx;
  background: var(--bg);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.chip.selected {
  background: var(--surface);
  border-color: var(--border);
}
</style>
