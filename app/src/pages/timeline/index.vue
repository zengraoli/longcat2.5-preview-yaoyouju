<template>
  <view class="timeline">
    <view class="timeline__header">
      <text class="timeline__title">病程</text>
      <view class="timeline__header-actions">
        <text class="timeline__filter" @click="showFilter = !showFilter">▽</text>
        <text class="timeline__add" @click="goAdd">＋</text>
      </view>
    </view>

    <!-- 筛选 -->
    <view v-if="showFilter" class="card">
      <view class="timeline__filter-chips">
        <AppChip
          v-for="f in filters"
          :key="f"
          :state="activeFilter === f ? 'selected' : 'unselected'"
          @click="activeFilter = f"
        >
          {{ f }}
        </AppChip>
      </view>
    </view>

    <!-- 本次发作 -->
    <view class="card" v-if="episode">
      <view class="timeline__episode-title">
        <text class="card-title">{{ episode.title }}</text>
        <text class="timeline__episode-tag">{{ episode.status === 'active' ? '进行中' : episode.status }}</text>
      </view>
      <text class="timeline__episode-onset">
        起点：{{ episode.onsetDate ? `${episode.onsetDate}（${episode.onsetCertainty}）` : '尚未确认' }}
      </text>
      <view class="timeline__stats">
        <view class="timeline__stat">
          <text class="timeline__stat-num">{{ stats.records }}</text>
          <text class="timeline__stat-label">条记录</text>
        </view>
        <view class="timeline__stat">
          <text class="timeline__stat-num">{{ stats.reports }}</text>
          <text class="timeline__stat-label">份报告</text>
        </view>
        <view class="timeline__stat">
          <text class="timeline__stat-num">{{ stats.analyses }}</text>
          <text class="timeline__stat-label">次分析</text>
        </view>
        <view class="timeline__stat">
          <text class="timeline__stat-num">{{ stats.logs }}</text>
          <text class="timeline__stat-label">次记录</text>
        </view>
      </view>
    </view>

    <!-- 最近 14 天 -->
    <view class="card" v-if="chartData.length > 0">
      <view class="timeline__chart-title">
        <text class="card-title">最近 14 天 · 每天能坐多久</text>
        <text class="timeline__chart-unit">分钟</text>
      </view>
      <view class="timeline__chart">
        <view
          v-for="(v, i) in chartData"
          :key="i"
          class="timeline__bar"
          :class="{ 'timeline__bar--warn': v.warn }"
          :style="{ height: `${v.height}%` }"
        />
      </view>
      <view class="timeline__chart-labels">
        <text>{{ chartLabels[0] }}</text>
        <text>{{ chartLabels[1] }}</text>
      </view>
      <text class="timeline__chart-disclaimer">
        图中变化只反映你的记录，不代表影像变化或病情恶化。
      </text>
    </view>

    <!-- 记录时间线 -->
    <text class="timeline__section-title">记录（按事件，保留来源与核实状态）</text>
    <view v-if="filteredEvents.length === 0" class="card">
      <text class="timeline__empty">暂无记录</text>
    </view>
    <view v-for="(event, i) in filteredEvents" :key="event.id" class="timeline__event">
      <view class="timeline__event-rail">
        <view class="timeline__event-dot" :class="`timeline__event-dot--${toneOf(event)}`" />
        <view v-if="i < filteredEvents.length - 1" class="timeline__event-line" />
      </view>
      <view class="timeline__event-card">
        <view class="timeline__event-header">
          <text class="timeline__event-date">{{ formatEventDate(event.occurredAt) }}</text>
          <text class="timeline__event-type" :class="`timeline__event-type--${toneOf(event)}`">
            {{ event.eventType }}
          </text>
          <text class="timeline__event-more" @click="onEventMore(event)">⋯</text>
        </view>
        <text class="timeline__event-text">{{ eventText(event) }}</text>
        <view class="timeline__event-tags">
          <StatusTag :label="event.sourceType" />
          <StatusTag :label="event.verifyStatus" />
        </view>
      </view>
    </view>

    <!-- 新增事件弹层 -->
    <view v-if="showAdd" class="mask" @click="showAdd = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">新增记录</text>
        <picker :range="eventTypes" :value="addTypeIndex" @change="onAddTypeChange">
          <view class="dialog__picker">{{ eventTypes[addTypeIndex] }}</view>
        </picker>
        <picker mode="date" :value="addDate" @change="onAddDateChange">
          <view class="dialog__picker">{{ addDate || '选择日期' }}</view>
        </picker>
        <textarea
          v-model="addText"
          class="dialog__textarea"
          placeholder="记录原文（如报告片段、医嘱、症状变化）"
          placeholder-class="dialog__placeholder"
          :maxlength="2000"
        />
        <AppButton block @click="onAddEvent">保存</AppButton>
        <text class="dialog__cancel" @click="showAdd = false">取消</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { beijingDate } from '@/utils/time';
