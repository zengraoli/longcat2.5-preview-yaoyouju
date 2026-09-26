<template>
  <view class="qa-page">
    <view class="context-bar">
      <image src="/static/icons/ic_shield.png" class="context-icon" />
      <text class="context-text">本轮基于：{{ contextBasis }}。出现新变化请先更新“当前情况”。</text>
    </view>

    <scroll-view scroll-y class="messages" :scroll-top="scrollTop">
      <view class="msg-row user" v-for="(m, i) in userMessages" :key="'u' + i">
        <view class="bubble user-bubble">{{ m }}</view>
      </view>

      <view class="msg-row assistant" v-for="(m, i) in assistantMessages" :key="'a' + i">
        <view class="avatar">腰</view>
        <view class="bubble assistant-bubble">
          <text class="msg-text">{{ m.content }}</text>
          <view class="source-chips" v-if="m.source">
            <text class="src-chip src-ok">来源：{{ m.source }}</text>
            <text class="src-chip src-info">报告原文</text>
          </view>
          <view class="add-followup" v-if="m.outOfScope" @click="addFollowup(m)">
            ＋ 把“{{ m.shortQuestion }}”加入复诊问题
          </view>
          <text class="added-text" v-else-if="m.added">＋ 已加入复诊问题：{{ m.shortQuestion }}</text>
        </view>
      </view>

      <view class="stability-bar" v-if="explainedCount >= 2">
        <image src="/static/icons/ic_info.png" class="stability-icon" />
        <text class="stability-text">本轮已解释 {{ explainedCount }} 个问题，行动计划已记录。若没有新信息，反复确认不会得到不同答案；出现新变化时我会重新评估。</text>
      </view>
    </scroll-view>

    <view class="input-area">
      <view class="quick-questions">
        <text class="qq-label">快捷问题：</text>
        <view class="qq-list">
          <view class="qq-item" v-for="q in quickQuestions" :key="q" @click="askQuestion(q)">
            {{ q }}
          </view>
        </view>
      </view>
      <view class="input-row">
        <input
          class="chat-input"
          v-model="question"
          placeholder="输入你的问题…"
          placeholder-class="placeholder"
          :maxlength="200"
          @confirm="sendQuestion"
        />
        <view class="send-btn" :class="{ disabled: !question.trim() }" @click="sendQuestion">
          <image src="/static/icons/ic_send.png" class="send-icon" />
        </view>
      </view>
    </view>

    <MainTabBar active-tab="qa" />
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import MainTabBar from '../../components/MainTabBar.vue';
import { api } from '../../api/request';

interface AssistantMsg {
  content: string;
  source?: string;
  outOfScope?: boolean;
  shortQuestion?: string;
  added?: boolean;
}

const assistantMessages = ref<AssistantMsg[]>([]);
const userMessages = ref<string[]>([]);
const question = ref('');
const scrollTop = ref(0);
const episodeId = ref('');
const explainedCount = ref(0);

const quickQuestions = ['复诊时该怎么描述？', '哪些变化要提前就医？', '保守治疗一般多久？'];

const contextBasis = ref('当前情况 + 最近一次检查报告');

function scrollToBottom() {
  nextTick(() => {
    scrollTop.value = assistantMessages.value.length * 1000 + userMessages.value.length * 1000;
  });
}

function addFollowup(m: AssistantMsg) {
  if (m.shortQuestion && !m.added) {
    m.added = true;
    uni.showToast({ title: '已加入复诊问题清单', icon: 'success' });
  }
}

async function askQuestion(q: string) {
  const text = q.trim();
  if (!text) return;
  question.value = '';
  userMessages.value.push(text);
  scrollToBottom();
  try {
    const res = await api.askQuestion({ question: text, episodeId: episodeId.value || undefined });
    if (res.outOfScope) {
      assistantMessages.value.push({
        content: res.message || '该问题涉及诊断、手术或用药建议，超出服务范围。建议您将此问题加入复诊清单，咨询医生。',
        outOfScope: true,
        shortQuestion: text.length > 12 ? text.slice(0, 12) + '…' : text,
      });
    } else {
      assistantMessages.value.push({ content: res.answer, source: res.source });
      explainedCount.value++;
      if (res.isReassurance) explainedCount.value = Math.max(explainedCount.value, 2);
    }
  } catch (e: any) {
    assistantMessages.value.push({ content: e.message || '回答失败，请稍后重试。' });
  }
  scrollToBottom();
}

function sendQuestion() {
  askQuestion(question.value);
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      episodeId.value = episodes[0].id;
      const latest = await api.getLatestAnalysis(episodes[0].id);
      if (latest.status === 'ok') {
        contextBasis.value = `${latest.createdAt.slice(0, 10)} 当前情况 + 最近报告`;
      }
    }
  } catch (e) {
    console.error('Failed to load qa context:', e);
  }
});
</script>

<style lang="scss" scoped>
.qa-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 160rpx;
  display: flex;
  flex-direction: column;
}

.context-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--surface);
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  margin: 24rpx 0;
}

.context-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.context-text {
  font-size: 24rpx;
  color: var(--text-2);
  line-height: 1.5;
  flex: 1;
}

.messages {
  flex: 1;
  min-height: 400rpx;
}

.msg-row {
  display: flex;
  margin-bottom: 24rpx;
}

.msg-row.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 78%;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
}

.user-bubble {
  background: var(--primary);
  color: #fff;
  font-size: 26rpx;
  line-height: 1.6;
  border-bottom-right-radius: 8rpx;
}

.msg-row.assistant {
  align-items: flex-start;
}

.avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 16rpx;
}

.assistant-bubble {
  background: var(--surface);
  border-bottom-left-radius: 8rpx;
  flex: 1;
}

.msg-text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--text-1);
  display: block;
}

.source-chips {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.src-chip {
  font-size: 20rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.src-ok {
  background: rgba(30, 158, 90, 0.1);
  color: var(--ok);
}

.src-info {
  background: rgba(47, 111, 216, 0.08);
  color: var(--info);
}

.add-followup {
  font-size: 24rpx;
  color: var(--primary);
  margin-top: 16rpx;
}

.added-text {
  font-size: 24rpx;
  color: var(--primary);
  display: block;
  margin-top: 16rpx;
}

.stability-bar {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(199, 119, 0, 0.08);
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
}

.stability-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.stability-text {
  font-size: 24rpx;
  color: var(--warn);
  line-height: 1.6;
  flex: 1;
}

.input-area {
  background: var(--surface);
  border-top: 2rpx solid var(--border);
  padding: 16rpx 0 24rpx;
  margin-top: 16rpx;
}

.quick-questions {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.qq-label {
  font-size: 22rpx;
  color: var(--text-3);
  flex-shrink: 0;
  margin-top: 12rpx;
}

.qq-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.qq-item {
  padding: 12rpx 24rpx;
  background: var(--bg);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.qq-item:active {
  border-color: var(--primary);
  color: var(--primary);
}

.input-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.chat-input {
  flex: 1;
  height: 80rpx;
  background: var(--bg);
  border-radius: 40rpx;
  padding: 0 32rpx;
  font-size: 26rpx;
  color: var(--text-1);
}

.send-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn.disabled {
  opacity: 0.5;
}

.send-icon {
  width: 32rpx;
  height: 32rpx;
}
</style>
