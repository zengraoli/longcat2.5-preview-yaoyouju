<template>
  <AppLayout>
    <div class="audit">
      <div class="audit__header">
        <h1 class="audit__title">审计日志</h1>
      </div>

      <!-- 筛选 -->
      <div class="audit__filters">
        <select v-model="actionFilter" class="audit__select">
          <option value="">动作：全部</option>
          <option v-for="a in actionOptions" :key="a" :value="a">{{ a }}</option>
        </select>
        <select v-model="actorFilter" class="audit__select">
          <option value="">操作人：全部</option>
          <option v-for="a in actorOptions" :key="a" :value="a">{{ a }}</option>
        </select>
        <div class="audit__filter-actions">
          <span class="audit__chain-status" :class="{ 'audit__chain-status--error': !chainValid }">
            {{ chainValid ? '🛡 哈希链完整' : '⚠ 哈希链校验失败' }} · 最近校验 {{ lastVerify }}
          </span>
          <button class="btn btn--secondary" @click="showExport = true">⬇ 申请导出（需超管审批）</button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="card">
        <table class="table">
          <thead>
            <tr><th>时间</th><th>操作人</th><th>角色</th><th>动作</th><th>对象 / 变更摘要</th><th>请求 ID</th><th>哈希（前 8 位）</th></tr>
          </thead>
          <tbody>
            <tr v-for="(log, i) in pagedLogs" :key="i">
              <td class="table__time">{{ log.time }}</td>
              <td>{{ log.actor }}</td>
              <td><StatusTag :label="log.role" :tone="log.roleTone" /></td>
              <td><span class="table__action" :class="`table__action--${log.actionTone}`">{{ log.action }}</span></td>
              <td class="table__target">{{ log.target }}</td>
              <td class="table__id">{{ log.requestId }}</td>
              <td class="table__hash">{{ log.hash }}</td>
            </tr>
            <tr v-if="pagedLogs.length === 0">
              <td colspan="7" class="table__empty">暂无审计记录</td>
            </tr>
          </tbody>
        </table>
        <div class="table__pagination">
          <span>共 {{ filteredLogs.length }} 条 · 每页 {{ pageSize }} 条</span>
          <div class="table__pages">
            <button class="table__page" :disabled="page <= 1" @click="page--">‹</button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              class="table__page"
              :class="{ 'table__page--active': p === page }"
              @click="page = p"
            >
              {{ p }}
            </button>
            <button class="table__page" :disabled="page >= totalPages" @click="page++">›</button>
          </div>
        </div>
      </div>

      <TipBar type="info">
        审计日志只追加、不可修改、不可删除；每条记录含前序哈希形成链；日志中不含明文健康资料，用户仅以匿名标识出现。导出需超管审批并再次写入审计。
      </TipBar>

      <!-- 导出申请弹层 -->
      <Modal :open="showExport" title="申请审计导出" confirm-text="提交申请" @close="showExport = false" @confirm="confirmExport">
        <p class="modal__hint">导出需超管审批；申请与审批均写入审计。</p>
        <textarea v-model="exportReason" class="modal__textarea" placeholder="导出原因（如：合规检查）" :maxlength="500" />
      </Modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import Modal from '@/components/Modal.vue';
import { formatBeijing } from '@/utils/time';
import { listAuditLogs, verifyAuditLogs, createAuditExportRequest } from '@/api';
import type { AuditLog } from '@/api/types';
import { auditActionLabel } from '@/utils/permission';

const lastVerify = ref('—');
const chainValid = ref(true);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const actionFilter = ref('');
const actorFilter = ref('');
const showExport = ref(false);
const exportReason = ref('');

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

const actionOptions = computed(() => [...new Set(logs.value.map((l) => l.action))]);
const actorOptions = computed(() => [...new Set(logs.value.map((l) => l.actor))]);

const filteredLogs = computed(() => {
  let list = logs.value;
  if (actionFilter.value) list = list.filter((l) => l.action === actionFilter.value);
  if (actorFilter.value) list = list.filter((l) => l.actor === actorFilter.value);
  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize)));

/** 分页页码：最多显示当前页前后各 2 页 + 首尾，避免页码过多横向溢出 */
const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = page.value;
  const window = 2;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let p = current - window; p <= current + window; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
});

const pagedLogs = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredLogs.value.slice(start, start + pageSize);
});

function actionTone(action: string): LogRow['actionTone'] {
  if (action.includes('失败') || action.includes('篡改') || action.includes('删除')) return 'error';
  if (action.includes('撤回') || action.includes('变更') || action.includes('更正') || action.includes('下线')) return 'warn';
  if (action.includes('登录') || action.includes('创建') || action.includes('发布') || action.includes('授权')) return 'info';
  return 'neutral';
}

async function confirmExport() {
  if (!exportReason.value.trim()) {
    toast('请填写导出原因');
    return;
  }
  try {
    await createAuditExportRequest(exportReason.value.trim());
    toast('已提交导出申请，待超管审批');
    showExport.value = false;
    exportReason.value = '';
  } catch (e) {
    toast((e as Error).message);
  }
}

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;max-width:80%;text-align:center;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

onMounted(async () => {
  try {
    const items = await listAuditLogs();
    logs.value = items.map((l) => ({
      time: formatBeijing(l.createdAt),
      actor: l.actorName ?? l.actorId ?? '系统',
      role: l.actorRole ?? '—',
      roleTone: 'neutral' as const,
      action: auditActionLabel(l.action),
      actionTone: actionTone(l.action),
      target: l.target ?? '—',
      requestId: l.requestId ?? '—',
      hash: l.hash.slice(0, 8),
    }));
    total.value = items.length;
    const verify = await verifyAuditLogs();
    chainValid.value = verify.valid;
    if (verify.valid) {
      lastVerify.value = formatBeijing(new Date().toISOString());
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
.audit__chain-status--error {
  color: var(--error);
  background: rgba(217, 59, 59, 0.1);
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
.table__empty {
  text-align: center;
  color: var(--text-3);
  padding: 24px 0;
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
.modal__hint {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 8px;
}
.modal__textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
}
</style>
