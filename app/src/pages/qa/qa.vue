<template>
  <view class="qa-page">
    <view class="chat-area">
      <scroll-view scroll-y :scroll-top="scrollTop" class="messages">
        <view class="message-row" v-for="(msg, idx) in messages" :key="idx">
          <view class="message-bubble" :class="msg.role">
            <text class="msg-text">{{ msg.content }}</text>
            <view class="msg-source" v-if="msg.source && msg.role === 'assistant'">
              <text class="src-label">来源: {{ msg.source }}</text>
            </view>
          </view>
        </view>

        <view class="out-of-scope-card" v-if="outOfScopeMsg">
          <text class="oos-icon">⚠️</text>
          <text class="oos-text">{{ outOfScopeMsg }}</text>
        </view>
      </scroll-view>
    </view>

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
          v-model="question"
          class="chat-input"
          placeholder="输入您的问题..."
          placeholder-class="placeholder"
          @confirm="sendQuestion"
          :maxlength="200"
        />
        <button class="send-btn" :disabled="!question.trim()" @click="sendQuestion">发送</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { api } from '../../api/request';

const messages = ref<{ role: string; content: string; source?: string }[]>([]);
const question = ref('');
const scrollTop = ref(0);
const outOfScopeMsg = ref('');
const quickQuestions = ['复诊时该怎么描述？', '哪些变化要提前就医？', '保守治疗一般多久？'];

function scrollToBottom() {
  nextTick(() => {
    scrollTop.value += 1000;
  });
}

async function askQuestion(q: string) {
  if (!q.trim()) return;
  outOfScopeMsg.value = '';
  messages.value.push({ role: 'user', content: q });
  question.value = '';
  scrollToBottom();

  try {
    const res = await api.askQuestion({ question: q });
    if (res.outOfScope) {
      outOfScopeMsg.value = res.message;
      messages.value.push({ role: 'assistant', content: res.message });
    } else {
      messages.value.push({
        role: 'assistant',
        content: res.answer,
        source: res.source,
      });
    }
  } catch (e: any) {
    messages.value.push({ role: 'assistant', content: e.message || '请求失败，请重试' });
  }
  scrollToBottom();
}

function sendQuestion() {
  askQuestion(question.value.trim());
}
</script>

<style lang="scss" scoped>
.qa-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.chat-area {
  flex: 1;
  overflow: hidden;
  padding: 24rpx;
}

.messages {
  height: 100%;
}

.message-row {
  margin-bottom: 24rpx;
}

.message-bubble {
  max-width: 85%;
  padding: 24rpx;
  border-radius: 20rpx;

  &.user {
    background: var(--primary);
    color: #fff;
    margin-left: auto;
    border-bottom-right-radius: 4rpx;
  }

  &.assistant {
    background: var(--surface);
    margin-right: auto;
    border-bottom-left-radius: 4rpx;
  }
}

.msg-text {
  font-size: 28rpx;
  line-height: 1.6;
  display: block;
}

.msg-source {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid var(--border);
}

.src-label {
  font-size: 20rpx;
  color: var(--info);
}

.out-of-scope-card {
  background: rgba(217, 59, 59, 0.08);
  border-left: 6rpx solid var(--error);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: flex-start;
}

.oos-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.oos-text {
  font-size: 26rpx;
  color: var(--text-1);
  flex: 1;
  line-height: 1.5;
}

.input-area {
  background: var(--surface);
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border);
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
  margin-top: 10rpx;
}

.qq-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.qq-item {
  padding: 10rpx 20rpx;
  background: var(--bg);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: var(--text-2);
  margin-right: 12rpx;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.chat-input {
  flex: 1;
  height: 72rpx;
  background: var(--bg);
  border-radius: 36rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  color: var(--text-1);
}

.placeholder {
  color: var(--text-3);
}

.send-btn {
  width: 120rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: var(--primary);
  color: #fff;
  font-size: 26rpx;
  border-radius: 36rpx;
  border: none;
  padding: 0;

  &[disabled] {
    opacity: 0.5;
  }
}
</style>
