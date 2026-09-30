<template>
  <AppLayout>
    <div class="timeline-page">
      <div class="timeline-page__header">
        <div>
          <h1 class="timeline-page__title">病程</h1>
          <p class="timeline-page__meta">{{ episode?.title || '尚未建立病程' }}</p>
        </div>
        <div class="timeline-page__actions">
          <button class="btn btn--secondary">▽ 筛选</button>
          <button class="btn btn--primary" @click="onAdd">＋ 新增事件</button>
        </div>
      </div>

      <!-- 最近 14 天 -->
      <div class="card">
        <div class="card__header">
          <div class="card__title">最近 14 天 · 每天能坐多久（分钟）</div>
          <span class="card__tag">来自你的记录</span>
        </div>
        <div class="chart">
          <div
            v-for="(v, i) in chartData"
            :key="i"
            class="chart__col"
          >
            <div class="chart__bar-wrap">
              <div class="chart__bar" :style="{ height: `${v.height}%` }" />
              <div class="chart__bar-fail" :style="{ height: `${v.failHeight}%` }" />
            </div>
            <div class="chart__label">{{ v.label }}</div>
          </div>
        </div>
        <p class="chart__disclaimer">图中变化只反映你的记录，缺失日留空；不代表影像变化或病情恶化。</p>
      </div>

      <div class="timeline-page__grid">
        <!-- 左：时间线 -->
        <div class="timeline-page__main">
          <div class="section-title">记录（按事件，保留来源与核实状态）</div>
          <div class="timeline">
            <div v-for="(event, i) in events" :key="event.id" class="timeline__event">
              <div class="timeline__rail">
                <div class="timeline__dot" :class="`timeline__dot--${event.tone}`" />
                <div v-if="i < events.length - 1" class="timeline__line" />
              </div>
              <div class="timeline__card">
                <div class="timeline__header">
                  <span class="timeline__date">{{ formatDate(event.occurredAt) }}</span>
                  <span class="timeline__type" :class="`timeline__type--${event.tone}`">{{ event.typeLabel }}</span>
                  <span class="timeline__more">⋯</span>
                </div>
                <p class="timeline__text">{{ event.rawText }}</p>
                <div class="timeline__tags">
                  <StatusTag :label="event.sourceType" />
                  <StatusTag v-for="(tag, ti) in event.tags" :key="ti" :label="tag" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：记录今天 -->
        <div class="timeline-page__side">
          <div class="card">
            <div class="card__header">
              <div class="card__title">记录今天</div>
              <span class="card__tag">🕐 约 1 分钟 · 可跳过</span>
            </div>

            <div class="record__question">今天能坐多久？</div>
            <div class="record__chips">
              <button
                v-for="opt in sitOptions"
                :key="opt.value"
                class="chip"
                :class="{ 'chip--selected': sitMinutes === opt.value }"
                @click="sitMinutes = opt.value"
              >
                {{ opt.label }}
              </button>
              <button class="chip chip--skip" @click="sitMinutes = null">跳过</button>
            </div>

            <div class="record__question">能否完成原本计划的活动？</div>
            <div class="record__chips">
              <button
                v-for="opt in activityOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': activity === opt }"
                @click="activity = opt"
              >
                {{ opt }}
              </button>
              <button class="chip chip--skip" @click="activity = null">跳过</button>
            </div>

            <div class="record__question">睡眠受影响程度</div>
            <div class="record__chips">
              <button
                v-for="opt in sleepOptions"
                :key="opt.value"
                class="chip"
                :class="{ 'chip--selected': sleepImpact === opt.value }"
                @click="sleepImpact = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>

            <div class="record__question">与昨天相比</div>
            <div class="record__chips">
              <button
                v-for="opt in changeOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': change === opt }"
                @click="change = opt"
              >
                {{ opt }}
              </button>
              <button class="chip chip--skip" @click="change = null">跳过</button>
            </div>

            <div class="record__question">今天有腿部麻木或无力吗？</div>
            <p class="record__desc">不会沿用昨天的答案；不确定请选"尚未确认"。</p>
            <div class="record__chips">
              <button
                v-for="opt in legOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': leg === opt }"
                @click="leg = opt"
              >
                {{ opt }}
              </button>
            </div>

            <div class="record__question">今天做了什么？（可多选）</div>
            <div class="record__chips">
              <button
                v-for="opt in doneOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': done.includes(opt) }"
                @click="toggleDone(opt)"
              >
                {{ opt }}
              </button>
            </div>

            <div class="record__question">今天最担心什么？</div>
            <textarea
              v-model="worry"
              class="record__textarea"
              placeholder="例如：会不会越来越严重…"
              :maxlength="2000"
            />

            <button class="btn btn--primary btn--block" @click="() => onSave()">保存记录</button>
            <button class="btn btn--text" @click="() => onSave(true)">保存并更新"当前情况"</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { listEpisodes, timeline, addSymptomLog, createEpisode } from '@/api';
