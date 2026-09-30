<template>
  <AppLayout>
    <div class="dashboard">
      <div class="dashboard__header">
        <h1 class="dashboard__title">仪表盘 · {{ today }}</h1>
      </div>

      <!-- 统计卡片 -->
      <div class="dashboard__stats">
        <div class="stat-card">
          <div class="stat-card__label">今日分析任务</div>
          <div class="stat-card__value">{{ stats.tasks.today }}</div>
          <div class="stat-card__sub">成功 {{ stats.tasks.today - stats.tasks.failed }} · 失败 {{ stats.tasks.failed }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">失败率（{{ stats.failureRate?.window ?? '15 分钟' }}）</div>
          <div class="stat-card__value" :class="failureRateClass">{{ failureRate }}%</div>
          <div class="stat-card__sub">告警阈值 5% · 窗口内 {{ stats.failureRate?.total ?? 0 }} 次任务</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">阻断（今日）</div>
          <div class="stat-card__value stat-card__value--warn">{{ stats.tasks.blocked }}</div>
          <div class="stat-card__sub">安全规则引擎停止个性化</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">待医学审核内容</div>
          <div class="stat-card__value stat-card__value--warn">{{ stats.pendingReview }}</div>
          <div class="stat-card__sub">待审状态的内容</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">待处理举报</div>
          <div class="stat-card__value stat-card__value--error">{{ stats.pendingReports.total }}</div>
          <div class="stat-card__sub">高 {{ stats.pendingReports.high }} · 中 {{ stats.pendingReports.mid }} · 低 {{ stats.pendingReports.low }}</div>
        </div>
      </div>

      <div class="dashboard__grid">
        <div class="dashboard__main">
          <!-- 最近 7 天 -->
          <div class="card">
            <div class="card__header">
              <div class="card__title">最近 7 天 · 分析任务量与失败数</div>
              <span class="card__tag">仅统计，不含个人内容</span>
            </div>
            <div class="chart">
              <div v-for="(d, i) in chartData" :key="i" class="chart__col">
                <div class="chart__bar-wrap">
                  <div class="chart__bar" :style="{ height: `${d.height}%` }" />
                  <div class="chart__bar-fail" :style="{ height: `${d.failHeight}%` }" />
                </div>
                <div class="chart__label">{{ d.label }}</div>
              </div>
            </div>
          </div>

          <!-- 安全事件 -->
          <div class="card">
            <div class="card__header">
              <div class="card__title">⚠ 安全事件（24 小时）</div>
              <button class="btn btn--text" @click="goSafety">查看全部</button>
            </div>
            <table class="table">
              <thead>
                <tr><th>规则</th><th>严重度</th><th>动作</th><th>来源</th><th>时间</th></tr>
              </thead>
              <tbody>
                <tr v-for="(e, i) in stats.safetyEvents" :key="i">
                  <td>{{ e.ruleCode }}</td>
                  <td><StatusTag :label="e.severity" /></td>
                  <td>{{ e.actionTaken }}</td>
                  <td>{{ e.source }}</td>
                  <td>{{ formatTime(e.createdAt) }}</td>
                </tr>
                <tr v-if="stats.safetyEvents.length === 0">
                  <td colspan="5" class="table__empty">24 小时内无安全事件</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dashboard__side">
          <!-- 功能开关状态 -->
          <div class="card">
            <div class="card__title">⏻ 功能开关状态</div>
            <div v-for="sw in stats.switches" :key="sw.key" class="switch-item">
              <div class="switch-item__body">
                <div class="switch-item__name">{{ switchLabel(sw.key) }}</div>
                <div class="switch-item__key">{{ sw.key }}</div>
              </div>
              <span class="switch" :class="{ 'switch--on': sw.enabled }" />
            </div>
          </div>

          <!-- 评测门禁 -->
          <div class="card">
            <div class="card__title card__title--ok">✓ 评测门禁 · 最近运行</div>
            <div v-for="(e, i) in stats.evalRuns" :key="i" class="eval-item">
              <span class="eval-item__name">{{ e.evalSetName }}</span>
              <span class="eval-item__result" :class="e.result === '通过' ? 'eval-item__result--ok' : 'eval-item__result--error'">
                {{ e.result ?? '—' }}
              </span>
            </div>
            <p v-if="stats.evalRuns.length === 0" class="card__note">暂无评测运行记录</p>
          </div>

          <!-- 待办 -->
          <div class="card">
            <div class="card__title">待办</div>
            <div v-for="(item, i) in todos" :key="i" class="todo-item">
              <span class="todo-item__dot" :class="`todo-item__dot--${item.tone}`" />
              <span>{{ item.text }}</span>
            </div>
            <p v-if="todos.length === 0" class="card__note">暂无待办</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { getDashboard } from '@/api';
import type { DashboardStats } from '@/api/types';

const router = useRouter();
// 北京时间日期
const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
const stats = ref<DashboardStats>({
  tasks: { total: 0, today: 0, failed: 0, blocked: 0 },
  failureRate: { window: '15 分钟', total: 0, failed: 0, rate: 0 },
  dailyTasks: [],
  pendingReview: 0,
  pendingReports: { total: 0, high: 0, mid: 0, low: 0 },
  safetyEvents: [],
  switches: [],
  evalRuns: [],
});

const failureRate = computed(() => {
  const fr = stats.value.failureRate;
  if (!fr || fr.total === 0) return '0.0';
  return fr.rate.toFixed(1);
});

const failureRateClass = computed(() => {
  const fr = stats.value.failureRate;
  if (!fr) return 'stat-card__value--ok';
  return fr.rate > 5 ? 'stat-card__value--error' : 'stat-card__value--ok';
});

/** 最近 7 天柱状图（真实数据，无任务的天为 0） */
const chartData = computed(() => {
  const max = Math.max(1, ...stats.value.dailyTasks.map((d) => d.count));
  return stats.value.dailyTasks.map((d) => ({
    label: d.date.slice(5),
    height: Math.round((d.count / max) * 100),
    failHeight: 0,
  }));
});

/** 待办：来自待审内容与待处理举报 */
const todos = computed(() => {
  const items: Array<{ tone: string; text: string }> = [];
  if (stats.value.pendingReview > 0) {
    items.push({ tone: 'warn', text: `审核：${stats.value.pendingReview} 条内容待医学审核` });
  }
  if (stats.value.pendingReports.high > 0) {
    items.push({ tone: 'error', text: `复核高严重度举报 ${stats.value.pendingReports.high} 条` });
  }
  if (stats.value.tasks.blocked > 0) {
    items.push({ tone: 'info', text: `今日 ${stats.value.tasks.blocked} 次分析被安全规则阻断` });
  }
  return items;
});

function switchLabel(key: string) {
  const map: Record<string, string> = {
    个性化分析: '个性化分析',
    视频推荐: '视频推荐',
    拍照提取: '拍照提取（OCR）',
    案例卡片: '案例卡片（二期）',
  };
  return map[key] ?? key;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function goSafety() {
  router.push({ name: 'safety' });
}

onMounted(async () => {
  try {
    stats.value = await getDashboard();
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.dashboard__header {
  margin-bottom: 20px;
}
.dashboard__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
}
.stat-card__label {
  font-size: 12px;
  color: var(--text-2);
}
.stat-card__value {
  font-size: 28px;
  font-weight: 500;
  margin: 4px 0;
}
.stat-card__value--ok { color: var(--ok); }
.stat-card__value--warn { color: var(--warn); }
.stat-card__value--error { color: var(--error); }
.stat-card__sub {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.5;
}
.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;
}
.dashboard__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dashboard__side {
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
.card__title--ok {
  color: var(--ok);
}
.card__tag {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 10px;
  border-radius: 4px;
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 12px 0 0;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 140px;
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
  height: 120px;
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
  vertical-align: middle;
}
.table__empty {
  text-align: center;
  color: var(--text-3);
  padding: 16px 0;
}
.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.switch-item:last-child {
  border-bottom: none;
}
.switch-item__name {
  font-size: 14px;
  font-weight: 500;
}
.switch-item__key {
  font-size: 11px;
  color: var(--text-3);
}
.switch {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--border);
  position: relative;
  flex-shrink: 0;
}
.switch::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  top: 2px;
  left: 2px;
}
.switch--on {
  background: var(--ok);
}
.switch--on::after {
  left: 20px;
}
.eval-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.eval-item:last-child {
  border-bottom: none;
}
.eval-item__name {
  font-size: 13px;
}
.eval-item__result {
  font-size: 13px;
  font-weight: 500;
}
.eval-item__result--ok { color: var(--ok); }
.eval-item__result--error { color: var(--error); }
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.5;
}
.todo-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
.todo-item__dot--warn { background: var(--warn); }
.todo-item__dot--error { background: var(--error); }
.todo-item__dot--info { background: var(--info); }
.btn {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
</style>
