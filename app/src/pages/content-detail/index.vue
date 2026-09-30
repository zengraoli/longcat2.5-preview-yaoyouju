<template>
  <view class="detail">
    <view class="detail__header">
      <text class="detail__back" @click="goBack">‹</text>
      <text class="detail__title">{{ content?.title || '内容详情' }}</text>
      <text class="detail__share">↑</text>
    </view>

    <!-- 视频占位 -->
    <view class="detail__player">
      <view class="detail__play-btn">
        <text class="detail__play-icon">▶</text>
      </view>
      <text class="detail__player-caption">示意动画（非本人影像）</text>
      <view class="detail__progress">
        <text class="detail__time">0:00 / 2:10</text>
        <view class="detail__progress-bar">
          <view class="detail__progress-fill" />
        </view>
        <text class="detail__cc">CC 开</text>
      </view>
    </view>

    <view class="detail__body">
      <view class="detail__meta">
        <StatusTag label="已审核" />
        <text class="detail__meta-text">临床审定{{ content?.publishedAt ? ' · ' + content.publishedAt.slice(0, 7) : '' }}</text>
      </view>
      <view class="detail__meta">
        <text class="detail__meta-tag">字幕 · 文字替代</text>
      </view>

      <TipBar type="info">
        为什么推荐给你：你的报告或病程中提到了相关内容。示意图不是你的真实病变，不能据此判断本人病因。
      </TipBar>

      <!-- 适用范围 -->
      <view class="card">
        <text class="card-title">适用范围</text>
        <view class="detail__scope-row">
          <text class="detail__scope-label">适用</text>
          <text class="detail__scope-text">{{ content?.applicableScope || '所有用户' }}</text>
        </view>
        <view class="detail__scope-row">
          <text class="detail__scope-label">不适用</text>
          <text class="detail__scope-text">{{ content?.notApplicable || '无' }}</text>
        </view>
      </view>

      <!-- 文字替代 -->
      <view class="card">
        <text class="card-title">文字替代（全文）</text>
        <text class="detail__transcript">{{ content?.subtitleText || content?.script || '暂无文字替代' }}</text>
      </view>

      <!-- 审核记录 -->
      <view class="card" v-if="content && content.reviews.length > 0">
        <text class="card-title">审核记录</text>
        <view v-for="(r, i) in content.reviews" :key="i" class="detail__review">
          <text class="detail__review-decision">{{ r.decision }}</text>
          <text class="detail__review-meta">{{ r.reviewerName || '审核人' }} · {{ r.reviewedAt.slice(0, 10) }}</text>
          <text class="detail__review-comment">{{ r.comment }}</text>
        </view>
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
import { ref, onMounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import { getContentDetail, listEpisodes, addEvent, type ContentDetail } from '@/api';

const pages = getCurrentPages();
const currentPage = pages[pages.length - 1] as { options?: Record<string, string> };
const contentId = currentPage?.options?.id ?? '';

const content = ref<ContentDetail | null>(null);
const retell = ref('');
const feedbackOptions = ['看懂了', '没看懂', '内容有误（举报）'];

function goBack() {
  uni.navigateBack();
}

async function onSubmitRetell() {
  if (!retell.value.trim()) {
    uni.showToast({ title: '请先填写你的理解', icon: 'none' });
    return;
  }
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) {
      uni.showToast({ title: '请先建立病程', icon: 'none' });
      return;
    }
    // 复述提交到病程（行动事件），用于检验理解
    await addEvent(episodes[0].id, {
      eventType: '行动',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: `内容复述（${content.value?.title ?? ''}）：${retell.value}`,
    });
    uni.showToast({ title: '已提交，感谢检验', icon: 'success' });
    retell.value = '';
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function onFeedback(opt: string) {
  if (opt === '内容有误（举报）') {
    uni.showModal({
      title: '举报内容错误',
      content: '请前往“反馈与举报”页提交详细描述（会自动附带版本信息）。',
      showCancel: false,
    });
    return;
  }
  uni.showToast({ title: '感谢反馈', icon: 'success' });
}

onMounted(async () => {
  if (!contentId) return;
  try {
    content.value = await getContentDetail(contentId);
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
});
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
.detail__review {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.detail__review:last-child {
  border-bottom: none;
}
.detail__review-decision {
  font-size: 13px;
  color: var(--ok);
  display: block;
}
.detail__review-meta {
  font-size: 12px;
  color: var(--text-3);
  display: block;
  margin-top: 2px;
}
.detail__review-comment {
  font-size: 13px;
  color: var(--text-2);
  display: block;
  margin-top: 4px;
  line-height: 1.5;
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
  box-sizing: border-box;
}
.detail__placeholder {
  color: var(--text-3);
}
.detail__feedback {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
  display: block;
}
</style>
