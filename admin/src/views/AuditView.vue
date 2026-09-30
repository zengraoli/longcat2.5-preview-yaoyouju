<template>
  <AppLayout>
    <div class="audit">
      <div class="audit__header">
        <h1 class="audit__title">审计日志</h1>
      </div>

      <!-- 筛选 -->
      <div class="audit__filters">
        <select class="audit__select"><option>操作人员：全部</option></select>
        <select class="audit__select"><option>角色：全部</option></select>
        <select class="audit__select"><option>动作：全部</option></select>
        <select class="audit__select"><option>对象类型：全部</option></select>
        <select class="audit__select"><option>时间：近 7 天</option></select>
        <div class="audit__filter-actions">
          <span class="audit__chain-status">🛡 哈希链完整 · 最近校验 {{ lastVerify }}</span>
          <button class="btn btn--secondary">⬇ 申请导出（需超管审批）</button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="card">
        <table class="table">
          <thead>
            <tr><th>时间</th><th>操作人</th><th>角色</th><th>动作</th><th>对象 / 变更摘要</th><th>请求 ID</th><th>哈希（前 8 位）</th></tr>
          </thead>
          <tbody>
            <tr v-for="(log, i) in logs" :key="i">
              <td class="table__time">{{ log.time }}</td>
              <td>{{ log.actor }}</td>
              <td><StatusTag :label="log.role" :tone="log.roleTone" /></td>
              <td><span class="table__action" :class="`table__action--${log.actionTone}`">{{ log.action }}</span></td>
              <td class="table__target">{{ log.target }}</td>
              <td class="table__id">{{ log.requestId }}</td>
              <td class="table__hash">{{ log.hash }}</td>
            </tr>
          </tbody>
        </table>
        <div class="table__pagination">
          <span>共 {{ total }} 条 · 每页 10 条 · 按月分区归档至对象存储</span>
          <div class="table__pages">
            <button class="table__page">‹</button>
            <button class="table__page table__page--active">1</button>
            <button class="table__page">2</button>
            <button class="table__page">3</button>
            <span class="table__page-ellipsis">…</span>
            <button class="table__page">1241</button>
            <button class="table__page">›</button>
          </div>
        </div>
      </div>

      <TipBar type="info">
        审计日志只追加、不可修改、不可删除；每条记录含前序哈希形成链；日志中不含明文健康资料，用户仅以匿名标识出现。导出需超管审批并再次写入审计。
      </TipBar>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { listAuditLogs, verifyAuditLogs } from '@/api';
import type { AuditLog } from '@/api/types';

const lastVerify = ref('—');
const total = ref(0);

interface LogRow {
  time: string;
  actor: string;
  role: string;
  roleTone: 'ok' | 'warn' | 'error' | 'info' | 'neutral';
  action: string;
  actionTone: 'ok' | 'warn' | 'error' | 'info' | 'neutral';
  target: string;
  requestId: string;
  hash: string;
}

const logs = ref<LogRow[]>([]);

function actionTone(action: string): LogRow['actionTone'] {
  if (action.includes('安全事件') || action.includes('删除')) return 'error';
  if (action.includes('撤回') || action.includes('变更') || action.includes('更正')) return 'warn';
  if (action.includes('创建') || action.includes('提交') || action.includes('发布')) return 'info';
  return 'neutral';
}

onMounted(async () => {
  try {
    const items = await listAuditLogs();
    logs.value = items.map((l) => ({
      time: l.createdAt.slice(0, 16).replace('T', ' '),
      actor: l.actorId ?? '系统',
      role: '—',
      roleTone: 'neutral' as const,
      action: l.action,
      actionTone: actionTone(l.action),
      target: l.target ?? '—',
      requestId: l.requestId ?? '—',
      hash: l.hash.slice(0, 8),
    }));
    total.value = items.length;
    const verify = await verifyAuditLogs();
    if (verify.valid) {
      lastVerify.value = new Date().toISOString().slice(0, 16).replace('T', ' ');
    }
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.audit__header {
  margin-bottom: 20px;
}
.audit__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.audit__filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.audit__select {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
  background: var(--surface);
  color: var(--text-2);
}
.audit__filter-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.audit__chain-status {
  font-size: 12px;
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  padding: 4px 12px;
  border-radius: 8px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
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
.table__time {
  white-space: nowrap;
  color: var(--text-2);
}
.table__action {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.table__action--info { color: var(--info); background: rgba(47, 111, 216, 0.1); }
.table__action--ok { color: var(--ok); background: rgba(30, 158, 90, 0.1); }
.table__action--warn { color: var(--warn); background: rgba(199, 119, 0, 0.1); }
.table__action--error { color: var(--error); background: rgba(217, 59, 59, 0.1); }
.table__action--neutral { color: var(--text-2); background: var(--bg); }
.table__target {
  color: var(--text-2);
  line-height: 1.5;
}
.table__id {
  color: var(--text-3);
  font-family: monospace;
  font-size: 12px;
}
.table__hash {
  color: var(--text-3);
  font-family: monospace;
  font-size: 12px;
}
.table__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-3);
}
.table__pages {
  display: flex;
  gap: 4px;
  align-items: center;
}
.table__page {
  min-width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  font-size: 13px;
  cursor: pointer;
}
.table__page--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.table__page-ellipsis {
  color: var(--text-3);
  padding: 0 4px;
}
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
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
</style>
