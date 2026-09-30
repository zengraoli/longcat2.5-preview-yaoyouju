<template>
  <AppLayout>
    <div class="account-page">
      <div class="account-page__header">
        <h1 class="account-page__title">账户与数据</h1>
        <p class="account-page__meta">{{ maskedPhone || '—' }} · 匿名内部标识 {{ anonymousId }}（分析内容与身份信息分离存储）</p>
      </div>

      <div class="account-page__grid">
        <!-- 左：设置导航 -->
        <div class="account-page__nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            class="account-page__nav-item"
            :class="{ 'account-page__nav-item--active': activeNav === item.key }"
            @click="onNavClick(item.key)"
          >
            {{ item.icon }} {{ item.label }}
          </button>
        </div>

        <!-- 右：内容 -->
        <div class="account-page__content">
          <!-- 同意记录 -->
          <div v-if="activeNav === 'consents'" class="card">
            <div class="card__header">
              <div class="card__title">同意记录</div>
              <span class="card__tag">可随时撤回</span>
            </div>
            <p class="table-scroll-hint">左右滑动查看完整表格 </p>
            <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>作用域</th>
                  <th>状态</th>
                  <th>同意时间</th>
                  <th>文本版本</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in consentRows" :key="i">
                  <td>{{ row.scope }}</td>
                  <td><StatusTag :label="row.status" /></td>
                  <td>{{ row.time }}</td>
                  <td>{{ row.version }}</td>
                  <td>
                    <button v-if="row.action" class="btn btn--text" @click="onRevoke">
                      {{ row.action }}
                    </button>
                    <span v-else class="table__muted">{{ row.actionText }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
            <p class="card__note">
              撤回“处理健康信息”后：立即停止个性化分析与问答；已审核科普、已导出文件与病程只读仍可使用；可重新授予。
            </p>
          </div>

          <!-- 导出与删除 -->
          <div v-if="activeNav === 'export'" class="card">
            <div class="card__title">导出与删除</div>
            <div class="export-grid">
              <div class="export-card">
                <div class="export-card__title">导出我的全部数据</div>
                <p class="export-card__desc">
                  可读格式（PDF / JSON），包含病程、报告原文、分析版本与同意记录。完成后链接 24 小时内有效。
                </p>
                <p class="export-card__meta">{{ lastExportText }}</p>
                <button class="btn btn--secondary" @click="onApplyExport">申请导出</button>
              </div>
              <div class="export-card export-card--danger">
                <div class="export-card__title export-card__title--danger">删除账户与数据</div>
                <p class="export-card__desc">
                  二次确认后立即删除（覆盖病程、报告、分析、导出文件、缓存与派生摘要 30 天内备份轮换清除。
                </p>
                <button class="btn btn--danger" @click="onDelete">删除账户</button>
              </div>
            </div>
          </div>

          <!-- 反馈与举报 -->
          <div v-if="activeNav === 'feedback'" class="card">
            <div class="card__title">我的反馈与举报</div>
            <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>工单</th>
                  <th>内容</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>提交时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in feedbackRows" :key="i">
                  <td>{{ row.id }}</td>
                  <td>{{ row.content }}</td>
                  <td>{{ row.type }}</td>
                  <td><StatusTag :label="row.status" /></td>
                  <td>{{ row.time }}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <!-- 账户 -->
          <div v-if="activeNav === 'account'" class="card">
            <div class="card__title">账户</div>
            <div class="account-info">
              <div class="account-info__row"><span>手机号</span><span>{{ maskedPhone || '—' }}</span></div>
              <div class="account-info__row"><span>匿名内部标识</span><span>{{ anonymousId }}</span></div>
              <div class="account-info__row"><span>分析模型</span><span>{{ modelVersion || '—' }}</span></div>
              <div class="account-info__row"><span>上次导出</span><span>{{ lastExport || '—' }}</span></div>
            </div>
            <p class="card__note">分析内容与身份信息分离存储；手机号在列表与日志中脱敏。</p>
          </div>

          <!-- 服务信息 -->
          <div v-if="activeNav === 'service'" class="card">
            <div class="card__title">服务信息</div>
            <div class="service-item">
              <div class="service-item__title">服务范围与不做的事</div>
              <p class="service-item__desc">不作诊断、不给手术判断、不调整药物、不生成严重程度总分</p>
            </div>
            <div class="service-item">
              <div class="service-item__title service-item__title--danger">紧急就医提示</div>
              <p class="service-item__desc">无需登录，网络异常时也可查看</p>
            </div>
            <div class="service-item">
              <div class="service-item__title">临床审定与来源说明</div>
              <p class="service-item__desc">谁审核了内容、依据是什么、如何举报错误</p>
            </div>
            <div class="service-item">
              <div class="service-item__title">版本信息</div>
              <p class="service-item__desc">{{ versionText }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { toast } from "@/utils/toast";
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { useAuthStore } from '@/stores/auth';
import { getMe, getConsents, setConsent, logout, deleteAccount, exportMyData, listEpisodes } from '@/api';

const auth = useAuthStore();
const router = useRouter();
void router;

const maskedPhone = ref('');
const anonymousId = ref('');
const consentRows = ref<Array<{ scope: string; status: string; time: string; version: string; action: string; actionText: string }>>([]);

const navItems = [
  { key: 'account', label: '账户', icon: '' },
  { key: 'consents', label: '同意记录', icon: '' },
  { key: 'export', label: '导出与删除', icon: '' },
  { key: 'feedback', label: '反馈与举报', icon: '' },
  { key: 'service', label: '服务信息', icon: 'ℹ' },
  { key: 'logout', label: '退出登录', icon: '' },
];
const activeNav = ref('account');
const modelVersion = ref('');
const lastExport = ref('');
const contentLibVersion = ref('');

/** 上次导出展示：优先取摘要导出记录 */
const lastExportText = computed(() => {
  if (lastExport.value && lastExport.value !== '未导出') return lastExport.value;
  return '尚未导出摘要';
});

/** 版本信息：取最新分析实际使用的模型与内容库版本 */
const versionText = computed(() => {
  const parts = ['Web v0.1.0'];
  parts.push(`分析模型 ${modelVersion.value || '—'}`);
  parts.push(`内容库 ${contentLibVersion.value || '—'}`);
  return parts.join(' · ');
});

function onNavClick(key: string) {
  if (key === 'logout') {
    onLogout();
    return;
  }
  activeNav.value = key;
}

async function onLogout() {
  try {
    await logout();
  } catch {
    // 本地仍清除
  }
  auth.logout();
  window.location.href = '/login';
}

async function loadAccount() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const { getLatestAnalysis, getSummaryStatus } = await import('@/api');
      const analysis = await getLatestAnalysis(episodes[0].id);
      if (analysis) {
        modelVersion.value = analysis.modelReleaseId;
        contentLibVersion.value = analysis.retrievalSnapshot?.contentLibVersion ?? '';
      }
      try {
        const status = await getSummaryStatus(episodes[0].id);
        lastExport.value = status.exported && status.exportedAt
          ? `上次导出：${status.exportedAt.slice(0, 10)} · ${status.exportFormat ?? '文本'}`
          : '未导出';
      } catch {
        lastExport.value = '未导出';
      }
    }
  } catch {
    // 加载失败不阻塞
  }
  try {
    const { listMyFeedback } = await import('@/api');
    feedbackRows.value = (await listMyFeedback()).map((f: { id: string; helpType: string | null; unsolvedQuestion: string | null; isErrorReport: boolean; createdAt: string; status?: string }) => ({
      id: f.id.slice(0, 8),
      content: f.unsolvedQuestion || f.helpType || '—',
      type: f.isErrorReport ? '错误举报' : '帮助类型',
      status: f.status ?? '已提交',
      time: f.createdAt.slice(0, 16).replace('T', ' '),
    }));
  } catch {
    // 加载失败不阻塞
  }
}

