<template>
  <div class="dashboard-page">
    <div class="emergency-bar">
      <button class="emergency-btn" @click="showEmergency">紧急求助</button>
    </div>

    <div class="dashboard-grid">
      <section class="col-left">
        <h2 class="col-title">待确认项</h2>
        <div class="card" v-for="item in pendingItems" :key="item.id">
          <div class="pending-row">
            <span class="pending-text">{{ item.text }}</span>
            <button class="btn-small" @click="confirmItem(item)">确认</button>
            <span class="tag tag-warn">尚未确认</span>
          </div>
        </div>
        <div class="card empty-card" v-if="pendingItems.length === 0">
          <p class="empty-text">暂无待确认项</p>
        </div>
      </section>

      <section class="col-center">
        <h2 class="col-title">最新分析</h2>
        <div class="card" v-if="latestAnalysis">
          <p class="analysis-summary">{{ latestAnalysis.summary }}</p>
          <p class="analysis-version">版本 v{{ latestAnalysis.version }}</p>
          <router-link to="/analysis/latest" class="link">查看详情</router-link>
        </div>
        <div class="card empty-card" v-else>
          <p class="empty-text">尚未生成分析</p>
          <button class="btn-primary" @click="generateAnalysis">生成分析</button>
        </div>

        <h2 class="col-title">快捷入口</h2>
        <div class="quick-links">
          <router-link to="/qa" class="quick-link">问与解释</router-link>
          <router-link to="/timeline" class="quick-link">病程</router-link>
          <router-link to="/followup" class="quick-link">复诊准备</router-link>
        </div>
      </section>

      <section class="col-right">
        <h2 class="col-title">复诊倒计时</h2>
        <div class="card">
          <p class="countdown">{{ countdownText }}</p>
        </div>

        <h2 class="col-title">最近记录</h2>
        <div class="card">
          <p class="empty-text" v-if="recentLogs.length === 0">暂无记录</p>
          <div class="log-item" v-for="log in recentLogs" :key="log.id">
            <p class="log-text">{{ log.summary }}</p>
            <p class="log-time">{{ log.time }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../utils/api';

const router = useRouter();
const pendingItems = ref<{ id: string; text: string }[]>([]);
const latestAnalysis = ref<{ summary: string; version: number } | null>(null);
const countdownText = ref('尚未确认');
const recentLogs = ref<{ id: string; summary: string; time: string }[]>([]);

function showEmergency() {
  alert('如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。');
}

function confirmItem(item: { id: string; text: string }) {
  pendingItems.value = pendingItems.value.filter(i => i.id !== item.id);
}

function generateAnalysis() {
  router.push('/qa');
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      const ep = episodes[0];
      pendingItems.value = [
        { id: '1', text: `发病日期: ${ep.onset_date || '尚未确认'}` },
        { id: '2', text: `病程状态: ${ep.status}` },
      ];
      countdownText.value = '尚未确认复诊日期';
    }
  } catch (e) {
    console.error('Failed to load dashboard:', e);
  }
});
</script>

<style scoped>
.dashboard-page {
  padding: 24px 40px;
}

.emergency-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.emergency-btn {
  padding: 8px 16px;
  background: rgba(217, 59, 59, 0.1);
  color: var(--error);
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
}

.col-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.pending-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pending-text {
  flex: 1;
  font-size: 13px;
}

.btn-small {
  padding: 6px 12px;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.empty-card {
  text-align: center;
  padding: 32px;
}

.empty-text {
  font-size: 13px;
  color: var(--text-3);
}

.analysis-summary {
  font-size: 13px;
  color: var(--text-1);
  line-height: 1.6;
}

.analysis-version {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 8px;
}

.link {
  font-size: 12px;
  color: var(--info);
  text-decoration: none;
  margin-top: 12px;
  display: inline-block;
}

.quick-links {
  display: flex;
  gap: 12px;
}

.quick-link {
  flex: 1;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: center;
  font-size: 13px;
  color: var(--text-2);
  text-decoration: none;
}

.quick-link:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.countdown {
  font-size: 14px;
  font-weight: 500;
  color: var(--primary);
}

.log-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.log-item:last-child {
  border-bottom: none;
}

.log-text {
  font-size: 12px;
  color: var(--text-1);
}

.log-time {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 4px;
}
</style>