import type { Episode } from '@/api/types';

const episode = ref<Episode | null>(null);
const events = ref<Array<{
  id: string;
  occurredAt: string;
  typeLabel: string;
  tone: string;
  rawText: string;
  sourceType: string;
  tags: string[];
}>>([]);
const symptomLogs = ref<Array<{ occurredAt: string; sitMinutes: number | '尚未确认' }>>([]);

/** 最近 14 天柱状图：每天能坐多久（分钟） */
const chartData = computed(() => {
  const days: Array<{ label: string; height: number; failHeight: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const log = symptomLogs.value.find((l) => l.occurredAt.slice(0, 10) === key);
    const minutes = log && typeof log.sitMinutes === 'number' ? log.sitMinutes : null;
    days.push({
      label: key.slice(5),
      height: minutes === null ? 0 : Math.min(100, Math.round((minutes / 90) * 100)),
      failHeight: minutes !== null && minutes < 15 ? 20 : 0,
    });
  }
  return days;
});

const sitOptions = [
  { label: '<15分钟', value: 10 },
  { label: '15-30', value: 22 },
  { label: '30-60', value: 45 },
  { label: '>60分钟', value: 75 },
];
const activityOptions = ['能', '部分', '不能'];
const sleepOptions = [
  { label: '没影响', value: 0 },
  { label: '偶尔醒', value: 1 },
  { label: '常醒', value: 2 },
  { label: '几乎没睡', value: 3 },
];
const changeOptions = ['加重', '差不多', '减轻'];
const legOptions = ['有', '没有', '尚未确认'];
const doneOptions = ['步行', '热敷', '按医嘱用药', '休息', '康复练习', '工作/久坐', '其他'];

const sitMinutes = ref<number | null>(null);
const activity = ref<string | null>(null);
const sleepImpact = ref<number | null>(null);
const change = ref<string | null>(null);
const leg = ref<string | null>(null);
const done = ref<string[]>([]);
const worry = ref('');

function toggleDone(opt: string) {
  const idx = done.value.indexOf(opt);
  if (idx >= 0) done.value.splice(idx, 1);
  else done.value.push(opt);
}

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

async function onSave(updateCurrent = false) {
  try {
    let episodes = await listEpisodes();
    if (episodes.length === 0) {
      // 自动创建病程
      await createEpisode('腰痛', undefined, '尚未确认');
      episodes = await listEpisodes();
    }
    await addSymptomLog(episodes[0].id, {
      occurredAt: new Date().toISOString(),
      sitMinutes: sitMinutes.value ?? undefined,
      plannedActivityDone: activity.value ?? undefined,
      sleepImpact: sleepImpact.value ?? undefined,
      legChange: leg.value ?? undefined,
      changeVsYesterday: change.value ?? undefined,
      activitiesDone: done.value.length > 0 ? done.value.join('、') : undefined,
      topWorry: worry.value || undefined,
    });
    toast('已保存');
  } catch (e) {
    toast((e as Error).message);
  }
}

