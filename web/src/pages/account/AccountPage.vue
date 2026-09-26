<template>
  <div class="account-page">
    <aside class="settings-nav">
      <span class="settings-title">设置</span>
      <a class="settings-item active">数据与授权</a>
      <a class="settings-item">账户安全</a>
      <a class="settings-item">通知偏好</a>
    </aside>

    <div class="settings-main">
      <!-- 身份信息 -->
      <section class="card identity-card">
        <div class="identity-avatar">U</div>
        <div class="identity-info">
          <p class="identity-phone">{{ maskedPhone }}（匿名内部标识 U-8F3K…，分析内容与身份信息分离存储）</p>
          <p class="identity-note">手机号仅用于登录与找回，不进入分析内容。</p>
        </div>
      </section>

      <!-- 数据与授权 -->
      <section class="card">
        <h3 class="section-title">数据与授权</h3>
        <div class="consent-head">
          <h4>我的同意记录</h4>
          <span class="tag tag-ok">可撤回</span>
        </div>
        <table class="consent-table">
          <thead>
            <tr><th>范围</th><th>状态</th><th>授权时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in consentList" :key="item.scope">
              <td>{{ item.scope }}</td>
              <td>
                <span class="tag" :class="item.granted ? 'tag-ok' : 'tag-muted'">
                  {{ item.granted ? '已同意' : '未开启' }}
                </span>
              </td>
              <td>{{ item.grantedAt ? formatTime(item.grantedAt) : '-' }}</td>
              <td>
                <button v-if="item.granted" class="btn-danger-text" @click="revoke(item.scope)">撤回</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="table-note">撤回后停止个性化分析，已审核科普与已导出摘要仍可用。</p>
      </section>

      <!-- 导出与删除 -->
      <section class="card">
        <h4>导出我的全部数据</h4>
        <p class="block-note">可读格式（PDF / JSON），包含病程、报告原文与分析版本。</p>
        <div class="action-row">
          <button class="btn-secondary" @click="exportData">导出数据</button>
        </div>
        <h4 class="delete-title">删除账户与数据</h4>
        <p class="block-note danger-note">覆盖公开卡片、索引、向量、缓存与派生摘要。</p>
        <div class="action-row">
          <button class="btn-danger" @click="deleteData">删除账户与数据</button>
        </div>
        <div class="warn-alert">
          <img src="@/assets/icons/ic_warn.png" alt="" />
          <span>删除会覆盖公开卡片、搜索索引、向量和缓存和派生摘要；备份与依法需要保留的信息按政策管理，不承诺瞬时全网删除。</span>
        </div>
      </section>

      <!-- 服务信息 -->
      <section class="card">
        <h4>服务范围与不做的事</h4>
        <p class="block-note">不作诊断、不给手术判断、不调整药物、不生成严重程度总分。</p>
        <h4>案例投稿（二期）</h4>
        <p class="block-note">单独授权 · 预览 · 去除第三方信息 · 人工审核 · 可撤回</p>
        <span class="tag tag-muted">尚未开放</span>
        <h4>紧急就医提示</h4>
        <p class="block-note">无需登录，网络异常时也可查看。</p>
        <h4>临床审定与来源说明</h4>
        <p class="block-note">谁审核了内容、依据是什么、如何举报错误。</p>
        <h4>版本信息</h4>
        <p class="block-note">Web v0.1.0 · 分析模型 M-2609 · 内容库 2026-09</p>
        <div class="action-row">
          <button class="btn-secondary" @click="logout">退出登录</button>
        </div>
      </section>

      <!-- 反馈与举报 -->
      <section class="card">
        <h4>反馈与举报工单</h4>
        <p class="block-note">你的反馈不会自动进入医学知识库；由运营编辑和临床审核人员处理，处理结果会通知你。</p>
        <div class="action-row">
          <button class="btn-secondary" @click="goQa">提交反馈 / 举报</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api, clearToken } from '../../utils/api';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const consentList = ref<any[]>([]);
const maskedPhone = ref('138****1234');

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '-';
}

async function revoke(scope: string) {
  if (!confirm(`确定撤回“${scope}”的同意？撤回后停止个性化分析。`)) return;
  try {
    await api.revokeConsent(scope);
    consentList.value = await api.getConsent();
  } catch (e: any) {
    alert(e.message || '撤回失败');
  }
}

function exportData() {
  alert('数据导出为演示功能：正式环境将生成可读格式的病程、报告原文与分析版本。');
}

function deleteData() {
  if (confirm('此操作将删除你的所有数据，且不可恢复。确定继续吗？')) {
    alert('演示环境未实际删除数据。');
  }
}

function goQa() {
  router.push('/qa');
}

const auth = useAuthStore();

function logout() {
  auth.logout();
  clearToken();
  router.push('/login');
}

onMounted(async () => {
  try {
    consentList.value = await api.getConsent();
  } catch (e) {
    console.error('Failed to load consent:', e);
  }
});
</script>

<style scoped>
.account-page {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  align-items: start;
  padding: 0;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: sticky;
  top: 24px;
}

.settings-title {
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: 8px;
}

.settings-item {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
}

.settings-item.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}

.settings-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 860px;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
}

.identity-card {
  display: flex;
  align-items: center;
  gap: 18px;
}

.identity-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  flex-shrink: 0;
}

.identity-phone {
  font-size: 15px;
  font-weight: 500;
}

.identity-note {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 14px;
}

.consent-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.consent-head h4 {
  font-size: 14px;
  font-weight: 500;
}

.tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 3px 8px;
}

.tag-ok { background: #E5F6EE; color: var(--ok); }
.tag-muted { background: var(--bg); color: var(--text-3); }

.consent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.consent-table th,
.consent-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.consent-table th {
  color: var(--text-3);
  font-weight: 500;
  font-size: 12px;
}

.btn-danger-text {
  background: none;
  border: none;
  color: var(--error);
  font-size: 13px;
  cursor: pointer;
}

.table-note {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 10px;
}

.block-note {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin: 4px 0 12px;
}

.danger-note {
  color: var(--error);
}

.card h4 {
  font-size: 14px;
  font-weight: 500;
  margin: 16px 0 4px;
}

.card h4:first-child {
  margin-top: 0;
}

.delete-title {
  color: var(--error);
}

.action-row {
  display: flex;
  gap: 12px;
  margin: 8px 0;
}

.btn-secondary {
  background: var(--surface);
  color: var(--primary);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px;
  cursor: pointer;
}

.btn-danger {
  background: none;
  color: var(--error);
  border: 1px solid rgba(217, 59, 59, 0.3);
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px;
  cursor: pointer;
}

.warn-alert {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #FDF6E3;
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13px;
  color: var(--warn);
  line-height: 1.6;
  margin-top: 12px;
}

.warn-alert img {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}
</style>
