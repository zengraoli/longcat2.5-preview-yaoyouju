<template>
  <AppLayout>
    <div class="dashboard">
      <div class="dashboard__header">
        <div>
          <h1 class="dashboard__title">当前情况</h1>
          <p class="dashboard__subtitle">{{ episode?.title || '尚未建立病程' }}</p>
        </div>
        <div class="dashboard__header-actions">
          <button class="btn btn--primary" @click="goRecord">✎ 记录今天</button>
          <button class="btn btn--secondary" @click="showReportForm = !showReportForm">⬆ 录入报告</button>
        </div>
      </div>

      <div class="dashboard__grid">
        <div class="dashboard__col">
          <!-- 录入报告 -->
          <div class="card" v-if="showReportForm">
            <div class="card__header">
              <div class="card__title">录入检查报告</div>
              <StatusTag label="报告原文" />
            </div>
            <textarea
              v-model="reportText"
              class="report-form__textarea"
              placeholder="粘贴报告原文（如：腰椎 MRI：L5/S1 椎间盘向后突出…）"
              :maxlength="20000"
            />
            <div class="report-form__row">
              <input v-model="reportDate" type="date" class="report-form__date" />
              <button class="btn btn--primary" @click="onSubmitReport">保存报告</button>
            </div>
            <p class="report-form__hint">保存后可在“病程”页核对，并生成一页分析。</p>
          </div>

          <!-- 待确认项 -->
          <div class="card" v-if="pendingItems.length > 0">
            <div class="card__pending-title">
              <span>⚠</span>
              <span>有 {{ pendingItems.length }} 项信息尚未确认</span>
            </div>
            <p class="card__pending-desc">
              确认后才会生成新的分析；没有回答的问题会记录为"尚未确认"，不会被当作"没有"。
            </p>
            <div v-for="(item, i) in pendingItems" :key="i" class="pending-item">
              <p class="pending-item__question">{{ i + 1 }}. {{ item.question }}</p>
              <div class="pending-item__options">
                <button
                  v-for="opt in item.options"
                  :key="opt"
                  class="chip"
                  :class="{ 'chip--selected': item.value === opt }"
                  @click="item.value = opt"
                >
                  {{ opt }}
                </button>
              </div>
            </div>
            <button class="btn btn--primary btn--block" @click="onConfirm">确认并更新当前情况</button>
          </div>

          <!-- 为你推荐 -->
          <div class="card" v-if="recommended.length > 0">
            <p class="card__section-title">为你推荐</p>
            <div v-for="item in recommended" :key="item.id" class="recommend">
              <div class="recommend__thumb">▶</div>
              <div class="recommend__body">
                <div class="recommend__title">{{ item.title }}</div>
                <div class="recommend__meta">
                  <StatusTag label="已审核" />
                  <span>{{ item.type === '视频' ? '视频' : '图文' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard__col">
          <!-- 最新分析 -->
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">最新一页分析</h2>
              <div class="card__header-tags">
                <span class="card__version" v-if="analysis">v{{ analysis.version }} · {{ formatDate(analysis.createdAt) }}</span>
                <StatusTag label="不作诊断" />
              </div>
            </div>
            <p class="analysis__intro" v-if="analysis">
              你上传的报告中提到了 L5/S1；你描述目前腰痛持续约 1 个月且最近加重。报告日期已确认，症状开始日期和是否出现腿部无力还需要确认。下面先解释报告术语，再整理复诊时需要确认的问题。
            </p>
            <div v-if="analysis">
              <div v-for="(item, i) in analysis.sections.已知" :key="`k${i}`" class="analysis__item">
                <StatusTag label="已知" />
                <span class="analysis__text">{{ item.text }}</span>
              </div>
              <div v-for="(item, i) in analysis.sections.解释" :key="`e${i}`" class="analysis__item">
                <StatusTag label="解释" />
                <span class="analysis__text">{{ item.text }}</span>
              </div>
              <div v-for="(item, i) in analysis.sections.未知" :key="`u${i}`" class="analysis__item">
                <StatusTag label="未知" />
                <span class="analysis__text">{{ item.text }}</span>
              </div>
              <div v-for="(item, i) in analysis.sections.下一步" :key="`n${i}`" class="analysis__item">
                <StatusTag label="下一步" />
                <span class="analysis__text">{{ item.text }}</span>
              </div>
            </div>
            <p v-else class="analysis__empty">尚未生成分析</p>
            <div class="card__actions" v-if="analysis">
              <button class="btn btn--primary" @click="goAnalysis">查看完整分析与原文对照</button>
              <button class="btn btn--secondary" @click="goQa">继续追问</button>
              <button class="btn btn--secondary" @click="goFollowup">生成复诊摘要</button>
            </div>
          </div>

          <!-- 快捷入口 -->
          <div class="dashboard__quick">
            <div class="quick-card" @click="goRecord">
              <span class="quick-card__icon">✎</span>
              <div class="quick-card__title">记录今天</div>
              <div class="quick-card__desc">约 1 分钟 · 允许跳过</div>
            </div>
            <div class="quick-card" @click="goReport">
              <span class="quick-card__icon">↑</span>
              <div class="quick-card__title">录入报告</div>
              <div class="quick-card__desc">粘贴文字 · 原文对照</div>
            </div>
            <div class="quick-card" @click="goQa">
              <span class="quick-card__icon">💬</span>
              <div class="quick-card__title">问与解释</div>
              <div class="quick-card__desc">基于当前上下文</div>
            </div>
            <div class="quick-card" @click="goFollowup">
              <span class="quick-card__icon">📋</span>
              <div class="quick-card__title">复诊准备</div>
              <div class="quick-card__desc">{{ followupQuestionCount }} 个问题待确认</div>
            </div>
          </div>
        </div>

        <div class="dashboard__col">
          <div class="card" v-if="followupDate">
            <div class="card__header">
              <h2 class="card__title">📅 计划复诊</h2>
            </div>
            <div class="followup__date">{{ followupDate }}（约 {{ daysUntil }} 天后）</div>
            <p class="followup__source">来源：你录入的医嘱 · 未经核实</p>
            <button class="btn btn--text" @click="goFollowup">修改日期</button>
          </div>

          <div class="card">
            <h2 class="card__title">最近记录</h2>
            <div v-for="(item, i) in recentRecords" :key="i" class="recent-item">
              <div class="recent-item__date">{{ item.date }}</div>
              <div class="recent-item__body">
                <span class="recent-item__dot" :class="`recent-item__dot--${item.tone}`" />
                <span class="recent-item__text">{{ item.text }}</span>
              </div>
            </div>
          </div>

          <TipBar type="error">
            症状突然变化或出现严重信号？无需登录也可查看就医提示。
          </TipBar>
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
import { listEpisodes, getLatestAnalysis, timeline, addEvent, listPublishedContents, createEpisode, createReport } from '@/api';
import type { AnalysisResult, Episode, ContentItem } from '@/api/types';

const router = useRouter();
const episode = ref<Episode | null>(null);
const analysis = ref<AnalysisResult | null>(null);
const showReportForm = ref(false);
const reportText = ref('');
const reportDate = ref('');

const pendingItems = ref<Array<{ question: string; options: string[]; value: string }>>([]);
const recentRecords = ref<Array<{ date: string; tone: string; text: string }>>([]);
const followupDate = ref('');
const daysUntil = ref(0);
const recommended = ref<ContentItem[]>([]);
const followupQuestionCount = ref(0);

function goRecord() {
  router.push({ name: 'timeline' });
}
function goReport() {
  showReportForm.value = true;
}

async function onSubmitReport() {
  if (!reportText.value.trim()) {
    toast('请填写报告原文');
    return;
  }
  try {
    let episodes = await listEpisodes();
    if (episodes.length === 0) {
      // 自动创建病程
      await createEpisode('腰痛', reportDate.value || undefined, '尚未确认');
      episodes = await listEpisodes();
    }
    const event = await addEvent(episodes[0].id, {
      eventType: '报告',
      occurredAt: new Date().toISOString(),
      sourceType: '报告原文',
      rawText: reportText.value,
    });
    await createReport({ careEventId: event.id, reportDate: reportDate.value || undefined, sourceType: '报告原文', rawText: reportText.value });
    reportText.value = '';
    showReportForm.value = false;
    toast('报告已保存');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}
function goAnalysis() {
  if (analysis.value) {
    router.push({ name: 'analysis', params: { id: analysis.value.id } });
  }
}
function goQa() {
  router.push({ name: 'qa' });
}
function goFollowup() {
  router.push({ name: 'followup' });
}

async function onConfirm() {
  const answered = pendingItems.value.filter((i) => i.value);
  if (answered.length === 0) {
    toast('请先回答上面的问题');
    return;
  }
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) {
      toast('请先建立病程');
      return;
    }
    const text = answered.map((i) => `${i.question}→${i.value}`).join('；');
    await addEvent(episodes[0].id, {
      eventType: '症状',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: `工作台确认：${text}`,
      verifyStatus: '尚未确认',
    });
    toast('已确认并更新当前情况');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

async function load() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      episode.value = episodes[0];
      const latest = await getLatestAnalysis(episodes[0].id);
      if (latest) analysis.value = latest;
      // 待确认项：来自病程中尚未确认的记录
      const tl = await timeline(episodes[0].id);
      const pending: Array<{ question: string; options: string[]; value: string }> = [];
      for (const e of tl.events) {
        if (e.verifyStatus === '尚未确认' && e.rawText) {
          pending.push({ question: e.rawText.slice(0, 24), options: ['已确认', '有冲突'], value: '' });
        }
      }
      for (const log of tl.symptomLogs) {
        if (log.legChange === '尚未确认') {
          pending.push({ question: '今天有腿部麻木或无力吗？', options: ['有', '没有', '尚未确认'], value: '' });
        }
      }
      pendingItems.value = pending;
    }
  } catch {
    // 未登录时不阻塞
  }
}

