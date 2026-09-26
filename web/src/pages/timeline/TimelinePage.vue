<template>
  <div class="timeline-page">
    <div class="timeline-layout">
      <div class="timeline-main">
        <!-- 本次发作统计 -->
        <div class="episode-card card">
          <div class="episode-head">
            <h2 class="episode-title">{{ episode?.title || '本次发作' }}</h2>
            <span class="tag tag-ok">{{ episodeStatus }}</span>
          </div>
          <p class="episode-onset">起点：{{ onsetText }}</p>
          <div class="stat-grid">
            <div class="stat-box">
              <span class="stat-num">{{ symptomCount }}</span>
              <span class="stat-label">条记录</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{{ reportCount }}</span>
              <span class="stat-label">份报告</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{{ analysisVersion ? 'v' + analysisVersion : 0 }}</span>
              <span class="stat-label">次分析</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{{ questionCount }}</span>
              <span class="stat-label">个复诊问题</span>
            </div>
          </div>
        </div>

        <!-- 14 天柱图 -->
        <div class="chart-card card">
          <div class="chart-head">
            <h3 class="chart-title">最近 14 天 · 每天能坐多久</h3>
            <span class="chart-unit">分钟</span>
          </div>
          <div class="chart">
            <div class="chart-bar" v-for="(bar, i) in chartBars" :key="i">
              <div
                class="bar"
                :class="{ latest: i >= chartBars.length - 3 }"
                :style="{ height: bar.height + 'px' }"
                :title="bar.date + '：' + bar.minutes + ' 分钟'"
              ></div>
              <span class="bar-date" v-if="i % 2 === 0">{{ bar.label }}</span>
            </div>
          </div>
          <p class="chart-disclaimer">图中变化只反映你的记录，不代表影像变化或病情恶化。</p>
        </div>

        <!-- 时间线 -->
        <h3 class="section-label">记录（按事件，保留来源与核实状态）</h3>
        <div class="timeline-list">
          <div class="timeline-item" v-for="item in timeline" :key="item.id">
            <div class="timeline-dot" :style="{ background: typeColor(item.event_type) }"></div>
            <div class="timeline-card card">
              <div class="card-head">
                <span class="event-date">{{ formatDate(item.occurred_at) }}<span v-if="item.isToday"> · 今天</span></span>
                <div class="head-right">
                  <span class="event-type-tag" :style="{ color: typeColor(item.event_type), background: typeBg(item.event_type) }">
                    {{ typeLabel(item.event_type) }}
                  </span>
                  <button class="more-btn" @click="toggleMenu(item.id)">⋯</button>
                </div>
              </div>
              <p class="event-text">{{ item.raw_text || '暂无描述' }}</p>
              <div class="tag-row">
                <span class="tag tag-source">{{ item.source_type }}</span>
                <span class="tag" :class="verifyClass(item.verify_status)">{{ item.verify_status }}</span>
              </div>
              <div class="item-menu" v-if="openMenuId === item.id">
                <button class="menu-item danger" @click="removeEvent(item)">删除此记录</button>
              </div>
            </div>
          </div>
          <div class="empty-state card" v-if="timeline.length === 0">
            <p>暂无病程记录</p>
          </div>
        </div>
      </div>

      <!-- 记录今天 -->
      <aside class="record-panel">
        <h3 class="panel-title">记录今天</h3>
        <div class="card">
          <p class="panel-note">每个问题都可以跳过，跳过会记为“尚未确认”</p>

          <div class="form-group">
            <label>今天能坐多久？</label>
            <div class="chip-col">
              <button
                v-for="opt in ['<15分钟', '15-30', '30-60', '>60分钟']"
                :key="opt"
                class="chip"
                :class="{ selected: form.sitLabel === opt }"
                @click="selectSit(opt)"
              >{{ opt }}</button>
              <button class="chip chip-skip" :class="{ selected: form.sitSkipped }" @click="form.sitSkipped = !form.sitSkipped">跳过</button>
            </div>
          </div>

          <div class="form-group">
            <label>能否完成原本计划的活动？</label>
            <div class="chip-col">
              <button
                v-for="opt in ['能', '部分', '不能']"
                :key="opt"
                class="chip"
                :class="{ selected: form.activityDone === opt }"
                @click="form.activityDone = opt"
              >{{ opt }}</button>
              <button class="chip chip-skip" :class="{ selected: form.activitySkipped }" @click="form.activitySkipped = !form.activitySkipped">跳过</button>
            </div>
          </div>

          <div class="form-group">
            <label>睡眠受影响程度</label>
            <div class="chip-col">
              <button
                v-for="opt in sleepOptions"
                :key="opt.value"
                class="chip chip-pick"
                :class="{ selected: form.sleepImpact === opt.value }"
                @click="form.sleepImpact = opt.value"
              >{{ opt.value }}<small>{{ opt.label }}</small></button>
            </div>
          </div>

          <div class="form-group">
            <label>与昨天相比</label>
            <div class="chip-col">
              <button
                v-for="opt in ['加重', '差不多', '减轻']"
                :key="opt"
                class="chip"
                :class="{ selected: form.compareToYesterday === opt }"
                @click="form.compareToYesterday = opt"
              >{{ opt }}</button>
              <button class="chip chip-skip" :class="{ selected: form.compareSkipped }" @click="form.compareSkipped = !form.compareSkipped">跳过</button>
            </div>
          </div>

          <div class="form-group">
            <label>今天有腿部麻木或无力吗？</label>
            <p class="form-note">不会沿用昨天的答案——如果你今天不确定，请选“尚未确认”。</p>
            <div class="chip-col">
              <button
                v-for="opt in ['有', '没有', '尚未确认']"
                :key="opt"
                class="chip"
                :class="{ selected: form.legChange === opt }"
                @click="form.legChange = opt"
              >{{ opt }}</button>
            </div>
          </div>

          <div class="form-group">
            <label>今天做了什么？（可多选）</label>
            <div class="chip-col">
              <button
                v-for="opt in ['步行', '热敷', '按医嘱用药', '休息', '康复练习', '工作/久坐', '其他']"
                :key="opt"
                class="chip"
                :class="{ selected: form.activities.includes(opt) }"
                @click="toggleActivity(opt)"
              >{{ opt }}</button>
            </div>
          </div>

          <div class="form-group">
            <label>今天最担心什么？</label>
            <input v-model="form.topWorry" placeholder="例如：会不会越来越严重 / 要不要换医院…" />
          </div>

          <div class="info-alert">
            <img src="@/assets/icons/ic_info.png" alt="" />
            <span>记录只用于整理你的病程和复诊摘要；变化图不会把某一次疼痛上升解读为影像恶化。</span>
          </div>

          <button class="btn-primary btn-block" @click="submitLog">保存记录</button>
          <button class="link-btn" @click="submitLogAndContinue">保存并更新“当前情况”（症状有新变化时）</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../utils/api';