import { onShow } from '@dcloudio/uni-app';
import StatusTag from '@/components/StatusTag.vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import { listEpisodes, timeline, addEvent, getLatestAnalysis, checkSafety, type CareEvent } from '@/api';

const episode = ref<{ id: string; title: string; onsetDate: string | null; onsetCertainty: string; status: string } | null>(null);
const events = ref<CareEvent[]>([]);
const symptomLogs = ref<Array<{ occurredAt: string; sitMinutes: number | '尚未确认' }>>([]);
const stats = ref({ records: 0, reports: 0, analyses: 0, logs: 0 });
const showFilter = ref(false);
const activeFilter = ref('全部');
const filters = ['全部', '报告', '症状', '医嘱', '行动'];
const showAdd = ref(false);
const eventTypes = ['症状', '报告', '医嘱', '行动', '结局'];
const addTypeIndex = ref(0);
const addDate = ref('');
const addText = ref('');

const filteredEvents = computed(() => {
  if (activeFilter.value === '全部') return events.value;
  return events.value.filter((e) => e.eventType === activeFilter.value);
});

const chartData = computed(() => {
  // 最近 14 天，每天能坐多久（分钟）
  const days: Array<{ date: string; minutes: number | null }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: beijingDate(d), minutes: null });
  }
  for (const log of symptomLogs.value) {
    const day = days.find((d) => d.date === log.occurredAt.slice(0, 10));
    if (day && typeof log.sitMinutes === 'number') day.minutes = log.sitMinutes;
  }
  return days.map((d) => ({
    height: d.minutes === null ? 0 : Math.min(100, Math.round((d.minutes / 90) * 100)),
    warn: d.minutes !== null && d.minutes < 15,
  }));
});

const chartLabels = computed(() => {
  const fmt = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(5, 10);
  };
  return [fmt(13), fmt(0)];
});

function toneOf(event: CareEvent): string {
  if (event.sourceType === '报告原文') return 'info';
  if (event.verifyStatus === '尚未确认') return 'warn';
  return 'ok';
}

/** 事件显示文本：症状记录显示字段摘要，其他显示原文 */
function eventText(event: CareEvent & { symptomLog?: { sitMinutes: number | '尚未确认'; topWorry: string | '尚未确认'; legChange: string | '尚未确认'; plannedActivityDone: string | '尚未确认' } }): string {
  if (event.eventType === '症状' && event.symptomLog) {
    const parts: string[] = [];
    const log = event.symptomLog;
    if (log.topWorry && log.topWorry !== '尚未确认') parts.push(`最担心：${log.topWorry}`);
    if (log.legChange && log.legChange !== '尚未确认') parts.push(`腿部：${log.legChange}`);
    if (log.plannedActivityDone && log.plannedActivityDone !== '尚未确认') parts.push(`活动：${log.plannedActivityDone}`);
    if (typeof log.sitMinutes === 'number') parts.push(`能坐约 ${log.sitMinutes} 分钟`);
    return parts.length > 0 ? parts.join('；') : '记录今天（字段见记录页）';
  }
  return event.rawText || '（无原文）';
}

function formatEventDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function goAdd() {
  addDate.value = beijingDate();
  showAdd.value = true;
}

function onAddTypeChange(e: { detail: { value: number } }) {
  addTypeIndex.value = e.detail.value;
}
function onAddDateChange(e: { detail: { value: string } }) {
  addDate.value = e.detail.value;
}

async function onAddEvent() {
  if (!episode.value || !addText.value.trim()) {
    uni.showToast({ title: '请填写记录内容', icon: 'none' });
    return;
  }
  try {
    await addEvent(episode.value.id, {
      eventType: eventTypes[addTypeIndex.value],
      occurredAt: new Date(addDate.value).toISOString(),
      sourceType: addTypeIndex.value === 1 ? '报告原文' : '自述',
      rawText: addText.value,
    });
    showAdd.value = false;
    const savedText = addText.value;
    addText.value = '';
    uni.showToast({ title: '已保存', icon: 'success' });
    await load();
    // 红旗预检：命中红旗时立即提示就医（记录已保存，不阻断）
    const text = savedText.trim();
    if (text) {
      try {
        const safety = await checkSafety(text, 'event');
        if (!safety.passed && safety.redFlags.length > 0) {
          uni.showModal({
            title: '需要及时寻求专业帮助',
            content: safety.redFlags.map((r) => r.message).join(''),
            showCancel: false,
            success: () => {
              uni.navigateTo({ url: '/pages/redflag/index' });
            },
          });
        }
      } catch {
        // 预检失败不阻断
      }
    }
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function onEventMore(event: CareEvent) {
  uni.showActionSheet({
    itemList: ['删除'],
    success: async (res) => {
      if (res.tapIndex === 0) {
        uni.showModal({
          title: '删除记录',
          content: '确定删除这条记录吗？',
          success: async (confirmRes) => {
            if (confirmRes.confirm) {
              try {
                const { deleteEvent } = await import('@/api');
                await deleteEvent(event.id);
                uni.showToast({ title: '已删除', icon: 'success' });
                await load();
              } catch (e) {
                uni.showToast({ title: (e as Error).message, icon: 'none' });
              }
            }
          },
        });
      }
    },
  });
}

async function load() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) return;
    episode.value = episodes[0];
    const tl = await timeline(episodes[0].id);
    // 把症状记录字段挂到对应事件上，避免时间线显示“（无原文）”
    const logByEventId = new Map(tl.symptomLogs.map((l) => [l.careEventId, l]));
    events.value = tl.events.map((e) => ({
      ...e,
      symptomLog: logByEventId.get(e.id),
    }));
    symptomLogs.value = tl.symptomLogs.map((l) => ({ occurredAt: l.occurredAt, sitMinutes: l.sitMinutes }));
    // 分析次数：查该病程的最新分析版本号
    let analysisCount = 0;
    try {
      const latest = await getLatestAnalysis(episodes[0].id);
      if (latest) analysisCount = latest.version;
    } catch {
      // 忽略
    }
    stats.value = {
      records: tl.events.length,
      reports: tl.events.filter((e) => e.eventType === '报告').length,
      analyses: analysisCount,
      logs: tl.symptomLogs.length,
    };
  } catch {
    // 加载失败不阻塞
  }
}

