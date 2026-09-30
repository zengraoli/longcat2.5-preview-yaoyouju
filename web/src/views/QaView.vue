<template>
  <AppLayout>
    <div class="qa-page">
      <div class="qa-page__context">
        🛡 本轮基于：2026-09-21 当前情况 + 2026-08-30 报告 + 一页分析 v3。出现新变化请先更新“当前情况”。
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
                <div v-if="msg.quote" class="qa-quote">
                  <div class="qa-quote__label">你的报告原文（第 3 行）</div>
                  <div class="qa-quote__text">{{ msg.quote }}</div>
                </div>
                <div v-if="msg.citations" class="qa-citations">
                  <span v-for="(c, ci) in msg.citations" :key="ci" class="qa-citation">{{ c }}</span>
                </div>
                <button v-if="msg.followup" class="qa-add-followup" @click="onAddFollowup">
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
            本轮已解释 {{ explainedCount }} 个问题，行动计划已记录。若没有新信息，反复确认不会得到不同答案；出现新变化时我会重新评估。
          </TipBar>

          <!-- 输入栏 -->
          <div class="qa-input-bar">
            <input
              v-model="question"
              class="qa-input"
              placeholder="输入你的问题…（回车发送）"
              @keyup.enter="onSend"
            />
            <button class="qa-send" @click="onSend">➤ 发送</button>
          </div>
        </div>

        <!-- 右侧上下文栏 -->
        <div class="qa-page__side">
          <div class="card">
            <div class="card__title">本轮上下文</div>
            <div class="context-item">
              <span class="context-item__label">当前情况</span>
              <span class="context-item__value">2026-09-21 · 加重 · 左侧</span>
              <StatusTag label="已确认" />
            </div>
            <div class="context-item">
              <span class="context-item__label">报告</span>
              <span class="context-item__value">2026-08-30 腰椎 MRI</span>
              <StatusTag label="原文" />
            </div>
            <div class="context-item">
              <span class="context-item__label">主要困惑</span>
              <span class="context-item__value">报告术语</span>
            </div>
            <div class="context-item">
              <span class="context-item__label">腿部无力</span>
              <span class="context-item__value">尚未回答</span>
              <StatusTag label="尚未确认" />
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
import { toast } from "@/utils/toast";
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { api } from '@/api/client';

const router = useRouter();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  quote?: string;
  citations?: string[];
  followup?: string;
  added?: string;
}

const messages = ref<ChatMessage[]>([
  {
    role: 'user',
    content: '报告上写“硬膜囊受压”，是不是很严重？',
  },
  {
    role: 'assistant',
    content: '先说清楚这句话在报告里是什么意思，再说它不能说明什么。',
    quote: '“L5/S1椎间盘向后突出，相应硬膜囊受压”',
    citations: ['来源：审核科普 #07', '报告原文'],
    followup: '严重程度如何判断',
  },
  {
    role: 'user',
    content: '那我是不是需要做手术？',
  },
  {
    role: 'assistant',
    content:
      '是否需要手术不在本产品的判断范围内，我不会给出倾向性的答案。\n可以做的是：把你最担心的点整理成复诊问题，并记录最近的功能变化（能坐多久、走多远、夜间是否痛醒），这些是医生判断时会问到的。',
    added: '手术必要性如何评估',
  },
]);

const question = ref('');
const explainedCount = ref(2);
const quickQuestions = ['复诊时该怎么描述？', '哪些变化要提前就医？', '保守治疗一般多久？'];
const followupQuestions = ref([
  '右侧神经根受压与左侧疼痛是否有关？',
  '保守治疗期间哪些变化需提前复诊？',
  '活动、久坐和睡姿要怎么调整？',
  '手术必要性如何评估？',
]);
const history = ref([
  { date: '09-18', title: '关于“椎间盘膨出”', count: 3 },
  { date: '09-10', title: '复诊前该带什么', count: 2 },
]);

function onAsk(q: string) {
  if (!q.trim()) return;
  question.value = '';
  messages.value.push({ role: 'user', content: q });
  // 模拟回复（真实环境调用 /qa/sessions/:id/messages）
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: '证据库中暂无与这个问题直接相关的资料。建议把这个问题加入复诊问题清单，复诊时带给医生。',
      citations: ['来源：系统生成'],
    });
    explainedCount.value += 1;
  }, 300);
}

function onSend() {
  onAsk(question.value);
}

function onAddFollowup() {
  followupQuestions.value.push('严重程度如何判断');
  uni_showToast();
}

function uni_showToast() {
  // uni-app 环境用 uni.showToast；web 环境用 alert
  toast('已加入复诊问题（演示）');
}

function goFollowup() {
  router.push({ name: 'followup' });
}

onMounted(async () => {
  try {
    const episodes = await api.get<{ id: string }[]>('/episodes');
    if (episodes.length > 0) {
      await api.get<unknown>(`/analyses/episodes/${episodes[0].id}/latest`);
    }
  } catch {
    // 加载失败不阻塞
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
.qa-quote {
  background: var(--bg);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 8px 0;
}
.qa-quote__label {
  font-size: 11px;
  color: var(--text-3);
}
.qa-quote__text {
  font-size: 13px;
  color: var(--primary);
  margin-top: 2px;
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
  min-height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 22px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
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
.card__title {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 12px;
}
.card__title--info {
  color: var(--primary);
  font-size: 14px;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
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
.btn--soft { background: var(--primary-light); color: var(--primary); }
.btn--sm { min-height: 32px; padding: 0 12px; font-size: 13px; margin-top: 12px; }
</style>