onMounted(load);
</script>

<style scoped>
.dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.dashboard__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.dashboard__subtitle {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.dashboard__header-actions {
  display: flex;
  gap: 10px;
}
.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 16px;
  align-items: start;
}
.dashboard__col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.report-form__textarea {
  width: 100%;
  min-height: 120px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 12px;
}
.report-form__row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.report-form__date {
  flex: 1;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
}
.report-form__hint {
  font-size: 12px;
  color: var(--text-3);
  margin: 8px 0 0;
}
.card__pending-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
  color: var(--warn);
  margin-bottom: 8px;
}
.card__pending-desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 0 0 16px;
}
.pending-item {
  margin-bottom: 16px;
}
.pending-item__question {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px;
}
.pending-item__options {
  display: flex;
  gap: 8px;
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
.chip--selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
}
.card__header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card__version {
  font-size: 12px;
  color: var(--text-3);
}
.card__section-title {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 12px;
}
.card__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.analysis__intro {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px;
}
.analysis__item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: flex-start;
}
.analysis__text {
  font-size: 14px;
  flex: 1;
  line-height: 1.5;
}
.analysis__empty {
  font-size: 14px;
  color: var(--text-3);
}
.recommend {
  display: flex;
  gap: 12px;
}
.recommend__thumb {
  width: 72px;
  height: 54px;
  border-radius: 8px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-size: 18px;
  flex-shrink: 0;
}
.recommend__title {
  font-size: 14px;
  font-weight: 500;
}
.recommend__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}
.dashboard__quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
}
.quick-card__icon {
  font-size: 20px;
  color: var(--primary);
}
.quick-card__title {
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
}
.quick-card__desc {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.followup__date {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 4px;
}
.followup__source {
  font-size: 12px;
  color: var(--text-2);
  margin: 0 0 8px;
}
.recent-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.recent-item__date {
  font-size: 12px;
  color: var(--text-3);
  width: 48px;
  flex-shrink: 0;
}
.recent-item__body {
  display: flex;
  gap: 8px;
  flex: 1;
}
.recent-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
.recent-item__dot--ok { background: var(--ok); }
.recent-item__dot--info { background: var(--info); }
.recent-item__dot--warn { background: var(--warn); }
.recent-item__text {
  font-size: 13px;
  line-height: 1.5;
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
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
@media (max-width: 1100px) {
  .dashboard__grid {
    grid-template-columns: 1fr 1fr;
  }
  .dashboard__stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .dashboard__quick {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 700px) {
  .dashboard__grid {
    grid-template-columns: 1fr;
  }
  .dashboard__stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard__quick {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
