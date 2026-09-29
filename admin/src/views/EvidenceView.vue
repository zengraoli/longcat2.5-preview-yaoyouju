<template>
  <AppLayout>
    <div class="evidence">
      <div class="evidence__header">
        <h1 class="evidence__title">医学证据库</h1>
        <div class="evidence__search">
          <input class="evidence__search-input" placeholder="🔍 搜索内容 / 工单 / 匿名标识" />
        </div>
      </div>

      <!-- 筛选 -->
      <div class="evidence__filters">
        <select class="evidence__select"><option>来源类型：全部</option><option>指南</option><option>研究</option><option>审核科普</option></select>
        <select class="evidence__select"><option>许可：全部</option><option>可引用</option><option>待确认</option></select>
        <select class="evidence__select"><option>状态：全部</option><option>已核实</option><option>已停用</option></select>
        <div class="evidence__filter-actions">
          <button class="btn btn--secondary">＋ 导入指南/文献</button>
          <button class="btn btn--primary">＋ 新建证据条目</button>
        </div>
      </div>

      <!-- 状态统计 -->
      <div class="evidence__stats">
        <span v-for="s in stats" :key="s.label" class="evidence__stat" :class="`evidence__stat--${s.tone}`">
          {{ s.label }} {{ s.count }}
        </span>
      </div>

      <div class="evidence__grid">
        <!-- 左：表格 -->
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>编号</th><th>标题 / 来源（核实人 · 片段数）</th><th>类型</th><th>许可</th><th>年份</th><th>核实日期</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in docs" :key="doc.id">
                <td class="table__id">{{ doc.id }}</td>
                <td class="table__title">{{ doc.title }}<span class="table__source">（{{ doc.reviewer }} · {{ doc.chunkCount }} 片段）</span></td>
                <td>{{ doc.sourceType }}</td>
                <td><StatusTag :label="doc.license ?? ''" /></td>
                <td>{{ doc.year }}</td>
                <td>{{ doc.verifiedAt ?? '—' }}</td>

                <td class="table__actions">
                  <button class="btn btn--text">详情</button>
                  <button class="btn btn--text btn--danger" @click="selected = doc">停用</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 右：管线与停用影响 -->
        <div class="evidence__side">
          <div class="card">
            <div class="card__title">入库管线 · {{ pipeline.docId }}（{{ pipeline.status }}）</div>
            <div v-for="(step, i) in pipeline.steps" :key="i" class="pipeline-step">
              <span class="pipeline-step__dot" :class="`pipeline-step__dot--${step.tone}`" />
              <div class="pipeline-step__body">
                <div class="pipeline-step__name">{{ step.name }}</div>
                <div class="pipeline-step__desc">{{ step.desc }}</div>
              </div>
            </div>
            <button class="btn btn--primary btn--block" :disabled="pipeline.steps[0]?.tone !== 'ok'">
              标记许可已确认（临床审核）
            </button>
          </div>

          <div v-if="selected" class="card card--danger">
            <div class="card__title card__title--danger">⚠ 停用影响预览 · {{ selected.id }}</div>
            <p class="card__note">停用后立即从检索中剔除。以下内容曾引用该文档，需临床审核决定是否更正：</p>
            <div class="impact-section">
              <div class="impact-section__label">已发布内容</div>
              <div class="impact-section__item">影像上的突出与疼痛为什么不是一回事 v1</div>
            </div>
            <div class="impact-section">
              <div class="impact-section__label">近 90 天检索</div>
              <div class="impact-section__item">142 条（脱敏统计）</div>
            </div>
            <div class="impact-section">
              <div class="impact-section__label">解释模板</div>
              <div class="impact-section__item">②-3 “影像与症状不一一对应”</div>
            </div>
            <button class="btn btn--danger btn--block" @click="onDeactivate">确认停用（写入审计）</button>
          </div>
        </div>
      </div>

      <TipBar type="info">
        只有“可引用”且“已核实”的条目参与检索；用户反馈、对话与投稿不得写入证据库。“引用了”不等于确实支持，引用核对在分析管线中逐条执行。
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
import type { EvidenceDoc } from '@/api/types';

const docs = ref<Array<EvidenceDoc & { reviewer: string; year: string }>>([]);
const selected = ref<(EvidenceDoc & { reviewer: string; year: string }) | null>(null);

const stats = [
  { label: '指南', count: 6, tone: 'info' },
  { label: '研究', count: 4, tone: 'info' },
  { label: '审核科普', count: 12, tone: 'ok' },
  { label: '许可待确认', count: 2, tone: 'warn' },
  { label: '已停用', count: 1, tone: 'error' },
];

const pipeline = ref({
  docId: 'G-07',
  status: '待确认',
  steps: [
    { name: '许可检查', desc: '待确认：出版方授权条款未取得', tone: 'warn' },
    { name: '文本清理', desc: '已完成 · 去页眉页脚与页码', tone: 'ok' },
    { name: '切分', desc: '已完成 · 约 500 tokens / 重叠 50 · 31 片段', tone: 'ok' },
    { name: '向量化', desc: '等待许可通过后执行（embedding v3）', tone: 'neutral' },
    { name: '建索引', desc: '—', tone: 'neutral' },
  ],
});

function onDeactivate() {
  if (!selected.value) return;
  alert(`已停用 ${selected.value.id}（演示）`);
  selected.value = null;
}

onMounted(async () => {
  try {
    docs.value = await api.get<Array<EvidenceDoc & { reviewer: string; year: string }>>('/evidence/docs');
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.evidence__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.evidence__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.evidence__search-input {
  width: 320px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
}
.evidence__filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}
.evidence__select {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
  background: var(--surface);
  color: var(--text-2);
}
.evidence__filter-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}
.evidence__stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.evidence__stat {
  font-size: 13px;
  color: var(--text-2);
}
.evidence__stat--ok { color: var(--ok); }
.evidence__stat--warn { color: var(--warn); }
.evidence__stat--error { color: var(--error); }
.evidence__stat--info { color: var(--info); }
.evidence__grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.card--danger {
  background: rgba(217, 59, 59, 0.04);
}
.card__title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px;
}
.card__title--danger {
  color: var(--error);
  font-size: 14px;
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 0 0 12px;
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
.table__id {
  font-weight: 500;
  white-space: nowrap;
}
.table__title {
  font-weight: 500;
}
.table__source {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  font-weight: 400;
}
.table__actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
.evidence__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pipeline-step {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.pipeline-step__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}
.pipeline-step__dot--ok { background: var(--ok); }
.pipeline-step__dot--warn { background: var(--warn); }
.pipeline-step__dot--neutral { background: var(--border); }
.pipeline-step__name {
  font-size: 13px;
  font-weight: 500;
}
.pipeline-step__desc {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.impact-section {
  margin-bottom: 12px;
}
.impact-section__label {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
}
.impact-section__item {
  font-size: 13px;
  background: var(--bg);
  border-radius: 6px;
  padding: 8px 12px;
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
.btn--primary { background: var(--primary); color: #fff; }
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
.btn--danger { background: var(--error); color: #fff; }
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
.btn--text.btn--danger { color: var(--error); }
.btn--block { width: 100%; margin-top: 12px; }
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
