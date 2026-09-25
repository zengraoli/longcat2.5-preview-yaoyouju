<template>
  <div class="audit-page">
    <div class="page-header">
      <h2 class="page-title">审计日志</h2>
      <button class="btn-secondary" @click="verifyChain">校验哈希链</button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作人</th>
            <th>动作</th>
            <th>对象</th>
            <th>哈希</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ formatTime(log.created_at) }}</td>
            <td>{{ log.actor_id?.slice(0, 8) }}***</td>
            <td>{{ log.action }}</td>
            <td>{{ log.target || '-' }}</td>
            <td><code class="hash-code">{{ log.hash?.slice(0, 12) }}...</code></td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="logs.length === 0">
        <p>暂无审计日志</p>
      </div>
    </div>

    <div class="card verify-result" v-if="verifyResult">
      <p>校验结果: {{ verifyResult.valid ? '通过' : '未通过' }}</p>
      <p v-if="!verifyResult.valid" class="error-text">异常位置: {{ verifyResult.brokenAt }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const logs = ref<any[]>([]);
const verifyResult = ref<{ valid: boolean; brokenAt?: string } | null>(null);

function formatTime(iso: string) {
  return iso ? iso.slice(0, 19).replace('T', ' ') : '';
}

async function verifyChain() {
  try {
    verifyResult.value = await api.verifyAudit();
  } catch (e: any) { alert(e.message); }
}

onMounted(() => {
  verifyChain();
});
</script>

<style scoped>
.audit-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 500; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 12px 8px; border-bottom: 1px solid var(--border); }
.data-table th { color: var(--text-2); font-weight: 500; }
.hash-code { font-size: 11px; color: var(--text-3); background: var(--bg); padding: 2px 6px; border-radius: 4px; }
.verify-result { margin-top: 20px; }
.error-text { color: var(--error); }
.empty-state { text-align: center; padding: 40px; color: var(--text-3); }
</style>
