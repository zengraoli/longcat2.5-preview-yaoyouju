<template>
  <AppLayout>
    <div class="feedback">
      <div class="feedback__header">
        <h1 class="feedback__title">举报与反馈</h1>
        <div class="feedback__search">
          <input class="feedback__search-input" placeholder="🔍 搜索内容 / 工单 / 匿名标识" />
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
          <div class="stat-card__sub">平均处理 1.5 天</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">本周已关闭</div>
          <div class="stat-card__value stat-card__value--ok">{{ closedCount }}</div>
          <div class="stat-card__sub">平均处理 2.1 天</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">帮助类型反馈（7 天）</div>
          <div class="stat-card__value">{{ helpCount }}</div>
          <div class="stat-card__sub">看懂 62% · 知道下一步 24% · 都不好 14%</div>
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
                  <th>工单</th><th>类型 · 内容 / 版本 · 用户</th><th>严重度</th><th>状态</th><th>负责人</th><th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ticket in tickets"
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
                  <td>{{ ticket.assignee ?? '—' }}</td>
                  <td>{{ ticket.time }}</td>
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
                <div class="detail-row"><span>受影响范围</span><span>{{ selected.scope }}</span></div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section__label">用户描述</div>
              <p class="detail-section__text">{{ selected.description }}</p>
            </div>

            <div class="detail-section">
              <div class="detail-section__label">单条授权</div>
              <p class="detail-section__text detail-section__text--ok">
                ✓ 用户已允许查看本条分析涉及的报告与记录（至 2026-09-28，可撤回）
              </p>
              <button class="btn btn--secondary btn--sm" @click="onAuthorize">查看相关资料（写入审计）</button>
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
            </div>

            <div class="detail-section detail-section--suggest">
              <div class="detail-section__label detail-section__label--warn">建议下一步</div>
              <p class="detail-section__text">
                加入评测集“左右侧混淆”并触发回归；对同版本组合的 ② 段引用核对启用侧别一致性校验；关闭前通知用户处理结果。
              </p>
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
import type { FeedbackItem } from '@/api/types';

interface FeedbackRow extends FeedbackItem {
  severity: string | null;
  status: string | null;
  resolution: string | null;
}

const tabs = [
  { key: 'reports', label: '错误举报' },
  { key: 'help', label: '帮助类型反馈' },
  { key: 'retell', label: '复述任务抽查' },
];
const activeTab = ref('reports');

interface Ticket extends FeedbackItem {
  type: string;
  content: string;
  versions: string;
  user: string;
  severity: string;
  status: string;
  assignee: string | null;
  time: string;
  analysisVersion: string;
  modelVersion: string;
  contentVersion: string;
  scope: string;
  description: string;
  records: Array<{ time: string; text: string }>;
}

const tickets = ref<Ticket[]>([]);
const selected = ref<Ticket | null>(null);
const actionNote = ref('');

const pendingCount = computed(() => tickets.value.filter((t) => t.status === '待处理').length);
const highCount = computed(() => tickets.value.filter((t) => t.severity === '高').length);
const midCount = computed(() => tickets.value.filter((t) => t.severity === '中').length);
const lowCount = computed(() => tickets.value.filter((t) => t.severity === '低').length);
const reviewCount = computed(() => tickets.value.filter((t) => t.status === '临床复核中').length);
const closedCount = computed(() => tickets.value.filter((t) => t.status === '已关闭').length);
const helpCount = ref(186);

function mapTicket(item: FeedbackRow, i: number): Ticket {
  return {
    ...item,
    type: item.isErrorReport ? '错误举报' : '帮助类型反馈',
    content: item.isErrorReport ? (item.unsolvedQuestion ?? '错误举报') : (item.helpType ?? '帮助类型'),
    versions: item.analysisId ? `分析 ${item.analysisId.slice(0, 8)}` : '—',
    user: item.userId ? item.userId.slice(0, 8) : '匿名',
    severity: item.severity ?? '—',
    status: item.status ?? '待处理',
    assignee: null,
    time: item.createdAt.slice(5, 16).replace('T', ' '),
    analysisVersion: item.analysisId ? `${item.analysisId.slice(0, 8)}` : '—',
    modelVersion: '—',
    contentVersion: '—',
    scope: '—',
    description: item.unsolvedQuestion || '用户提交的反馈',
    records: item.resolution ? [{ time: item.createdAt.slice(5, 16).replace('T', ' '), text: item.resolution }] : [],
  };
}

async function onAuthorize() {
  if (!selected.value) return;
  try {
    await authorizeFeedback(selected.value.id);
    toast('已授权查看（写入审计）');
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
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function load() {
  try {
    const items: FeedbackRow[] = await listFeedback();
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
.card__tag {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 10px;
  border-radius: 4px;
}
.card__tag--ok {
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 12px 0 0;
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
.table__actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
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
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
</style>
