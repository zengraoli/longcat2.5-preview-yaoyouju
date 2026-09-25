<template>
  <div class="dashboard">
    <h2 class="page-title">仪表盘</h2>
    <div class="stats-grid">
      <div class="card stat-card">
        <span class="stat-label">分析量</span>
        <span class="stat-value">{{ stats.analyses }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">失败率</span>
        <span class="stat-value">{{ stats.failureRate }}%</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">平均耗时</span>
        <span class="stat-value">{{ stats.avgDuration }}ms</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">待审内容</span>
        <span class="stat-value">{{ stats.pendingReviews }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">待处理举报</span>
        <span class="stat-value">{{ stats.pendingReports }}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-label">安全事件</span>
        <span class="stat-value">{{ stats.safetyEvents }}</span>
      </div>
    </div>

    <div class="dashboard-sections">
      <div class="card">
        <h3 class="section-title">功能开关状态</h3>
        <div class="switch-list">
          <div class="switch-item" v-for="sw in featureSwitches" :key="sw.key">
            <span class="switch-name">{{ sw.key }}</span>
            <span class="tag" :class="sw.enabled ? 'tag-ok' : 'tag-warn'">
              {{ sw.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">评测门禁</h3>
        <p class="section-text">最近评测结果: 全部通过</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const stats = ref({
  analyses: 0,
  failureRate: 0,
  avgDuration: 0,
  pendingReviews: 0,
  pendingReports: 0,
  safetyEvents: 0,
});

const featureSwitches = ref<{ key: string; enabled: boolean }[]>([]);

onMounted(async () => {
  try {
    featureSwitches.value = await api.getFeatureSwitches();
  } catch (e) {
    console.error('Failed to load dashboard:', e);
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
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--primary);
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.section-text {
  font-size: 13px;
  color: var(--text-2);
}

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-name {
  font-size: 13px;
  color: var(--text-1);
}
</style>
