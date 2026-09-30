<template>
  <AppLayout>
    <div class="qa-page">
      <div class="qa-page__context">
        🛡 本轮基于：{{ contextText }}。出现新变化请先更新“当前情况”。
      </div>

      <div class="qa-page__grid">
        <!-- 对话区 -->
        <div class="qa-page__chat">
          <div v-for="(msg, i) in messages" :key="i" class="qa-message-row">
            <div v-if="msg.role === 'user'" class="qa-message qa-message--user">
              <div class="qa-bubble qa-bubble--user">{{ msg.content }}</div>
            </div>
            <div v-else class="qa-message qa-message--assistant">
              <div class="qa-avatar">腰</div>
              <div class="qa-bubble qa-bubble--assistant">
                <p class="qa-bubble__text">{{ msg.content }}</p>
                <div v-if="msg.citations && msg.citations.length > 0" class="qa-citations">
                  <span v-for="(c, ci) in msg.citations" :key="ci" class="qa-citation">{{ c.docTitle }}</span>
                </div>
                <button v-if="msg.followup" class="qa-add-followup" @click="onAddFollowup(msg.followup)">
                  ＋ 把“{{ msg.followup }}”加入复诊问题
                </button>
                <div v-if="msg.added" class="qa-added">✓ 已加入复诊问题：{{ msg.added }}</div>
              </div>
            </div>
          </div>

          <!-- 快捷问题 -->
          <div class="qa-quick">
            <button
              v-for="q in quickQuestions"
              :key="q"
              class="chip"
              @click="onAsk(q)"
            >
              {{ q }}
            </button>
          </div>

          <TipBar type="warn">
            本轮已解释 {{ explainedCount }} 个问题。若没有新信息，反复确认不会得到不同答案；出现新变化时我会重新评估。
          </TipBar>

          <!-- 输入栏 -->
          <div class="qa-input-bar">
            <input
              v-model="question"
              class="qa-input"
              placeholder="输入你的问题…（回车发送）"
              @keyup.enter="onSend"
            />
            <button class="qa-send" @click="onSend">➤</button>
          </div>
        </div>

        <!-- 右侧上下文栏 -->
        <div class="qa-page__side">
          <div class="card">
            <div class="card__title">本轮上下文</div>
            <div v-for="(item, i) in contextItems" :key="i" class="context-item">
              <span class="context-item__label">{{ item.label }}</span>
              <span class="context-item__value">{{ item.value }}</span>
              <StatusTag v-if="item.tag" :label="item.tag" />
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div class="card__title">已加入的复诊问题（{{ followupQuestions.length }}）</div>
              <span class="card__icon">📋</span>
            </div>
            <div v-for="(q, i) in followupQuestions" :key="i" class="followup-item">
              {{ i + 1 }}. {{ q }}
            </div>
            <button class="btn btn--soft btn--sm" @click="goFollowup">去复诊准备整理</button>
          </div>

          <div class="card card--info">
            <div class="card__title card__title--info">ⓘ 这里不会回答的问题</div>
            <p class="card__text">
              是否需要手术、用药与剂量、疼痛原因的确定诊断、严重程度评分。这些会被整理为复诊问题。
            </p>
          </div>

          <div class="card">
            <div class="card__title">🕐 历史会话</div>
            <div v-for="(h, i) in history" :key="i" class="history-item">
              {{ h.date }} · {{ h.title }}（{{ h.count }} 问）
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import {
  listEpisodes,
  getLatestAnalysis,
  createQaSession,
  getQaSession,
  askQuestion,
  addFollowupQuestion,
  type QaMessage,
} from '@/api';

const router = useRouter();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ docId: string; docTitle: string }>;
  followup?: string;
  added?: string;
}

const messages = ref<ChatMessage[]>([]);
const question = ref('');
const explainedCount = ref(0);
const sessionId = ref('');
const quickQuestions = ['复诊时该怎么描述？', '哪些变化要提前就医？', '保守治疗一般多久？'];
const followupQuestions = ref<string[]>([]);
const history = ref<Array<{ date: string; title: string; count: number }>>([]);
const contextText = ref('正在加载…');
const contextItems = ref<Array<{ label: string; value: string; tag?: string }>>([]);

