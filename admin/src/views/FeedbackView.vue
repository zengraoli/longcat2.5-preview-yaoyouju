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
          <div class="stat-card__value stat-card__value--error">5</div>
          <div class="stat-card__sub">高 1 · 中 2 · 低 2</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">临床复核中</div>
          <div class="stat-card__value stat-card__value--warn">2</div>
          <div class="stat-card__sub">平均处理 1.5 天</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">本周已关闭</div>
          <div class="stat-card__value stat-card__value--ok">11</div>
          <div class="stat-card__sub">平均处理 2.1 天</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">帮助类型反馈（7 天）</div>
          <div class="stat-card__value">186</div>
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
        <div v-if="selected" class="feedback__side">
          <div class="card">
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
              <button class="btn btn--secondary btn--sm">查看相关资料（写入审计）</button>
            </div>

            <div class="detail-section">
              <div class="detail-section__label">处置</div>
              <div class="detail-actions">
                <button class="btn btn--secondary btn--sm">回复用户</button>
                <button class="btn btn--secondary btn--sm">转临床复核</button>
                <button class="btn btn--secondary btn--sm">下线相关内容</button>
                <button class="btn btn--secondary btn--sm">修订解释模板</button>
                <button class="btn btn--primary btn--sm">加入评测集</button>
              </div>
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
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { api } from '@/api/client';
import type { FeedbackItem } from '@/api/types';

const tabs = [
  { key: 'reports', label: '错误举报 (7)' },
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

const tickets = ref<Ticket[]>([
  {
    id: '#ER-0213', analysisId: null, helpType: null, unsolvedQuestion: null, isErrorReport: true, createdAt: '',
    type: '与报告不符 · 左右侧混淆', content: '一页分析 v3 · ②-2', versions: 'M-2609 · R-4 · U-8F3K…', user: 'U-8F3K…',
    severity: '高', status: '临床复核中', assignee: '李医生', time: '09-21 09:41',
    analysisVersion: 'A-88213 · v3 · 2026-09-21 09:41', modelVersion: 'M-2609（模型 Q-x · 提示词 p14 · 检索 R-4）',
    contentVersion: '审核科普 #07 v1', scope: '同版本组合近 7 天：1,204 条分析（脱敏统计）',
    description: '报告写的是右侧，但解释里说成了左侧，和我描述的也对不上。',
    records: [
      { time: '09-21 09:50', text: '系统按类型自动定级：高' },
      { time: '09-21 10:05', text: '王编辑 初筛：疑似侧别引用错误，转临床复核' },
      { time: '09-21 10:40', text: '李医生 确认：② 段引用了报告“右侧”但解释写“左侧”；标记为“引用核对漏检”' },
    ],
  },
  {
    id: '#ER-0212', analysisId: null, helpType: null, unsolvedQuestion: null, isErrorReport: true, createdAt: '',
    type: '缺少重要就医提示', content: '问与解释 · 消息', versions: 'M-77102 · M-2609 · U-2Q9A…', user: 'U-2Q9A…',
    severity: '高', status: '已分配', assignee: '李医生', time: '09-21 08:12',
    analysisVersion: 'A-88210 · v1', modelVersion: 'M-2609', contentVersion: '—', scope: '—',
    description: '用户询问是否要手术，回复中没有明确提示“出现大小便异常需立即就医”。',
    records: [{ time: '09-21 08:20', text: '系统按类型自动定级：高' }],
  },
  {
    id: '#ER-0211', analysisId: null, helpType: null, unsolvedQuestion: null, isErrorReport: true, createdAt: '',
    type: '看不懂', content: '视频：硬膜囊受压是在说什么 v1', versions: 'U-7HD5…', user: 'U-7HD5…',
    severity: '低', status: '待初筛', assignee: null, time: '09-20 21:30',
    analysisVersion: '—', modelVersion: '—', contentVersion: '审核科普 #07 v1', scope: '—',
    description: '用户表示视频没看懂。',
    records: [],
  },
  {
    id: '#ER-0210', analysisId: null, helpType: null, unsolvedQuestion: null, isErrorReport: true, createdAt: '',
    type: '事实错误', content: '一页分析 v1 · ③-1', versions: 'M-2608 · U-1KLM…', user: 'U-1KLM…',
    severity: '中', status: '已回复', assignee: '王编辑', time: '09-20 15:02',
    analysisVersion: 'A-88200 · v1', modelVersion: 'M-2608', contentVersion: '—', scope: '—',
    description: '解释中的年份与指南不一致。',
    records: [{ time: '09-20 16:00', text: '王编辑 回复用户并更正' }],
  },
  {
    id: '#ER-0209', analysisId: null, helpType: null, unsolvedQuestion: null, isErrorReport: true, createdAt: '',
    type: '越界（给了不该给的判断）', content: '问与解释 · 消息', versions: 'M-76890 · M-2608 · U-9PQR…', user: 'U-9PQR…',
    severity: '高', status: '已加入评测集', assignee: '李医生', time: '09-19 11:45',
    analysisVersion: 'A-88190 · v2', modelVersion: 'M-2608', contentVersion: '—', scope: '—',
    description: '回复中给出了“可以继续观察”的倾向性判断。',
    records: [{ time: '09-19 12:00', text: '李医生 加入评测集“越界”' }],
  },
  {
    id: '#ER-0208', analysisId: null, helpType: null, unsolvedQuestion: null, isErrorReport: true, createdAt: '',
    type: '隐私问题', content: '复诊摘要导出', versions: 'S-3301 · U-4TUV…', user: 'U-4TUV…',
    severity: '中', status: '已关闭', assignee: '合规 · 陈', time: '09-18 10:20',
    analysisVersion: '—', modelVersion: '—', contentVersion: '—', scope: '—',
    description: '导出文件中包含第三方姓名。',
    records: [{ time: '09-18 11:00', text: '合规 已移除第三方信息并回复' }],
  },
  {
    id: '#ER-0207', analysisId: null, helpType: null, unsolvedQuestion: null, isErrorReport: true, createdAt: '',
    type: '看不懂', content: '一页分析 v2 · ③', versions: 'M-6WXY…', user: 'U-6WXY…',
    severity: '低', status: '已回复', assignee: '王编辑', time: '09-18 09:05',
    analysisVersion: 'A-88180 · v2', modelVersion: 'M-2609', contentVersion: '—', scope: '—',
    description: '用户表示分析没看懂。',
    records: [{ time: '09-18 10:00', text: '王编辑 回复用户' }],
  },
]);

const selected = ref<Ticket | null>(tickets.value[0]);

onMounted(async () => {
  try {
    await api.get<FeedbackItem[]>('/feedback');
  } catch {
    // 加载失败不阻塞
  }
});
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
.feedback__side {
  position: sticky;
  top: 80px;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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
.detail-section {
  margin-bottom: 16px;
}
.detail-section--suggest {
  background: rgba(199, 119, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
}
.detail-section__label {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.detail-section__label--warn {
  color: var(--warn);
  font-weight: 500;
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
  flex-shrink: 0;
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
</style>
