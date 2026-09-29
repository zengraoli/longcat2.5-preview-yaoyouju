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
import { api } from '@/api/client';
import type { AuditLog } from '@/api/types';

const lastVerify = ref('2026-09-21 06:00');
const total = ref(12406);

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

const logs = ref<LogRow[]>([
  { time: '2026-09-21 11:10', actor: '周工', role: '技术负责人', roleTone: 'warn', action: '创建候选发布', actionTone: 'info', target: 'model_release R-2026.09.21-c · 提示词 p14 → p15；检索 R-4 不变', requestId: 'req_9f3a…', hash: 'a81c2e0f' },
  { time: '2026-09-21 10:52', actor: '李医生', role: '临床审核', roleTone: 'info', action: '读取明文（单条授权）', actionTone: 'warn', target: 'user U-8F3K… · 报告 RPT-5521 与 12 条记录 · 授权 G-0031（举报 #ER-0213）', requestId: 'req_8c11…', hash: '5d7e9a44' },
  { time: '2026-09-21 10:40', actor: '李医生', role: '临床审核', roleTone: 'info', action: '举报复核', actionTone: 'ok', target: 'error_report #ER-0213 · 状态 triaged → in_review · 结论：引用核对漏检', requestId: 'req_7be0…', hash: 'c03f1b92' },
  { time: '2026-09-21 09:41', actor: '系统', role: '—', roleTone: 'neutral', action: '安全事件', actionTone: 'error', target: 'safety_event RF-01 · 用户 U-8F3K… · 动作：提示就医 + 停止个性化分析 · 规则 rs-1.3', requestId: 'req_6a77…', hash: 'e2b4d160' },
  { time: '2026-09-20 17:35', actor: '王编辑', role: '运营编辑', roleTone: 'ok', action: '提交审核', actionTone: 'info', target: 'content C-0007 · v2 · draft → pending_review', requestId: 'req_51d2…', hash: '9a0cf7b3' },
  { time: '2026-09-20 16:02', actor: '赵总 + 周工', role: '超管 + 技术', roleTone: 'error', action: '功能开关变更（双人）', actionTone: 'warn', target: 'feature_switch ocr_extract · on → off → on（误操作回滚，原因已记录）', requestId: 'req_4e9b…', hash: '7bd51e08' },
  { time: '2026-09-19 14:20', actor: '陈律师', role: '合规支持', roleTone: 'neutral', action: '查询审计', actionTone: 'info', target: 'audit_log 查询：操作人=李医生 · 动作=读取明文 · 近 30 天', requestId: 'req_3c08…', hash: '12f8a6c5' },
  { time: '2026-09-18 10:02', actor: '李医生', role: '临床审核', roleTone: 'info', action: '内容更正标记', actionTone: 'warn', target: 'content C-0007 · v1 · published → correcting · 依据举报 #ER-0197', requestId: 'req_2b5f…', hash: 'f4e07d21' },
  { time: '2026-09-18 09:15', actor: '系统', role: '—', roleTone: 'neutral', action: '删除任务完成', actionTone: 'neutral', target: 'deletion_job DJ-0042 · 用户 U-5ZZQ… · 覆盖：patient*/identity/OSS/缓存/派生摘要 · 备份轮换至 10-18', requestId: 'req_1a44…', hash: 'b7c93e5a' },
  { time: '2026-09-17 21:30', actor: '系统', role: '—', roleTone: 'neutral', action: '同意撤回', actionTone: 'warn', target: 'consent health_processing · 用户 U-3LMN… · 效果：analysis_locked', requestId: 'req_0f2e…', hash: 'd9a1c07e' },
]);

onMounted(async () => {
  try {
    await api.get<AuditLog[]>('/admin/audit-logs');
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