async function onAsk(q: string) {
  if (!q.trim() || !sessionId.value) return;
  question.value = '';
  messages.value.push({ role: 'user', content: q });
  try {
    const result = await askQuestion(sessionId.value, q);
    const msg: ChatMessage = {
      role: 'assistant',
      content: result.message.content,
      citations: (result.message.citations ?? []).map((c: { docId: string; docTitle: string }) => ({ docId: c.docId, docTitle: c.docTitle })),
    };
    // 红旗或越界时提供加入复诊问题的入口
    if (result.outOfScope && result.outOfScope.length > 0) {
      msg.followup = q;
    }
    messages.value.push(msg);
    explainedCount.value += 1;
  } catch (e) {
    toast((e as Error).message);
  }
}

function onSend() {
  onAsk(question.value);
}

async function onAddFollowup(q: string) {
  // 真实环境调用 /qa/sessions/:id/followup-questions
  if (!followupQuestions.value.includes(q)) {
    followupQuestions.value.push(q);
  }
  toast('已加入复诊问题');
}

function goFollowup() {
  router.push({ name: 'followup' });
}

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const latest = await getLatestAnalysis(episodes[0].id);
      if (latest) {
        const session = await createQaSession(latest.id, '报告术语解释');
        sessionId.value = session.id;
        const historyData = await getQaSession(session.id);
        messages.value = historyData.messages.map((m: { role: string; content: string; citations: Array<{ docId: string; docTitle: string }> }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          citations: (m.citations ?? []).map((c: { docId: string; docTitle: string }) => ({ docId: c.docId, docTitle: c.docTitle })),
        }));
        explainedCount.value = historyData.messages.filter((m: { role: string }) => m.role === 'assistant').length;
        contextText.value = `基于一页分析 v${latest.version}（${latest.createdAt.slice(0, 10)}）`;
        contextItems.value = [
          { label: '分析版本', value: `v${latest.version}`, tag: '系统生成' },
          { label: '模型', value: latest.modelReleaseId },
          { label: '病程', value: episodes[0].title },
        ];
      } else {
        contextText.value = '尚未生成分析';
      }
    }
  } catch {
    // 未登录时不阻塞
  }
});
</script>

<style scoped>
.qa-page__context {
  background: var(--primary-light);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 20px;
}
.qa-page__grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}
.qa-page__chat {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.qa-message-row {
  display: flex;
}
.qa-message--user {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.qa-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
}
.qa-bubble--user {
  background: var(--primary);
  color: #fff;
}
.qa-bubble--assistant {
  background: var(--surface);
  border: 1px solid var(--border);
}
.qa-bubble__text {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}
.qa-message--assistant {
  display: flex;
  gap: 8px;
  width: 100%;
}
.qa-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.qa-citations {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.qa-citation {
  font-size: 11px;
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  padding: 1px 8px;
  border-radius: 4px;
}
.qa-add-followup {
  display: block;
  margin-top: 8px;
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}
.qa-added {
  margin-top: 8px;
  font-size: 13px;
  color: var(--ok);
}
.qa-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.qa-input-bar {
  display: flex;
  gap: 10px;
}
.qa-input {
  flex: 1;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 0 16px;
  font-size: 14px;
  outline: none;
}
.qa-input:focus {
  border-color: var(--primary);
}
.qa-send {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--primary);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}
.qa-page__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
}
.card--info {
  background: var(--primary-light);
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card__title {
  font-size: 15px;
  font-weight: 500;
}
.card__header .card__title {
  margin: 0;
}
.card__icon { color: var(--text-3); }
.card__text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin: 0;
}
.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.context-item__label {
  font-size: 12px;
  color: var(--text-2);
  width: 56px;
  flex-shrink: 0;
}
.context-item__value {
  font-size: 13px;
  flex: 1;
}
.followup-item {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 8px;
}
.history-item {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 8px;
}
.chip {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 13px;
  cursor: pointer;
}
.btn {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn--primary { background: var(--primary); color: #fff; }
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
.btn--soft { background: var(--primary-light); color: var(--primary); }
.btn--sm { min-height: 32px; padding: 0 12px; font-size: 13px; }
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
@media (max-width: 1100px) {
  .qa-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
