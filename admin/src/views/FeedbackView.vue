<template>
  <AppLayout>
    <div class="feedback">
      <div class="feedback__header">
        <h1 class="feedback__title">举报与反馈</h1>
        <div class="feedback__search">
          <input v-model="search" class="feedback__search-input" placeholder="搜索内容 / 工单 / 匿名标识" @input="onSearch" />
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="feedback__stats">
        <div class="stat-card">
          <div class="stat-card__label">待处理</div>
          <div class="stat-card__value stat-card__value--error">{{ pendingCount }}</div>
          <div class="stat-card__sub">高 {{ highCount }} · 中 {{ midCount }} · 低 {{ lowCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">临床复核中</div>
          <div class="stat-card__value stat-card__value--warn">{{ reviewCount }}</div>
          <div class="stat-card__sub">{{ avgHandleTime }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">已处理</div>
          <div class="stat-card__value stat-card__value--ok">{{ closedCount }}</div>
          <div class="stat-card__sub">错误举报工单</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">帮助类型反馈</div>
          <div class="stat-card__value">{{ helpCount }}</div>
          <div class="stat-card__sub">{{ helpTypeSummary }}</div>
        </div>
      </div>

      <div class="feedback__grid">
        <!-- 左：工单列表 -->
        <div class="feedback__main">
          <div class="card">
            <div class="card__tabs">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                class="card__tab"
                :class="{ 'card__tab--active': activeTab === tab.key }"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>工单</th><th>类型 · 内容 / 版本 · 用户</th><th>严重度</th><th>状态</th><th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ticket in filteredTickets"
                  :key="ticket.id"
                  :class="{ 'table__row--active': selected?.id === ticket.id }"
                  @click="selected = ticket"
                >
                  <td class="table__id">{{ ticket.id }}</td>
                  <td>
                    <div class="table__title">{{ ticket.type }}</div>
                    <div class="table__sub">{{ ticket.content }} · {{ ticket.versions }} · {{ ticket.user }}</div>
                  </td>
                  <td><StatusTag :label="ticket.severity" /></td>
                  <td><StatusTag :label="ticket.status" /></td>
                  <td>{{ ticket.time }}</td>
                </tr>
                <tr v-if="filteredTickets.length === 0">
                  <td colspan="5" class="table__empty">暂无{{ activeTab === 'help' ? '帮助类型反馈' : '错误举报' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <TipBar type="info">
            工单自动附带分析 / 模型 / 内容 / 检索四类版本；用户标识为匿名内部 ID；明文资料需单条授权后逐次审计查看。反馈只进入质量库，不进入医学证据库。
          </TipBar>
        </div>

        <!-- 右：工单详情 -->
        <div class="feedback__side">
          <div v-if="selected" class="card">
            <div class="card__header">
              <div class="card__title">{{ selected.id }} · {{ selected.type }}</div>
              <div class="card__header-tags">
                <StatusTag :label="selected.severity" />
                <button class="card__close" @click="selected = null">✕</button>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section__label">受影响版本（自动附带）</div>
              <div class="detail-section__rows">
                <div class="detail-row"><span>分析</span><span>{{ selected.analysisVersion }}</span></div>
                <div class="detail-row"><span>模型发布</span><span>{{ selected.modelVersion }}</span></div>
                <div class="detail-row"><span>内容版本</span><span>{{ selected.contentVersion }}</span></div>
                <div class="detail-row"><span>规则集</span><span>{{ selected.rulesetVersion }}</span></div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section__label">用户描述</div>
              <p class="detail-section__text" :class="{ 'detail-section__text--muted': !selected.authorized }">
                {{ selected.description }}
              </p>
            </div>

            <div class="detail-section">
              <div class="detail-section__label">单条授权</div>
              <p v-if="selected.authorized" class="detail-section__text detail-section__text--ok">
                ✓ 已授权查看本条反馈涉及的报告与记录（每次读取写审计）
              </p>
              <p v-else class="detail-section__text detail-section__text--muted">
                未授权：用户描述已脱敏。授权后可查看原文，每次读取写入审计。
              </p>
              <button v-if="!selected.authorized" class="btn btn--secondary btn--sm" @click="onAuthorize">查看相关资料（写入审计）</button>
            </div>

            <div class="detail-section">
              <div class="detail-section__label">处置</div>
              <div class="detail-actions">
                <button class="btn btn--secondary btn--sm" @click="onHandle('回复用户')">回复用户</button>
                <button class="btn btn--secondary btn--sm" @click="onHandle('转临床复核')">转临床复核</button>
                <button class="btn btn--secondary btn--sm" @click="onHandle('下线相关内容')">下线相关内容</button>
                <button class="btn btn--secondary btn--sm" @click="onHandle('修订解释模板')">修订解释模板</button>
                <button class="btn btn--primary btn--sm" @click="onHandle('加入评测集')">加入评测集</button>
              </div>
              <input v-model="actionNote" class="form-input" placeholder="处置说明" />
            </div>

            <div class="detail-section">
              <div class="detail-section__label">处理记录</div>
              <div v-for="(r, i) in selected.records" :key="i" class="record">
                <div class="record__time">{{ r.time }}</div>
                <div class="record__text">{{ r.text }}</div>
              </div>
              <p v-if="selected.records.length === 0" class="card__note">暂无处理记录</p>
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
import TipBar from '@/components/TipBar.vue';
import { listFeedback, authorizeFeedback, handleFeedback } from '@/api';

const tabs = [
  { key: 'reports', label: '错误举报' },
  { key: 'help', label: '帮助类型反馈' },
];
const activeTab = ref('reports');

interface Ticket {
  id: string;
  type: string;
  content: string;
  versions: string;
  user: string;
  severity: string;
  status: string;
  time: string;
  analysisVersion: string;
  modelVersion: string;
  contentVersion: string;
  rulesetVersion: string;
  description: string;
  authorized: boolean;
  records: Array<{ time: string; text: string }>;
}

const tickets = ref<Ticket[]>([]);
const selected = ref<Ticket | null>(null);
const actionNote = ref('');
const search = ref('');

const filteredTickets = computed(() => {
  let list = tickets.value;
  if (activeTab.value === 'help') list = list.filter((t) => t.type === '帮助类型反馈');
  else list = list.filter((t) => t.type === '错误举报');
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((t) => t.id.toLowerCase().includes(q) || t.content.toLowerCase().includes(q) || t.user.toLowerCase().includes(q));
  }
  return list;
});

const pendingCount = computed(() => tickets.value.filter((t) => t.type === '错误举报' && t.status === '待处理').length);
const highCount = computed(() => tickets.value.filter((t) => t.type === '错误举报' && t.status === '待处理' && t.severity === '高').length);
const midCount = computed(() => tickets.value.filter((t) => t.type === '错误举报' && t.status === '待处理' && t.severity === '中').length);
const lowCount = computed(() => tickets.value.filter((t) => t.type === '错误举报' && t.status === '待处理' && t.severity === '低').length);
const reviewCount = computed(() => tickets.value.filter((t) => t.status === '临床复核中').length);
const closedCount = computed(() => tickets.value.filter((t) => t.type === '错误举报' && (t.status === '已处理' || t.status === '已关闭')).length);
const helpCount = computed(() => tickets.value.filter((t) => t.type === '帮助类型反馈').length);

const helpTypeSummary = computed(() => {
  const help = tickets.value.filter((t) => t.type === '帮助类型反馈');
  if (help.length === 0) return '暂无帮助类型反馈';
  const byType = new Map<string, number>();
  for (const t of help) byType.set(t.content, (byType.get(t.content) ?? 0) + 1);
  return [...byType.entries()].map(([k, v]) => `${k} ${v}`).join(' · ');
});

const avgHandleTime = computed(() => {
  const handled = tickets.value.filter((t) => t.status === '已处理' || t.status === '已关闭');
  return handled.length > 0 ? `已处理 ${handled.length} 条` : '暂无处理记录';
});

function mapTicket(item: {
  id: string;
  userId: string | null;
  analysisId: string | null;
  helpType: string | null;
  unsolvedQuestion: string | null;
  isErrorReport: boolean;
  createdAt: string;
  severity: string | null;
  status: string | null;
  resolution: string | null;
  authorized?: boolean;
  problemTypes?: string | null;
}): Ticket {
  const isError = !!item.isErrorReport;
  return {
    id: item.id.slice(0, 8),
    type: isError ? '错误举报' : '帮助类型反馈',
    content: isError ? (item.unsolvedQuestion ?? '错误举报').slice(0, 20) : (item.helpType ?? '帮助类型'),
    versions: item.analysisId ? `分析 ${item.analysisId.slice(0, 8)}` : '—',
    user: item.userId ? item.userId.slice(0, 8) : '匿名',
    severity: item.severity ?? '—',
    status: item.status ?? '待处理',
    time: item.createdAt.slice(5, 16).replace('T', ' '),
    analysisVersion: item.analysisId ? `${item.analysisId.slice(0, 8)}` : '—',
    modelVersion: '—',
    contentVersion: '—',
    rulesetVersion: 'RF-v3',
    description: item.unsolvedQuestion || '用户提交的反馈',
    authorized: !!item.authorized,
    records: item.resolution ? [{ time: item.createdAt.slice(5, 16).replace('T', ' '), text: item.resolution }] : [],
  };
}

async function onAuthorize() {
  if (!selected.value) return;
  try {
    await authorizeFeedback(selected.value.id);
    toast('已授权查看（写入审计）');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onHandle(action: string) {
  if (!selected.value) return;
  const resolution = actionNote.value || action;
  try {
    await handleFeedback(selected.value.id, action, resolution);
    toast('已记录处置');
    actionNote.value = '';
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

function onSearch() {
  // 搜索在 filteredTickets 计算属性中实时生效
}

async function load() {
  try {
    const items = await listFeedback();
    tickets.value = items.map(mapTicket);
    if (tickets.value.length > 0 && !selected.value) selected.value = tickets.value[0];
  } catch {
    // 加载失败不阻塞
  }
}

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;max-width:80%;text-align:center;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

onMounted(load);
</script>

<style scoped>
.feedback__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.feedback__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.feedback__search-input {
  width: 320px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.feedback__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
.feedback__grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 16px;
  align-items: start;
}
.feedback__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.feedback__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.card__tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0;
}
.card__tab {
  min-height: 40px;
  padding: 0 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.card__tab--active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 500;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
}
.card__header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card__close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-2);
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
.table__row--active {
  background: var(--primary-light);
}
.table__id {
  font-weight: 500;
  white-space: nowrap;
}
.table__title {
  font-weight: 500;
}
.table__sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}
.detail-section {
  margin-bottom: 16px;
}
.detail-section__label {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.detail-section__rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  gap: 12px;
}
.detail-row span:first-child {
  color: var(--text-2);
}
.detail-row span:last-child {
  text-align: right;
}
.detail-section__text {
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}
.detail-section__text--ok {
  color: var(--ok);
}
.detail-section__text--muted {
  color: var(--text-3);
}
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.record {
  margin-bottom: 10px;
}
.record__time {
  font-size: 11px;
  color: var(--text-3);
}
.record__text {
  font-size: 13px;
  line-height: 1.5;
  margin-top: 2px;
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  margin: 8px 0 0;
}
.form-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
  margin-top: 8px;
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
.btn--sm { min-height: 32px; padding: 0 12px; font-size: 13px; }
</style>
