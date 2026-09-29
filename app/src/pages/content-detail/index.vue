<template>
  <view class="detail">
    <view class="detail__header">
      <text class="detail__back" @click="goBack">‹</text>
      <text class="detail__title">审核视频</text>
      <text class="detail__share">↑</text>
    </view>

    <!-- 视频占位 -->
    <view class="detail__player">
      <view class="detail__play-btn">
        <text class="detail__play-icon">▶</text>
      </view>
      <text class="detail__player-caption">示意动画：L5/S1 节段位置（非本人影像）</text>
      <view class="detail__progress">
        <text class="detail__time">0:00 / 2:10</text>
        <view class="detail__progress-bar">
          <view class="detail__progress-fill" />
        </view>
        <text class="detail__cc">CC 开</text>
      </view>
    </view>

    <view class="detail__body">
      <text class="detail__title-main">腰椎节段位置：L5/S1 在哪里</text>
      <view class="detail__meta">
        <StatusTag label="已审核 v2" />
        <text class="detail__meta-text">临床审定 · 2026-08</text>
      </view>
      <view class="detail__meta">
        <text class="detail__meta-tag">依据：指南 G-03 · 科普 #12</text>
        <text class="detail__meta-tag detail__meta-tag--info">字幕 · 文字替代</text>
      </view>

      <TipBar type="info">
        为什么推荐给你：你的报告（2026-08-30）提到 L5/S1。示意图不是你的真实病变，不能据此判断本人病因。
      </TipBar>

      <!-- 适用范围 -->
      <view class="card">
        <text class="card-title">适用范围</text>
        <view class="detail__scope-row">
          <text class="detail__scope-label">适用</text>
          <text class="detail__scope-text">想了解报告中“L5/S1”“节段”等术语的含义</text>
        </view>
        <view class="detail__scope-row">
          <text class="detail__scope-label">不适用</text>
          <text class="detail__scope-text">判断自己的突出程度、是否需要手术、康复动作选择</text>
        </view>
      </view>

      <!-- 文字替代 -->
      <view class="card">
        <text class="card-title">文字替代（全文）</text>
        <text class="detail__transcript">
          脊柱由一节节椎骨组成，腰椎有 5 节，从上到下叫 L1 到 L5；L5 下面是骶骨 S1。两节骨头之间的软垫叫椎间盘，“L5/S1”就是第 5 腰椎和第 1 骶椎之间的那个椎间盘……
        </text>
      </view>

      <!-- 复述任务 -->
      <view class="card detail__retell">
        <text class="card-title">看完后，用一句话说说你理解了什么（可选）</text>
        <text class="detail__retell-desc">
          这用来检查视频有没有造成新的误解，不是考试，也不会影响你的分析结果。
        </text>
        <textarea
          v-model="retell"
          class="detail__textarea"
          placeholder="例如：L5/S1 是腰椎最下面那个椎间盘的位置…"
          placeholder-class="detail__placeholder"
          :maxlength="500"
        />
        <AppButton type="primary" @click="onSubmitRetell">提交</AppButton>
      </view>

      <!-- 反馈 -->
      <view class="card">
        <text class="card-title">这条内容对你有帮助吗？</text>
        <view class="detail__feedback">
          <AppChip v-for="opt in feedbackOptions" :key="opt" @click="onFeedback(opt)">
            {{ opt }}
          </AppChip>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';

const retell = ref('');
const feedbackOptions = ['看懂了', '没看懂', '内容有误（举报）'];

function goBack() {
  uni.navigateBack();
}

function onSubmitRetell() {
  if (!retell.value.trim()) {
    uni.showToast({ title: '请先填写你的理解', icon: 'none' });
    return;
  }
  uni.showToast({ title: '已提交，感谢检验', icon: 'success' });
  retell.value = '';
}

function onFeedback(opt: string) {
  uni.showToast({ title: '感谢反馈', icon: 'success' });
}
</script>

<style scoped>
.detail {
  min-height: 100vh;
  padding-bottom: 32px;
}
.detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}
.detail__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.detail__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.detail__share { font-size: 20px; color: var(--text-2); }
.detail__player {
  background: #1B2230;
  padding: 48px 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.detail__play-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.detail__play-icon { color: var(--primary); font-size: 24px; }
.detail__player-caption {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 16px;
}
.detail__progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail__time {
  font-size: 11px;
  color: var(--text-3);
}
.detail__progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.detail__progress-fill {
  width: 0;
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
}
.detail__cc {
  font-size: 11px;
  color: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  padding: 0 6px;
}
.detail__body {
  padding: 16px;
}
.detail__title-main {
  font-size: 17px;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}
.detail__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.detail__meta-text {
  font-size: 12px;
  color: var(--text-2);
}
.detail__meta-tag {
  font-size: 11px;
  color: var(--text-2);
  background: var(--bg);
  padding: 1px 8px;
  border-radius: 4px;
}
.detail__meta-tag--info {
  color: var(--info);
  background: rgba(47, 111, 216, 0.1);
}
.detail__scope-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.detail__scope-label {
  font-size: 14px;
  color: var(--text-2);
  width: 48px;
  flex-shrink: 0;
}
.detail__scope-text {
  font-size: 14px;
  flex: 1;
  line-height: 1.5;
}
.detail__transcript {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-1);
  display: block;
}
.detail__retell {
  background: var(--primary-light);
}
.detail__retell-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-bottom: 12px;
  line-height: 1.5;
}
.detail__textarea {
  width: 100%;
  min-height: 80px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.detail__placeholder {
  color: var(--text-3);
}
.detail__feedback {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
