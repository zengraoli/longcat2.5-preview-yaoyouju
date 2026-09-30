<template>
  <view class="qa">
    <view class="qa__header">
      <text class="qa__title">问与解释</text>
      <Icon name="clock" :size="18" class="qa__history" />
    </view>

    <view class="qa__context">
      <Icon name="shield" :size="18" class="qa__context-icon" />
      <text class="qa__context-text">
        {{ contextText }}
      </text>
    </view>

    <scroll-view scroll-y class="qa__messages" :scroll-top="scrollTop">
      <view v-for="(msg, i) in messages" :key="i" class="qa__message-row">
        <!-- 用户消息 -->
        <view v-if="msg.role === 'user'" class="qa__message qa__message--user">
          <view class="qa__bubble qa__bubble--user">
            <text class="qa__bubble-text">{{ msg.content }}</text>
          </view>
        </view>
        <!-- 助手消息 -->
        <view v-else class="qa__message qa__message--assistant">
          <view class="qa__avatar">腰</view>
          <view class="qa__bubble qa__bubble--assistant">
            <text class="qa__bubble-text">{{ msg.content }}</text>
            <view v-if="msg.citations && msg.citations.length > 0" class="qa__citations">
              <text
                v-for="(c, ci) in (msg.citations ?? [])"
                :key="ci"
                class="qa__citation"
              >
                来源：{{ c.docTitle }}
              </text>
            </view>
            <text
              v-if="msg.outOfScope"
              class="qa__add-followup"
              @click="onAddFollowup(msg.followupQuestion ?? question)"
            >
              ＋ 把“{{ msg.followupQuestion }}”加入复诊问题
            </text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 快捷问题 -->
    <view class="qa__quick">
      <AppChip
        v-for="q in quickQuestions"
        :key="q"
        @click="onAsk(q)"
      >
        {{ q }}
      </AppChip>
    </view>

    <TipBar type="warn">
      本轮已解释 {{ explainedCount }} 个问题，行动计划已记录。若没有新信息，反复确认不会得到不同答案；出现新变化时我会重新评估。
    </TipBar>

    <!-- 输入栏 -->
    <view class="qa__input-bar">
      <input
        v-model="question"
        class="qa__input"
        placeholder="输入你的问题…"
        placeholder-class="qa__input-placeholder"
        confirm-type="send"
        @confirm="onSend"
      />
      <view class="qa__send" @click="onSend">
        <Icon name="send" :size="18" class="qa__send-icon" />
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import Icon from '@/components/Icon.vue';
import { beijingDate } from '@/utils/time';
import { onShow } from '@dcloudio/uni-app';
import AppChip from '@/components/AppChip.vue';
import TipBar from '@/components/TipBar.vue';
import {
  listEpisodes,
  getLatestAnalysis,
  createQaSession,
  listQaSessions,
  getQaSession,
  askQuestion,
  addFollowupQuestion,
  type QaMessage,
} from '@/api';

const today = beijingDate();
const messages = ref<Array<QaMessage & { outOfScope?: boolean; followupQuestion?: string }>>([]);
const question = ref('');
const sessionId = ref('');
const explainedCount = ref(0);
const scrollTop = ref(0);
const contextText = ref('正在加载…');
const quickQuestions = ['复诊时该怎么描述？', '哪些变化要提前就医？', '保守治疗一般多久？'];

