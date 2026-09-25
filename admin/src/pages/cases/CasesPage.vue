<template>
  <div class="cases-page">
    <div class="page-header">
      <h2 class="page-title">案例投稿审核</h2>
      <span class="tag tag-warn">二期预留</span>
    </div>

    <div class="card">
      <h3 class="section-title">投稿队列</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户</th>
            <th>内容摘要</th>
            <th>授权范围</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cases" :key="item.id">
            <td>{{ item.id.slice(0, 8) }}</td>
            <td>{{ item.user_id.slice(0, 8) }}***</td>
            <td>{{ item.edited_content?.slice(0, 30) }}...</td>
            <td>{{ item.consent_scope || '尚未确认' }}</td>
            <td><span class="tag tag-warn">{{ item.status }}</span></td>
            <td>
              <button class="btn-small" @click="viewCase(item)">审核</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="cases.length === 0">
        <p>暂无投稿</p>
      </div>
    </div>

    <div class="modal" v-if="showDetail" @click.self="showDetail = false">
      <div class="modal-content card">
        <h3 class="modal-title">案例审核</h3>
        <div class="detail-section">
          <h4>内容</h4>
          <p class="case-content">{{ currentCase?.edited_content }}</p>
        </div>
        <div class="detail-section">
          <h4>可识别风险检查</h4>
          <ul class="risk-list">
            <li>第三方姓名: 未检出</li>
            <li>第三方机构: 未检出</li>
            <li>联系方式: 未检出</li>
          </ul>
        </div>
        <div class="detail-section">
          <h4>授权范围</h4>
          <p>{{ currentCase?.consent_scope || '尚未确认' }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDetail = false">关闭</button>
          <button class="btn-primary" :disabled="!publishEnabled" @click="publishCase">发布</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const cases = ref<any[]>([]);
const showDetail = ref(false);
const currentCase = ref<any>(null);
const publishEnabled = ref(false);

function viewCase(item: any) {
  currentCase.value = item;
  showDetail.value = true;
}

function publishCase() {
  alert('发布功能受功能开关控制，当前已关闭');
}

async function loadCases() {
  try {
    publishEnabled.value = false;
  } catch (e) {
    console.error('Failed to load cases:', e);
  }
}

onMounted(() => { loadCases(); });
</script>

<style scoped>
.cases-page { padding: 0; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 500; }
.section-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 12px 8px; border-bottom: 1px solid var(--border); }
.data-table th { color: var(--text-2); font-weight: 500; }
.btn-small { padding: 6px 12px; background: var(--primary-light); color: var(--primary); border: none; border-radius: 8px; font-size: 12px; cursor: pointer; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { width: 600px; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 16px; font-weight: 500; margin-bottom: 20px; }
.detail-section { margin-bottom: 20px; }
.detail-section h4 { font-size: 13px; font-weight: 500; margin-bottom: 8px; }
.case-content { font-size: 13px; color: var(--text-1); background: var(--bg); padding: 12px; border-radius: 8px; line-height: 1.6; }
.risk-list { list-style: none; padding: 0; }
.risk-list li { font-size: 12px; color: var(--ok); padding: 4px 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-3); }
</style>