function onAdd() {
  const text = prompt('记录原文（如报告片段、医嘱、症状变化）');
  if (!text || !text.trim()) return;
  addEvent(text.trim());
}

async function addEvent(text: string) {
  try {
    let episodes = await listEpisodes();
    if (episodes.length === 0) {
      await createEpisode('腰痛', undefined, '尚未确认');
      episodes = await listEpisodes();
    }
    const { addEvent: createEvent } = await import('@/api');
    await createEvent(episodes[0].id, {
      eventType: '症状',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: text,
    });
    toast('已保存');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
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
      const data = await timeline(episodes[0].id);
      events.value = data.events.map((e: { id: string; occurredAt: string; eventType: string; rawText: string | null; sourceType: string; verifyStatus: string }) => ({
        id: e.id,
        occurredAt: e.occurredAt,
        typeLabel: e.eventType,
        tone: e.eventType === '报告' ? 'info' : e.eventType === '医嘱' ? 'warn' : 'ok',
        rawText: e.rawText ?? '',
        sourceType: e.sourceType,
        tags: e.verifyStatus === '已确认' ? [] : [e.verifyStatus],
      }));
      symptomLogs.value = data.symptomLogs.map((l: { occurredAt: string; sitMinutes: number | '尚未确认' }) => ({ occurredAt: l.occurredAt, sitMinutes: l.sitMinutes }));
    }
  } catch {
    // 未登录时不阻塞
  }
}

onMounted(load);
</script>

<style scoped>
.timeline-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.timeline-page__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.timeline-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.timeline-page__actions {
  display: flex;
  gap: 10px;
}
.timeline-page__grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}
.timeline-page__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.timeline-page__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
}
.card__tag {
  font-size: 12px;
  color: var(--text-3);
}
.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 120px;
}
.chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.chart__bar-wrap {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 100px;
}
.chart__bar {
  width: 60%;
  background: var(--primary);
  border-radius: 4px 4px 0 0;
}
.chart__bar-fail {
  width: 60%;
  background: var(--error);
  border-radius: 4px 4px 0 0;
  align-self: flex-end;
}
.chart__label {
  font-size: 11px;
  color: var(--text-3);
}
.chart__disclaimer {
  font-size: 12px;
  color: var(--text-2);
  margin: 12px 0 0;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th {
  text-align: left;
  font-size: 12px;
  color: var(--text-2);
  font-weight: 500;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.table td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}
.timeline__event {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.timeline__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}
.timeline__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.timeline__dot--ok { border-color: var(--ok); background: var(--ok); }
.timeline__dot--info { border-color: var(--info); background: var(--info); }
.timeline__dot--warn { border-color: var(--warn); background: var(--warn); }
.timeline__line {
  flex: 1;
  width: 2px;
  background: var(--border);
  margin: 4px 0;
}
.timeline__card {
  flex: 1;
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
}
.timeline__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.timeline__date {
  font-size: 13px;
  color: var(--text-2);
  flex: 1;
}
.timeline__type {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
}
.timeline__type--ok { color: var(--ok); background: rgba(30, 158, 90, 0.1); }
.timeline__type--info { color: var(--info); background: rgba(47, 111, 216, 0.1); }
.timeline__type--warn { color: var(--warn); background: rgba(199, 119, 0, 0.1); }
.timeline__more { color: var(--text-3); }
.timeline__text {
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 8px;
}
.timeline__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.record__question {
  font-size: 14px;
  font-weight: 500;
  margin: 16px 0 8px;
}
.record__question:first-child {
  margin-top: 0;
}
.record__desc {
  font-size: 12px;
  color: var(--text-2);
  margin: -4px 0 8px;
  line-height: 1.5;
}
.record__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.record__textarea {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  outline: none;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}
.record__textarea:focus {
  border-color: var(--primary);
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
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
.btn--block { width: 100%; margin-top: 16px; }
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
.chip--skip {
  background: transparent;
  border-color: transparent;
  color: var(--text-3);
}
@media (max-width: 1100px) {
  .timeline-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
