<template>
  <div class="timeline-layout">
    <div class="timeline-main">
      <div class="chart-card card">
        <h3 class="chart-title">近 14 天记录</h3>
        <p class="chart-disclaimer">变化图仅反映记录趋势，不暗示影像恶化</p>
        <div class="chart-placeholder">
          <span>📊 14 天趋势图</span>
        </div>
      </div>

      <div class="timeline-list">
        <div class="timeline-item" v-for="item in timeline" :key="item.id">
          <div class="timeline-dot"></div>
          <div class="timeline-card card">
            <div class="card-header">
              <span class="event-type">{{ item.event_type }}</span>
              <span class="event-time">{{ formatDate(item.occurred_at) }}</span>
            </div>
            <span class="event-source">来源: {{ item.source_type }}</span>
            <p class="event-text">{{ item.raw_text || '暂无描述' }}</p>
            <div class="verify-row">
              <span class="tag" :class="item.verify_status === '已确认' ? 'tag-ok' : 'tag-warn'">
                {{ item.verify_status }}
              </span>
            </div>
          </div>
        </div>
        <div class="empty-state card" v-if="timeline.length === 0">
          <p>暂无病程记录</p>
        </div>
      </div>
    </div>

    <aside class="record-panel">
      <h3 class="panel-title">记录今天</h3>
      <div class="card">
        <div class="form-group">
          <label>今天能坐多久</label>
          <select v-model="form.sitMinutes">
            <option :value="null">跳过</option>
            <option :value="15">&lt; 30分钟</option>
            <option :value="45">30-60分钟</option>
            <option :value="90">1-2小时</option>
            <option :value="150">&gt; 2小时</option>
          </select>
        </div>
        <div class="form-group">
          <label>计划活动完成情况</label>
          <select v-model="form.activityDone">
            <option>已完成</option>
            <option>部分完成</option>
            <option>未完成</option>
            <option>未计划</option>
          </select>
        </div>
        <div class="form-group">
          <label>睡眠影响（1-5）</label>
          <input type="range" v-model="form.sleepImpact" min="1" max="5" />
          <span>{{ form.sleepImpact }}</span>
        </div>
        <div class="form-group">
          <label>最担心的事</label>
          <input v-model="form.topWorry" placeholder="可选" />
        </div>
        <div class="form-group">
          <label>腿部变化</label>
          <select v-model="form.legChange">
            <option>无</option>
            <option>有改善</option>
            <option>有加重</option>
            <option>尚未确认</option>
          </select>
        </div>
        <button class="btn-primary" @click="submitLog">保存记录</button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const timeline = ref<any[]>([]);
const form = ref({
  sitMinutes: null as number | null,
  activityDone: '已完成',
  sleepImpact: 3,
  topWorry: '',
  legChange: '无',
});

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

async function submitLog() {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) return;
    const episodeId = episodes[0].id;
    const careEvent = await api.createCareEvent({
      episodeId,
      eventType: '症状',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: `日常记录: 坐姿${form.value.sitMinutes ?? '跳过'}, 活动${form.value.activityDone}, 睡眠影响${form.value.sleepImpact}`,
      verifyStatus: '尚未确认',
    });
    await api.createSymptomLog({
      careEventId: careEvent.id,
      sitMinutes: form.value.sitMinutes,
      plannedActivityDone: form.value.activityDone,
      sleepImpact: form.value.sleepImpact,
      topWorry: form.value.topWorry,
      legChange: form.value.legChange,
    });
    await loadTimeline();
  } catch (e) {
    console.error('Failed to submit log:', e);
  }
}

async function loadTimeline() {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) return;
    const episodeId = episodes[0].id;
    timeline.value = await api.getTimeline(episodeId);
  } catch (e) {
    console.error('Failed to load timeline:', e);
  }
}

onMounted(() => {
  loadTimeline();
});
</script>

<style scoped>
.timeline-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  padding: 24px 40px;
}

.card {
  margin-bottom: 20px;
}

.chart-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.chart-disclaimer {
  font-size: 11px;
  color: var(--warn);
  margin-bottom: 12px;
}

.chart-placeholder {
  height: 160px;
  background: var(--bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
}

.timeline-list {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  margin-top: 20px;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.event-type {
  font-size: 13px;
  font-weight: 500;
}

.event-time {
  font-size: 11px;
  color: var(--text-3);
}

.event-source {
  font-size: 11px;
  color: var(--text-3);
}

.event-text {
  font-size: 13px;
  color: var(--text-1);
  margin-top: 8px;
}

.verify-row {
  margin-top: 8px;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 6px;
}

.form-group select,
.form-group input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
}

.form-group input[type='range'] {
  padding: 0;
}
</style>