import type { Episode } from '../../types';

const router = useRouter();

const episode = ref<Episode | null>(null);
const timeline = ref<any[]>([]);
const analysisVersion = ref<number | null>(null);
const questionCount = ref(0);
const openMenuId = ref<string | null>(null);

const form = ref({
  sitLabel: '',
  sitSkipped: false,
  activityDone: '',
  activitySkipped: false,
  sleepImpact: 1,
  compareToYesterday: '',
  compareSkipped: false,
  legChange: '',
  activities: [] as string[],
  topWorry: '',
});

const sleepOptions = [
  { value: 0, label: '没影响' },
  { value: 1, label: '偶尔醒' },
  { value: 2, label: '常醒' },
  { value: 3, label: '几乎没睡' },
];

const episodeStatus = computed(() => (episode.value?.status === 'active' ? '保守治疗中' : episode.value?.status || '尚未确认'));

const onsetText = computed(() => {
  const ep = episode.value;
  if (!ep) return '尚未确认';
  const date = ep.onset_date ? ep.onset_date.slice(0, 7) + ' 中旬' : '尚未确认';
  return `约 ${date}（自述，具体日期${ep.onset_certainty}）`;
});

const symptomCount = computed(() => timeline.value.filter((t) => t.event_type === '症状').length);
const reportCount = computed(() => timeline.value.filter((t) => t.event_type === '报告').length);

function typeLabel(t: string) {
  return { 症状: '症状记录', 报告: '检查报告', 分析: '一页分析', 医嘱: '医生建议', 症状开始: '症状开始' }[t] || t;
}
function typeColor(t: string) {
  return { 症状: '#1E9E5A', 报告: '#2F6FD8', 分析: '#98A1AE', 医嘱: '#C77700', 症状开始: '#1E9E5A' }[t] || '#0F6E74';
}
function typeBg(t: string) {
  return { 症状: '#E5F6EE', 报告: '#E7F0FE', 分析: '#F4F6F8', 医嘱: '#FDF6E3', 症状开始: '#E5F6EE' }[t] || '#E3F1F2';
}
function verifyClass(s: string) {
  return s === '已确认' ? 'tag-ok' : s === '有冲突' ? 'tag-error' : 'tag-warn';
}

const chartBars = computed(() => {
  const days: { date: string; label: string; minutes: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const logs = timeline.value.filter((t) => t.occurred_at?.slice(0, 10) === key);
    const minutes = logs.reduce((sum, t) => sum + (t.sit_minutes || 0), 0);
    days.push({ date: key, label: key.slice(5).replace('-', '/'), minutes });
  }
  const max = Math.max(60, ...days.map((d) => d.minutes));
  return days.map((d) => ({ ...d, height: Math.round((d.minutes / max) * 120) }));
});

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function toggleActivity(opt: string) {
  const i = form.value.activities.indexOf(opt);
  if (i >= 0) form.value.activities.splice(i, 1);
  else form.value.activities.push(opt);
}

function selectSit(label: string) {
  form.value.sitLabel = form.value.sitLabel === label ? '' : label;
  form.value.sitSkipped = false;
}

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

async function removeEvent(item: any) {
  if (!confirm('确定删除这条记录？')) return;
  try {
    await api.deleteCareEvent(item.id);
    openMenuId.value = null;
    await loadData();
  } catch (e: any) {
    alert(e.message || '删除失败');
  }
}

