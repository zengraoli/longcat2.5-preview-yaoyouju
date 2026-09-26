<template>
  <div class="qa-page">
    <div class="qa-layout">
      <div class="chat-main">
        <div class="context-bar">
          <img src="@/assets/icons/ic_shield.png" alt="" />
          <span>本轮基于：{{ contextBasis }}。出现新变化请先更新“当前情况”。</span>
        </div>

        <div class="messages">
          <div class="message user" v-for="(msg, idx) in userMessages" :key="'u' + idx">
            <div class="bubble user-bubble">{{ msg }}</div>
          </div>

          <div class="message assistant" v-for="(msg, idx) in assistantMessages" :key="'a' + idx">
            <div class="avatar">腰</div>
            <div class="bubble assistant-bubble">
              <p class="msg-text">{{ msg.content }}</p>
              <div class="source-chips" v-if="msg.source">
                <span class="src-chip">{{ msg.source }}</span>
                <span class="src-chip src-chip-info">报告原文</span>
              </div>
              <button class="followup-add" v-if="msg.outOfScope" @click="addFollowup(msg)">
                ＋ 把“{{ msg.shortQuestion }}”加入复诊问题
              </button>
              <span v-else-if="msg.added" class="followup-added">＋ 已加入复诊问题：{{ msg.shortQuestion }}</span>
            </div>
          </div>

          <div class="stability-bar" v-if="showStability">
            <img src="@/assets/icons/ic_info.png" alt="" />
            <span>本轮已解释 {{ explainedCount }} 个问题，行动计划已记录。若没有新信息，反复确认不会得到不同答案；出现新变化时我会重新评估。</span>
          </div>
        </div>

        <div class="input-area">
          <div class="quick-chips">
            <button
              v-for="q in quickQuestions"
              :key="q"
              class="chip"
              @click="askQuestion(q)"
            >
              {{ q }}
            </button>
          </div>
          <div class="input-row">
            <input
              v-model="question"
              placeholder="输入你的问题…"
              @keyup.enter="sendQuestion"
            />
            <button class="send-btn" :disabled="!question.trim()" @click="sendQuestion" aria-label="发送">
              <img src="@/assets/icons/ic_send.png" alt="发送" />
            </button>
          </div>
        </div>
      </div>

      <aside class="context-panel">
        <section class="card">
          <h3 class="panel-title">本轮依据</h3>
          <p class="panel-text">2026-09-21 当前情况 + 2026-08-30 报告原文</p>
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
            <li>诊断结论</li>
            <li>用药建议</li>
            <li>手术建议</li>
          </ul>
          <p class="panel-note">越界问题不答，可转为复诊问题带给医生。</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../utils/api';

interface AssistantMsg {
  content: string;
  source?: string;
  outOfScope?: boolean;
  shortQuestion?: string;
  added?: boolean;
}

const messages = ref<AssistantMsg[]>([]);
const userMessages = ref<string[]>([]);
const question = ref('');
const history = ref<any[]>([]);
const followupQuestions = ref<string[]>([]);
const episodeId = ref('');
const explainedCount = ref(0);

const quickQuestions = ['复诊时该怎么描述？', '哪些变化要提前就医？', '保守治疗一般多久？'];

const showStability = computed(() => explainedCount.value >= 2);

const contextBasis = computed(() => {
  return '当前情况 + 最近一次检查报告';
});

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function addFollowup(msg: AssistantMsg) {
  if (msg.shortQuestion && !followupQuestions.value.includes(msg.shortQuestion)) {
    followupQuestions.value.push(msg.shortQuestion);
  }
  msg.added = true;
}

async function askQuestion(q: string) {
  const text = q.trim();
  if (!text) return;
  question.value = '';
  userMessages.value.push(text);
  try {
    const res = await api.askQuestion({ question: text, episodeId: episodeId.value || undefined });
    if (res.outOfScope) {
      messages.value.push({
        content: res.message || '该问题涉及诊断、手术或用药建议，超出服务范围。建议您将此问题加入复诊清单，咨询医生。',
        outOfScope: true,
        shortQuestion: text.length > 12 ? text.slice(0, 12) + '…' : text,
      });
    } else {
      messages.value.push({
        content: res.answer,
        source: res.source,
      });
      explainedCount.value++;
      if (res.isReassurance) explainedCount.value = Math.max(explainedCount.value, 2);
    }
  } catch (e: any) {
    messages.value.push({ content: e.message || '回答失败，请稍后重试。' });
  }
}

function sendQuestion() {
  askQuestion(question.value);
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      episodeId.value = episodes[0].id;
      history.value = await api.getSessionHistory(episodes[0].id);
    }
  } catch (e) {
    console.error('Failed to load qa context:', e);
  }
});
</script>

<style scoped>
.qa-page {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
}

.qa-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  min-height: 0;
}

.chat-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.context-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 16px;
}

.context-bar img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;
}

.message {
  display: flex;
  gap: 10px;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 75%;
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 14px;
  line-height: 1.7;
}

.user-bubble {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.assistant {
  align-items: flex-start;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.assistant-bubble {
  background: var(--surface);
  border-bottom-left-radius: 4px;
}

.msg-text {
  white-space: pre-wrap;
}

.source-chips {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.src-chip {
  font-size: 12px;
  color: var(--ok);
  background: #E5F6EE;
  border-radius: 4px;
  padding: 3px 8px;
}

.src-chip-info {
  color: var(--info);
  background: #E7F0FE;
}

.followup-add {
  margin-top: 10px;
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.followup-added {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  color: var(--primary);
}

.stability-bar {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #FDF6E3;
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 13px;
  color: var(--warn);
  line-height: 1.6;
}

.stability-bar img {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.input-area {
  margin-top: 16px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 12px 0 0;
}

.quick-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.chip {
  border: 1px solid var(--primary);
  color: var(--primary);
  background: var(--surface);
  border-radius: 10px;
  padding: 8px 18px;
  font-size: 13px;
  cursor: pointer;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
}

.input-row input {
  flex: 1;
  height: 44px;
  border: none;
  background: var(--bg);
  border-radius: 10px;
  padding: 0 16px;
  font-size: 14px;
  outline: none;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn img {
  width: 20px;
  height: 20px;
  filter: brightness(0) invert(1);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.context-panel {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 18px;
}

.panel-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
}

.panel-text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}

.panel-note {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 8px;
}

.question-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-list li {
  font-size: 13px;
  color: var(--text-1);
  padding-left: 14px;
  position: relative;
}

.question-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}

.scope-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scope-list li {
  font-size: 13px;
  color: var(--error);
}

.history-item {
  margin-bottom: 12px;
}

.history-q {
  font-size: 13px;
  color: var(--text-1);
  margin-bottom: 2px;
}

.history-time {
  font-size: 12px;
  color: var(--text-3);
}
</style>