const feedbackRows = ref<Array<{ id: string; content: string; type: string; status: string; time: string }>>([]);

function formatTime(iso: string | null) {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '—';
}

async function onRevoke() {
  try {
    const result = await setConsent('健康信息处理', false);
    consentRows.value = result.map((c: { scope: string; granted: boolean; grantedAt: string | null }) => ({
      scope: c.scope,
      status: c.granted ? '已同意' : '未同意',
      time: formatTime(c.grantedAt),
      version: 'v1.0',
      action: c.scope === '健康信息处理' && c.granted ? '撤回' : '',
      actionText: c.granted ? '' : '开启',
    }));
    toast('已撤回同意');
  } catch (e) {
    toast((e as Error).message);
  }
}

const deleteConfirmed = ref(false);

async function onApplyExport() {
  // 导出全部数据：拉取可读 JSON 并触发下载
  try {
    const data = await exportMyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `腰有据-全部数据-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('已生成并下载导出文件（JSON）');
  } catch (e) {
    toast((e as Error).message);
  }
}

function onDelete() {
  // 两步确认：先弹确认提示，再执行删除
  if (!deleteConfirmed.value) {
    deleteConfirmed.value = true;
    toast('再次点击"删除账户"以确认操作（不可恢复）');
    return;
  }
  deleteAccount()
    .then(() => {
      auth.logout();
      window.location.href = '/login';
    })
    .catch((e: unknown) => toast((e as Error).message));
}

onMounted(async () => {
  try {
    const me = await getMe();
    maskedPhone.value = me.maskedPhone ?? '';
    anonymousId.value = me.id.slice(0, 6) + '…';
  } catch {
    // 未登录
  }
  try {
    const consents = await getConsents();
    consentRows.value = consents.map((c: { scope: string; granted: boolean; grantedAt: string | null }) => ({
      scope: c.scope,
      status: c.granted ? '已同意' : '未同意',
      time: formatTime(c.grantedAt),
      version: 'v1.0',
      action: c.scope === '健康信息处理' && c.granted ? '撤回' : '',
      actionText: c.granted ? '' : '开启',
    }));
  } catch {
    // 未登录
  }
  await loadAccount();
});
</script>

<style scoped>
.account-page__header {
  margin-bottom: 24px;
}
.account-page__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.account-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.table-scroll-hint {
  display: none;
  font-size: 12px;
  color: var(--text-3);
  margin: 8px 0;
}
@media (max-width: 480px) {
  .table-scroll-hint { display: block; }
  .table { min-width: 640px; }
}
.account-page__grid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: start;
}
.account-page__content {
  min-width: 0;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.account-page__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface);
  border-radius: 12px;
  padding: 8px;
}
.account-page__nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
  text-align: left;
}
.account-page__nav-item--active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
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
.card__tag {
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-light);
  padding: 2px 10px;
  border-radius: 4px;
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
  white-space: nowrap;
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
.table__muted {
  color: var(--text-3);
  font-size: 12px;
}
.export-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.export-card {
  background: var(--bg);
  border-radius: 10px;
  padding: 16px;
}
.export-card--danger {
  background: rgba(217, 59, 59, 0.06);
}
.export-card__title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}
.export-card__title--danger {
  color: var(--error);
}
.export-card__desc {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 0 0 8px;
}
.export-card__meta {
  font-size: 12px;
  color: var(--text-3);
  margin: 0 0 12px;
}
.account-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.account-info__row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  gap: 12px;
}
.account-info__row span:first-child {
  color: var(--text-2);
}
.service-item {
  margin-bottom: 16px;
}
.service-item__title {
  font-size: 14px;
  font-weight: 500;
}
.service-item__title--danger {
  color: var(--error);
}
.service-item__desc {
  font-size: 12px;
  color: var(--text-2);
  margin: 4px 0 0;
}
@media (max-width: 700px) {
  .account-page__grid {
    grid-template-columns: 1fr;
  }
  .account-page__nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .account-page__nav-item {
    flex: 1 1 30%;
    justify-content: center;
    padding: 0 8px;
  }
  .export-grid {
    grid-template-columns: 1fr;
  }
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
.btn--danger { background: var(--error); color: #fff; }
.btn--text {
  background: none;
  color: var(--error);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
</style>
