<template>
  <view class="timeline">
    <view class="timeline__header">
      <text class="timeline__title">病程</text>
      <view class="timeline__header-actions">
        <text class="timeline__filter">▽</text>
        <text class="timeline__add">＋</text>
      </view>
    </view>

    <!-- 本次发作 -->
    <view class="card">
      <view class="timeline__episode-title">
        <text class="card-title">本次发作</text>
        <text class="timeline__episode-tag">保守治疗中</text>
      </view>
      <text class="timeline__episode-onset">起点：约 2026-08 中旬（自述，具体日期尚未确认）</text>
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
          <text class="timeline__stat-num">{{ stats.questions }}</text>
          <text class="timeline__stat-label">个复诊问题</text>
        </view>
      </view>
    </view>

    <!-- 最近 14 天 -->
    <view class="card">
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
        <text>09-08</text>
        <text>09-21</text>
      </view>
      <text class="timeline__chart-disclaimer">
        图中变化只反映你的记录，不代表影像变化或病情恶化。
      </text>
    </view>

    <!-- 记录时间线 -->
    <text class="timeline__section-title">记录（按事件，保留来源与核实状态）</text>
    <view class="timeline__timeline">
      <view v-for="(event, i) in events" :key="i" class="timeline__event">
        <view class="timeline__event-rail">
          <view class="timeline__event-dot" :class="`timeline__event-dot--${event.tone}`" />
          <view v-if="i < events.length - 1" class="timeline__event-line" />
        </view>
        <view class="timeline__event-card">
          <view class="timeline__event-header">
            <text class="timeline__event-date">{{ event.date }}</text>
            <text class="timeline__event-type" :class="`timeline__event-type--${event.tone}`">
              {{ event.type }}
            </text>
            <text class="timeline__event-more">⋯</text>
          </view>
          <text class="timeline__event-text">{{ event.text }}</text>
          <view class="timeline__event-tags">
            <StatusTag v-for="(tag, ti) in event.tags" :key="ti" :label="tag" />
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import { listEpisodes, timeline } from '@/api';

const stats = ref({ records: 12, reports: 1, analyses: 3, questions: 4 });
const chartData = ref(
  Array.from({ length: 14 }, (_, i) => ({
    height: 30 + Math.round(Math.abs(Math.sin(i * 1.7)) * 60),
    warn: i >= 11,
  })),
);
const events = ref<Array<{
  date: string;
  type: string;
  tone: string;
  text: string;
  tags: string[];
}>>([
  { date: '2026-09-21 · 今天', type: '症状记录', tone: 'ok', text: '与上周相比加重；能坐约 30 分钟；夜间痛醒 1 次；今天最担心“会不会越来越严重”。', tags: ['自述', '腿部无力：尚未确认'] },
  { date: '2026-09-18', type: '一页分析 v2', tone: 'info', text: '生成于模型 M-2609；使用报告 2026-08-30 与 9 条症状记录。', tags: ['系统生成', '可查看当时版本'] },
  { date: '2026-09-10', type: '医生建议', tone: 'warn', text: '医生建议保守治疗，4 周后复查。', tags: ['自述转述', '未经核实'] },
  { date: '2026-08-30', type: '检查报告', tone: 'info', text: '腰椎 MRI：L5/S1 椎间盘向后突出，相应硬膜囊受压…', tags: ['报告原文', '已录入'] },
  { date: '约 2026-08-15', type: '症状开始', tone: 'warn', text: '腰痛开始，起初以久坐后酸痛为主。', tags: ['自述', '日期尚未确认'] },
]);


onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      await timeline(episodes[0].id);
    }
  } catch {
    // 加载失败不阻塞
  }
});
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
  min-height: 8px;
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
</style>