async function onAsk(q: string) {
  const text = (q ?? '').trim();
  if (!text) return;
  // 先清空输入框，避免首问因等待会话创建而看起来“没清空”
  question.value = '';
  // 没有分析时也能提问：创建无分析上下文的会话（归属当前病程，避免复诊问题串病程）
  if (!sessionId.value) {
    let episodeId: string | null = null;
    try {
      const episodes = await listEpisodes();
      episodeId = episodes[0]?.id ?? null;
    } catch {
      episodeId = null;
    }
    const created = await createQaSession(null, '自由提问', episodeId);
    sessionId.value = created.id;
    contextText.value = '基于通用上下文（未关联具体分析）';
  }
  messages.value.push({ id: `u${Date.now()}`, role: 'user', content: text, citations: [], createdAt: '' });
  scrollToBottom();
  try {
    const result = await askQuestion(sessionId.value, text);
    const msg = { ...result.message, outOfScope: result.outOfScope.length > 0, followupQuestion: text };
    messages.value.push(msg);
    // 每问一个问题计一次（不再只在反复求保证时计数）
    explainedCount.value = messages.value.filter((m) => m.role === 'user').length;
    scrollToBottom();
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function onSend() {
  onAsk(question.value);
}

async function onAddFollowup(q: string) {
  if (!sessionId.value) return;
  try {
    await addFollowupQuestion(sessionId.value, q);
    uni.showToast({ title: '已加入复诊问题', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function scrollToBottom() {
  nextTick(() => {
    scrollTop.value += 10000;
  });
}

async function loadSession() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) {
      contextText.value = '尚未建立病程，可先自由提问';
      return;
    }
    const analysis = await getLatestAnalysis(episodes[0].id);
    if (!analysis) {
      contextText.value = '尚未生成分析，可先自由提问';
      return;
    }
    if (!sessionId.value) {
      // 优先复用已有会话，保留历史
      const existing = await listQaSessions();
      const session = existing.find((s) => s.analysisId === analysis.id) ?? existing[0];
      if (session) {
        sessionId.value = session.id;
        const history = await getQaSession(session.id);
        messages.value = history.messages;
        explainedCount.value = history.messages.filter((m) => m.role === 'user').length;
        contextText.value = `本轮基于：${today} 当前情况 + 一页分析 v${analysis.version}`;
      } else {
        const created = await createQaSession(analysis.id, '报告术语解释', analysis.episodeId);
        sessionId.value = created.id;
        contextText.value = `本轮基于：${today} 当前情况 + 一页分析 v${analysis.version}`;
      }
    } else {
      contextText.value = `本轮基于：${today} 当前情况 + 一页分析 v${analysis.version}`;
    }
  } catch (e) {
    contextText.value = '上下文加载失败，可先自由提问';
  }
}

onMounted(loadSession);
// 切回本页时刷新（可能已有新分析）
onShow(loadSession);
</script>

<style scoped>
.qa {
  height: 100vh;
  padding: 16px 16px 76px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.qa__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.qa__title {
  font-size: 17px;
  font-weight: 500;
}
.qa__history { font-size: 20px; color: var(--text-2); }
.qa__context {
  display: flex;
  gap: 8px;
  background: var(--primary-light);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}
.qa__context-icon { flex-shrink: 0; }
.qa__context-text {
  font-size: 12px;
  color: var(--text-2);
  flex: 1;
  line-height: 1.5;
}
.qa__messages {
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
  margin-bottom: 12px;
}
.qa__message-row {
  margin-bottom: 16px;
}
.qa__message--user {
  display: flex;
  justify-content: flex-end;
}
.qa__bubble {
  max-width: 85%;
  padding: 12px 14px;
  border-radius: 12px;
}
.qa__bubble--user {
  background: var(--primary);
  color: #fff;
}
.qa__bubble--assistant {
  background: var(--surface);
  border: 1px solid var(--border);
}
.qa__bubble-text {
  font-size: 14px;
  line-height: 1.6;
  display: block;
}
.qa__message--assistant {
  display: flex;
  gap: 8px;
}
.qa__avatar {
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
.qa__citations {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.qa__citation {
  font-size: 11px;
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  padding: 1px 8px;
  border-radius: 4px;
}
.qa__add-followup {
  display: block;
  font-size: 13px;
  color: var(--primary);
  margin-top: 8px;
}
.qa__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.qa__input-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0 0;
  background: var(--surface);
}
.qa__input {
  flex: 1;
  height: 44px;
  background: var(--bg);
  border-radius: 22px;
  padding: 0 16px;
  font-size: 14px;
}
.qa__input-placeholder { color: var(--text-3); }
.qa__send {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.qa__send-icon { color: #fff; font-size: 18px; }
</style>