onMounted(load);
onShow(load);
</script>

<style scoped>
.timeline {
  min-height: 100vh;
  padding: 16px 16px 100px;
}
.timeline__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.timeline__title {
  font-size: 17px;
  font-weight: 500;
}
.timeline__header-actions {
  display: flex;
  gap: 16px;
}
.timeline__filter { color: var(--text-2); font-size: 16px; }
.timeline__add { color: var(--text-1); font-size: 22px; }
.timeline__filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.timeline__episode-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.timeline__episode-tag {
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-light);
  padding: 2px 10px;
  border-radius: 4px;
}
.timeline__episode-onset {
  font-size: 13px;
  color: var(--text-2);
  display: block;
  margin-bottom: 16px;
}
.timeline__stats {
  display: flex;
  gap: 8px;
}
.timeline__stat {
  flex: 1;
  background: var(--bg);
  border-radius: 10px;
  padding: 12px 4px;
  text-align: center;
}
.timeline__stat-num {
  font-size: 20px;
  font-weight: 500;
  color: var(--primary);
  display: block;
}
.timeline__stat-label {
  font-size: 11px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
}
.timeline__chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.timeline__chart-unit {
  font-size: 12px;
  color: var(--text-3);
}
.timeline__chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100px;
  margin-bottom: 4px;
}
.timeline__bar {
  flex: 1;
  background: var(--primary);
  border-radius: 3px 3px 0 0;
  min-height: 4px;
}
.timeline__bar--warn {
  background: var(--warn);
}
.timeline__chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 8px;
}
.timeline__chart-disclaimer {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
}
.timeline__section-title {
  font-size: 15px;
  font-weight: 500;
  display: block;
  margin: 16px 0 12px;
}
.timeline__empty {
  font-size: 14px;
  color: var(--text-3);
  text-align: center;
  display: block;
  padding: 12px 0;
}
.timeline__event {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.timeline__event-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}
.timeline__event-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.timeline__event-dot--ok { border-color: var(--ok); background: var(--ok); }
.timeline__event-dot--info { border-color: var(--info); background: var(--info); }
.timeline__event-dot--warn { border-color: var(--warn); background: var(--warn); }
.timeline__event-line {
  flex: 1;
  width: 2px;
  background: var(--border);
  margin: 4px 0;
}
.timeline__event-card {
  flex: 1;
  background: var(--surface);
  border-radius: 12px;
  padding: 12px;
}
.timeline__event-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.timeline__event-date {
  font-size: 13px;
  color: var(--text-2);
  flex: 1;
}
.timeline__event-type {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
}
.timeline__event-type--ok { color: var(--ok); background: rgba(30, 158, 90, 0.1); }
.timeline__event-type--info { color: var(--info); background: rgba(47, 111, 216, 0.1); }
.timeline__event-type--warn { color: var(--warn); background: rgba(199, 119, 0, 0.1); }
.timeline__event-more { color: var(--text-3); }
.timeline__event-text {
  font-size: 14px;
  line-height: 1.5;
  display: block;
  margin-bottom: 8px;
}
.timeline__event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 32px;
}
.dialog {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
}
.dialog__title { font-size: 16px; font-weight: 500; margin-bottom: 12px; }
.dialog__picker {
  min-height: 44px;
  display: flex;
  align-items: center;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  margin-bottom: 12px;
  font-size: 14px;
}
.dialog__textarea {
  width: 100%;
  min-height: 100px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.dialog__placeholder { color: var(--text-3); }
.dialog__cancel {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 12px;
  min-height: 44px;
  line-height: 44px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 500;
}
</style>
