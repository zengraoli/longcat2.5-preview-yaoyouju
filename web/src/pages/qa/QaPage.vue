<template>
  <div class="qa-layout">
    <div class="chat-main">
      <div class="messages">
        <div class="message" v-for="(msg, idx) in messages" :key="idx" :class="msg.role">
          <div class="msg-bubble">
            <p class="msg-text">{{ msg.content }}</p>
            <span class="msg-source" v-if="msg.source && msg.role === 'assistant'">来源: {{ msg.source }}</span>
          </div>
        </div>
        <div class="out-of-scope" v-if="outOfScopeMsg">{{ outOfScopeMsg }}</div>
      </div>

      <div class="input-area">
        <input v-model="question" placeholder="输入您的问题..." @keyup.enter="sendQuestion" />
        <button class="btn-primary" :disabled="!question.trim()" @click="sendQuestion">发送</button>
      </div>
    </div>

    <aside class="context-panel">
      <section class="card">
        <h3 class="panel-title">本轮依据</h3>
        <p class="panel-text">基于最新分析结果和医学证据库</p>
      </section>
      <section class="card">
        <h3 class="panel-title">已加入的复诊问题</h3>
        <p class="panel-text" v-if="followupQuestions.length === 0">暂无</p>
        <ul class="question-list" v-else>
          <li v-for="(q, idx) in followupQuestions" :key="idx">{{ q }}</li>
        </ul>
      </section>
      <section class="card">
        <h3 class="panel-title">不回答的范围</h3>
        <ul class="scope-list">
          <li>诊断</li>
          <li>用药建议</li>
          <li>手术建议</li>
        </ul>
      </section>
      <section class="card">
        <h3 class="panel-title">历史会话</h3>
        <p class="panel-text" v-if="history.length === 0">暂无历史</p>
        <div class="history-item" v-for="(h, idx) in history.slice(0, 5)" :key="idx">
          <p class="history-q">{{ h.question }}</p>
          <p class="history-time">{{ formatTime(h.created_at) }}</p>
        </div>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const messages = ref<{ role: string; content: string; source?: string }[]>([]);
const question = ref('');
const outOfScopeMsg = ref('');
const followupQuestions = ref<string[]>([]);
const history = ref<any[]>([]);

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

async function sendQuestion() {
  if (!question.value.trim()) return;
  outOfScopeMsg.value = '';
  messages.value.push({ role: 'user', content: question.value });
  const q = question.value;
  question.value = '';

  try {
    const res = await api.askQuestion({ question: q });
    if (res.outOfScope) {
      outOfScopeMsg.value = res.message;
      messages.value.push({ role: 'assistant', content: res.message });
      if (res.suggestedFollowupQuestion) {
        followupQuestions.value.push(res.suggestedFollowupQuestion);
      }
    } else {
      messages.value.push({ role: 'assistant', content: res.answer, source: res.source });
    }
  } catch (e: any) {
    messages.value.push({ role: 'assistant', content: e.message || '请求失败' });
  }
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      const res = await api.getSessionHistory(episodes[0].id);
      history.value = res || [];
    }
  } catch (e) {
    console.error('Failed to load history:', e);
  }
});
</script>

<style scoped>
.qa-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  padding: 24px 40px;
  height: calc(100vh - 200px);
}

.chat-main {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.message {
  margin-bottom: 16px;
}

.message.user .msg-bubble {
  background: var(--primary);
  color: #fff;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.message.assistant .msg-bubble {
  background: var(--bg);
  border-bottom-left-radius: 4px;
}

.msg-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  display: inline-block;
}

.msg-text {
  font-size: 14px;
  line-height: 1.6;
}

.msg-source {
  font-size: 11px;
  color: var(--info);
  margin-top: 8px;
  display: block;
}

.out-of-scope {
  background: rgba(217, 59, 59, 0.08);
  border-left: 4px solid var(--error);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--error);
  margin-bottom: 16px;
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border);
}

.input-area input {
  flex: 1;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 16px;
  font-size: 14px;
}

.context-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.panel-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.panel-text {
  font-size: 12px;
  color: var(--text-3);
}

.question-list li {
  font-size: 12px;
  color: var(--text-2);
  padding: 4px 0;
}

.scope-list li {
  font-size: 12px;
  color: var(--error);
  padding: 4px 0;
}

.history-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.history-q {
  font-size: 12px;
  color: var(--text-1);
}

.history-time {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 4px;
}
</style>
