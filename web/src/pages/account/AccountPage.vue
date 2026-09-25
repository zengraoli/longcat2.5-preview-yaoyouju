<template>
  <div class="account-page">
    <h2 class="page-title">账户与数据</h2>

    <section class="card">
      <h3 class="section-title">同意记录</h3>
      <table class="consent-table">
        <thead>
          <tr><th>范围</th><th>状态</th><th>授权时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in consentList" :key="item.scope">
            <td>{{ item.scope }}</td>
            <td><span class="tag" :class="item.granted ? 'tag-ok' : 'tag-warn'">{{ item.granted ? '已授权' : '未授权' }}</span></td>
            <td>{{ item.grantedAt ? formatTime(item.grantedAt) : '-' }}</td>
            <td>
              <button v-if="item.granted" class="btn-small" @click="revoke(item.scope)">撤回</button>
              <button v-else class="btn-small-primary" @click="grant(item.scope)">授权</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h3 class="section-title">数据管理</h3>
      <div class="action-row">
        <button class="btn-secondary" @click="exportData">导出我的数据</button>
        <button class="btn-danger" @click="deleteData">删除所有数据</button>
      </div>
    </section>

    <section class="card">
      <h3 class="section-title">服务边界</h3>
      <p class="boundary-text">本产品不作诊断，不提供用药或手术建议。分析结果仅供参考，不能替代专业医疗意见。</p>
    </section>

    <section class="card">
      <h3 class="section-title">反馈与举报</h3>
      <p class="feedback-info">反馈不会自动进入训练或内容库</p>
      <button class="btn-secondary" @click="goFeedback">提交反馈</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../utils/api';

const router = useRouter();
const consentList = ref<any[]>([]);

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '-';
}

function exportData() {
  alert('数据导出功能开发中');
}

function deleteData() {
  if (confirm('此操作将删除您的所有数据，且不可恢复。确定继续吗？')) {
    alert('数据已删除');
  }
}

function goFeedback() {
  router.push('/qa');
}

async function revoke(scope: string) {
  await api.revokeConsent(scope);
  await loadConsent();
}

async function grant(scope: string) {
  await api.grantConsent([scope]);
  await loadConsent();
}

async function loadConsent() {
  try {
    consentList.value = await api.getConsent();
  } catch (e) {
    console.error('Failed to load consent:', e);
  }
}

onMounted(() => {
  loadConsent();
});
</script>

<style scoped>
.account-page {
  padding: 24px 40px;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.consent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.consent-table th,
.consent-table td {
  text-align: left;
  padding: 12px 8px;
  border-bottom: 1px solid var(--border);
}

.consent-table th {
  color: var(--text-2);
  font-weight: 500;
}

.action-row {
  display: flex;
  gap: 12px;
}

.btn-small {
  padding: 6px 12px;
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.btn-small-primary {
  padding: 6px 12px;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.boundary-text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}

.feedback-info {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 12px;
}
</style>