async function submitLog() {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) {
      alert('暂无病程数据');
      return;
    }
    const episodeId = episodes[0].id;
    const sitMinutes = form.value.sitSkipped
      ? null
      : { '<15分钟': 10, '15-30': 22, '30-60': 45, '>60分钟': 75 }[form.value.sitLabel] ?? null;
    const activityDone = form.value.activitySkipped ? '' : form.value.activityDone || '部分';
    const ev = await api.createCareEvent({
      episodeId,
      eventType: '症状',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: `日常记录：坐姿${form.value.sitSkipped ? '跳过' : form.value.sitLabel || '尚未确认'}；活动${activityDone || '跳过'}；睡眠影响${form.value.sleepImpact}；腿部${form.value.legChange || '尚未确认'}；活动：${form.value.activities.join('、') || '未记录'}；担心：${form.value.topWorry || '未记录'}`,
      verifyStatus: '尚未确认',
    });
    await api.createSymptomLog({
      careEventId: ev.id,
      sitMinutes,
      plannedActivityDone: activityDone,
      sleepImpact: form.value.sleepImpact,
      topWorry: form.value.topWorry,
      legChange: form.value.legChange || '尚未确认',
    });
    await loadData();
    alert('已保存到病程。');
  } catch (e: any) {
    alert(e.message || '保存失败');
  }
}

function submitLogAndContinue() {
  submitLog().then(() => router.push('/dashboard'));
}

async function loadData() {
  try {
    const episodes = await api.getEpisodes();
    episode.value = episodes[0] || null;
    const episodeId = episodes[0]?.id;
    if (episodeId) {
      timeline.value = await api.getTimeline(episodeId);
      const latest = await api.getLatestAnalysis(episodeId);
      if (latest.status === 'ok') {
        analysisVersion.value = latest.version;
        timeline.value.unshift({
          id: 'analysis-' + latest.analysisId,
          event_type: '分析',
          occurred_at: latest.createdAt,
          source_type: '系统生成',
          raw_text: '生成于模型 M-2609；使用最近报告与症状记录。',
          verify_status: '已确认',
          isToday: latest.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
        });
      }
    }
  } catch (e) {
    console.error('Failed to load timeline:', e);
  }
}

onMounted(loadData);
</script>

<style scoped>
.timeline-page {
  padding: 0;
}

.timeline-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}

.episode-card {
  margin-bottom: 20px;
}

.episode-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.episode-title {
  font-size: 17px;
  font-weight: 500;
}

.tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 3px 8px;
}

.tag-ok { background: #E5F6EE; color: var(--ok); }
.tag-warn { background: rgba(199, 119, 0, 0.1); color: var(--warn); }
.tag-error { background: rgba(217, 59, 59, 0.08); color: var(--error); }
.tag-source { background: var(--bg); color: var(--text-2); }

.episode-onset {
  font-size: 13px;
  color: var(--text-3);
  margin: 8px 0 16px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-box {
  background: var(--bg);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-num {
  font-size: 22px;
  font-weight: 600;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-3);
}

.chart-card {
  margin-bottom: 24px;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 15px;
  font-weight: 500;
}

.chart-unit {
  font-size: 12px;
  color: var(--text-3);
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding-top: 20px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 28px;
  border-radius: 4px 4px 0 0;
  background: var(--primary);
  min-height: 2px;
}

.bar.latest {
  background: var(--warn);
}

.bar-date {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 6px;
}

.chart-disclaimer {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 12px;
}

.section-label {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 14px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  padding-left: 18px;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--border);
}

.timeline-item {
  position: relative;
  display: flex;
  flex-direction: column;
}

.timeline-dot {
  position: absolute;
  left: -18px;
  top: 26px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--surface);
  transform: translateX(-1px);
}

.timeline-card {
  flex: 1;
  padding: 16px 20px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-date {
  font-size: 13px;
  color: var(--text-2);
}

.head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-type-tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 3px 8px;
}

.more-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text-3);
  cursor: pointer;
  padding: 0 4px;
}

.event-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
}

.tag-row {
  display: flex;
  gap: 8px;
}

.item-menu {
  margin-top: 10px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
}

.menu-item {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}

.menu-item.danger {
  color: var(--error);
}

.empty-state {
  text-align: center;
  color: var(--text-3);
  padding: 40px;
}

.record-panel {
  position: sticky;
  top: 24px;
}

.panel-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
}

.panel-note {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-1);
  margin-bottom: 8px;
}

.form-note {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 8px;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: var(--surface);
  font-family: inherit;
}

.chip-col {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  padding: 7px 16px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}

.chip.selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.chip.selected small {
  color: rgba(255, 255, 255, 0.85);
}

.chip-skip {
  color: var(--text-3);
}

.chip-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 14px;
}

.chip-pick small {
  font-size: 11px;
  color: var(--text-3);
}

.info-alert {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #E7F0FE;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 16px;
}

.info-alert img {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.btn-primary {
  width: 100%;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-block {
  width: 100%;
}

.link-btn {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 12px 0 0;
  text-align: center;
}
</style>
