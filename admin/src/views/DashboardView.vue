<template>
  <AppLayout>
    <div class="dashboard">
      <div class="dashboard__header">
        <h1 class="dashboard__title">仪表盘 · {{ today }}</h1>
        <div class="dashboard__search">
          <input class="dashboard__search-input" placeholder="🔍 搜索内容 / 工单 / 匿名标识" />
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="dashboard__stats">
        <div class="stat-card">
          <div class="stat-card__label">今日分析任务</div>
          <div class="stat-card__value">{{ stats.tasks.today }}</div>
          <div class="stat-card__sub">成功 {{ stats.tasks.today - stats.tasks.failed }} · 失败 {{ stats.tasks.failed }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">失败率（15 分钟）</div>
          <div class="stat-card__value stat-card__value--ok">{{ failureRate }}%</div>
          <div class="stat-card__sub">告警阈值 5%</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">P95 生成时长</div>
          <div class="stat-card__value stat-card__value--ok">41 s</div>
          <div class="stat-card__sub">告警阈值 90 s</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">今日模型成本</div>
          <div class="stat-card__value">¥ 86.4</div>
          <div class="stat-card__sub">预算 ¥150 · 已用 58%</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">待医学审核内容</div>
          <div class="stat-card__value stat-card__value--warn">{{ stats.pendingReview }}</div>
          <div class="stat-card__sub">最早提交 2 天前</div>
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
              <button class="btn btn--text">查看全部</button>
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
                {{ e.result }}
              </span>
            </div>
            <p class="card__note">候选发布 R-2026.09.21-C 被阻断：左右侧混淆 1 例，待修复后重跑。</p>
          </div>

          <!-- 待办 -->
          <div class="card">
            <div class="card__title">待办</div>
            <div class="todo-item">
              <span class="todo-item__dot todo-item__dot--warn" />
              <span>审核：“保守治疗期间的日常活动建议” v2（更正中）</span>
            </div>
            <div class="todo-item">
              <span class="todo-item__dot todo-item__dot--warn" />
              <span>复核举报 #ER-0213（左右侧混淆 · 高）</span>
            </div>
            <div class="todo-item">
              <span class="todo-item__dot todo-item__dot--info" />
              <span>核实证据条目：指南 G-07 许可待确认</span>
            </div>
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
import { getDashboard } from '@/api';
import type { DashboardStats } from '@/api/types';

const today = new Date().toISOString().slice(0, 10);
const stats = ref<DashboardStats>({
  tasks: { total: 0, today: 0, failed: 0, blocked: 0 },
  pendingReview: 0,
  pendingReports: { total: 0, high: 0, mid: 0, low: 0 },
  safetyEvents: [],
  switches: [],
  evalRuns: [],
});

const failureRate = computed(() =>
  stats.value.tasks.today === 0 ? '0.0' : ((stats.value.tasks.failed / stats.value.tasks.today) * 100).toFixed(1),
);

const chartData = ref(
  Array.from({ length: 7 }, (_, i) => ({
    label: `09-${15 + i}`,
    height: 40 + Math.round(Math.abs(Math.sin(i * 1.3)) * 50),
    failHeight: 5,
  })),
);

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.dashboard__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.dashboard__search-input {
  width: 320px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
}
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
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
.card__tag {
  font-size: 12px;
  color: var(--text-3);
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
.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
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
  margin-bottom: 8px;
  font-size: 13px;
}
.eval-item__result--ok { color: var(--ok); }
.eval-item__result--error { color: var(--error); }
.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 10px;
  line-height: 1.5;
}
.todo-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.todo-item__dot--warn { background: var(--warn); }
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
.btn--primary { background: var(--primary); color: #fff; }
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
</style>
