<template>
  <div class="dashboard">
    <h1 class="page-title">仪表盘</h1>

    <div class="stats-grid">
      <div class="stat-card card">
        <span class="stat-label">分析量（累计）</span>
        <span class="stat-value">{{ stats.analyses }}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">失败率</span>
        <span class="stat-value">{{ stats.failureRate }}%</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">平均耗时</span>
        <span class="stat-value">{{ formatDuration(stats.avgDurationMs) }}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">成本（累计）</span>
        <span class="stat-value">¥{{ stats.cost.toFixed(2) }}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">待审内容</span>
        <span class="stat-value warn">{{ stats.pendingReviews }}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">待处理举报</span>
        <span class="stat-value warn">{{ stats.pendingReports }}</span>
      </div>
    </div>

    <div class="dash-columns">
      <section class="card">
        <div class="card-head">
          <h2 class="card-title">近 7 天分析量</h2>
          <span class="head-note">按完成时间统计</span>
        </div>
        <div class="trend-chart">
          <div class="trend-bar" v-for="d in trend" :key="d.date">
            <div class="trend-col">
              <span class="trend-num">{{ d.count }}</span>
              <div class="trend-body" :style="{ height: trendHeight(d.count) + 'px' }"></div>
            </div>
            <span class="trend-date">{{ d.date.slice(5).replace('-', '/') }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2 class="card-title">待办事项</h2>
          <span class="head-note">{{ dashboard.todo.length }} 项</span>
        </div>
        <ul class="todo-list">
          <li class="todo-item" v-for="(item, i) in dashboard.todo" :key="i">
            <span class="todo-type">{{ item.type }}</span>
            <span class="todo-title">{{ item.title }}</span>
          </li>
          <li v-if="dashboard.todo.length === 0" class="empty-note">暂无待办</li>
        </ul>
      </section>
    </div>

    <div class="dash-columns">
      <section class="card">
        <div class="card-head">
          <h2 class="card-title">安全事件</h2>
          <span class="head-note">{{ dashboard.safetyEvents.length }} 条</span>
        </div>
        <table class="data-table">
          <thead>
            <tr><th>规则</th><th>严重度</th><th>动作</th><th>时间</th></tr>
          </thead>
          <tbody>
            <tr v-for="ev in dashboard.safetyEvents" :key="ev.id">
              <td>{{ ev.rule_code }}</td>
              <td><span class="tag" :class="ev.severity === 'high' ? 'tag-error' : 'tag-warn'">{{ ev.severity }}</span></td>
              <td>{{ ev.action_taken }}</td>
              <td>{{ formatTime(ev.created_at) }}</td>
            </tr>
            <tr v-if="dashboard.safetyEvents.length === 0"><td colspan="4" class="empty-cell">暂无安全事件</td></tr>
          </tbody>
        </table>
      </section>

      <section class="card">
        <div class="card-head">
          <h2 class="card-title">功能开关</h2>
        </div>
        <ul class="switch-list">
          <li class="switch-item" v-for="sw in featureSwitches" :key="sw.key">
            <span class="switch-name">{{ switchLabel(sw.key) }}</span>
            <span class="tag" :class="sw.enabled ? 'tag-ok' : 'tag-muted'">{{ sw.enabled ? '已开启' : '已关闭' }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const dashboard = ref<any>({ todo: [], safetyEvents: [] });
const stats = ref({
  analyses: 0,
  failureRate: 0,
  avgDurationMs: 0,
  cost: 0,
  pendingReviews: 0,
  pendingReports: 0,
});
const trend = ref<{ date: string; count: number }[]>([]);
const featureSwitches = ref<{ key: string; enabled: boolean; reason?: string }[]>([]);

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '-';
}

function formatDuration(ms: number) {
  if (!ms) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function trendHeight(count: number) {
  const max = Math.max(1, ...trend.value.map((d) => d.count));
  return Math.round((count / max) * 120);
}

function switchLabel(key: string) {
  return {
    personalized_analysis: '个性化分析',
    video_recommendation: '视频推荐',
    case_card: '案例卡片',
  }[key] || key;
}

onMounted(async () => {
  try {
    const data = await api.getAdminDashboard();
    dashboard.value = data;
    stats.value = data.stats;
    trend.value = data.trend7d;
  } catch (e) {
    console.error('Failed to load dashboard:', e);
  }
  try {
    featureSwitches.value = await api.getFeatureSwitches();
  } catch (e) {
    console.error('Failed to load feature switches:', e);
  }
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-3);
}

.stat-value {
  font-size: 26px;
  font-weight: 600;
  color: var(--primary);
}

.stat-value.warn {
  color: var(--warn);
}

.dash-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
}

.head-note {
  font-size: 12px;
  color: var(--text-3);
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  height: 180px;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trend-col {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.trend-num {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
}

.trend-body {
  width: 100%;
  max-width: 36px;
  background: var(--primary);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
}

.trend-date {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 6px;
}

.todo-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  gap: 12px;
  align-items: baseline;
  font-size: 13px;
}

.todo-type {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--info);
  background: #E7F0FE;
  border-radius: 4px;
  padding: 2px 8px;
}

.empty-note {
  color: var(--text-3);
  font-size: 13px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--text-3);
  font-weight: 500;
  font-size: 12px;
}

.empty-cell {
  text-align: center;
  color: var(--text-3);
  padding: 24px;
}

.tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 3px 8px;
}

.tag-ok { background: #E5F6EE; color: var(--ok); }
.tag-error { background: rgba(217, 59, 59, 0.08); color: var(--error); }
.tag-warn { background: rgba(199, 119, 0, 0.1); color: var(--warn); }
.tag-muted { background: var(--bg); color: var(--text-3); }

.switch-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
</style>
