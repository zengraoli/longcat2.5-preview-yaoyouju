<template>
  <div class="audit-page">
    <div class="page-header">
      <h2 class="page-title">审计日志</h2>
      <div class="head-actions">
        <button class="btn-secondary" @click="exportLogs">导出（需审批）</button>
        <button class="btn-primary" @click="verifyChain">校验哈希链</button>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <select v-model="actionFilter">
          <option value="">全部动作</option>
          <option v-for="a in actionOptions" :key="a" :value="a">{{ a }}</option>
        </select>
        <span class="head-note">只追加表，不可修改；哈希链保证完整性</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作人</th>
            <th>角色</th>
            <th>动作</th>
            <th>对象</th>
            <th>请求 ID</th>
            <th>哈希</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">
            <td>{{ formatTime(log.created_at) }}</td>
            <td>{{ log.actor_id?.slice(0, 8) }}***</td>
            <td>{{ log.actor_role || '-' }}</td>
            <td>{{ log.action }}</td>
            <td>{{ log.target || '-' }}</td>
            <td><code class="req-id">{{ log.id?.slice(0, 8) }}</code></td>
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
import { ref, computed, onMounted } from 'vue';
import { api } from '../../utils/api';

const logs = ref<any[]>([]);
const verifyResult = ref<{ valid: boolean; brokenAt?: string } | null>(null);
const actionFilter = ref('');

const actionOptions = ['content.published', 'content.offline', 'content.reviewed', 'admin.user.created', 'dual_confirm.executed', 'model.published', 'model.rollback'];

const filteredLogs = computed(() => {
  if (!actionFilter.value) return logs.value;
  return logs.value.filter((l) => l.action === actionFilter.value);
});

function exportLogs() {
  alert('导出需审批：提交后由合规角色审批，审批通过方可下载。');
}

function formatTime(iso: string) {
  return iso ? iso.slice(0, 19).replace('T', ' ') : '';
}

async function verifyChain() {
  try {
    verifyResult.value = await api.verifyAudit();
  } catch (e: any) { alert(e.message); }
}

async function loadLogs() {
  try {
    logs.value = await api.getAuditLogs();
  } catch (e) {
    console.error('Failed to load audit logs:', e);
  }
}

onMounted(() => {
  loadLogs();
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
.head-actions { display: flex; gap: 12px; }
.btn-secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--border); border-radius: 8px; padding: 10px 20px; font-size: 13px; cursor: pointer; }
.btn-primary { background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; cursor: pointer; }
.filter-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.filter-bar select { height: 36px; border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; font-size: 13px; background: var(--surface); }
.head-note { font-size: 12px; color: var(--text-3); }
.req-id { font-size: 11px; color: var(--text-3); }
.verify-result { margin-top: 20px; }
.error-text { color: var(--error); }
.empty-state { text-align: center; padding: 40px; color: var(--text-3); }
</style>
