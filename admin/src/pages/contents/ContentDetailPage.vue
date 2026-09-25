<template>
  <div class="content-detail">
    <div class="page-header">
      <button class="btn-secondary" @click="$router.back()">返回</button>
      <h2 class="page-title">{{ item.title }}</h2>
      <span class="tag" :class="statusTagClass">{{ item.current_status }}</span>
    </div>

    <div class="detail-grid">
      <div class="card">
        <h3 class="section-title">基本信息</h3>
        <div class="info-row"><span class="info-label">类型</span><span>{{ item.type }}</span></div>
        <div class="info-row"><span class="info-label">适用范围</span><span>{{ item.applicable_scope || '暂无' }}</span></div>
        <div class="info-row"><span class="info-label">不适用范围</span><span>{{ item.not_applicable || '暂无' }}</span></div>
      </div>

      <div class="card">
        <h3 class="section-title">状态流转</h3>
        <div class="status-flow">
          <span class="flow-step" :class="{ done: isStatusAtLeast('待医学审核') }">草稿</span>
          <span class="flow-arrow">→</span>
          <span class="flow-step" :class="{ done: isStatusAtLeast('已审定') }">待审</span>
          <span class="flow-arrow">→</span>
          <span class="flow-step" :class="{ done: isStatusAtLeast('已发布') }">已审定</span>
          <span class="flow-arrow">→</span>
          <span class="flow-step" :class="{ done: item.current_status === '已发布' }">已发布</span>
        </div>
        <div class="action-btns">
          <button v-if="item.current_status === '草稿'" class="btn-primary" @click="submitReview">提交审核</button>
          <button v-if="item.current_status === '待医学审核'" class="btn-primary" @click="approveReview">通过审核</button>
          <button v-if="item.current_status === '待医学审核'" class="btn-danger" @click="rejectReview">退回</button>
          <button v-if="item.current_status === '已审定'" class="btn-primary" @click="publish">发布</button>
          <button v-if="item.current_status === '已发布'" class="btn-danger" @click="offline">一键下线</button>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">审核记录</h3>
        <p class="empty-text" v-if="!reviews || reviews.length === 0">暂无审核记录</p>
        <div class="review-item" v-for="(r, idx) in reviews" :key="idx">
          <p>决定: {{ r.decision }} | 范围: {{ r.review_scope }}</p>
          <p class="review-comment">{{ r.comment }}</p>
          <p class="review-time">{{ formatTime(r.reviewed_at) }}</p>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">版本链</h3>
        <p class="empty-text" v-if="!versions || versions.length === 0">暂无版本</p>
        <div class="version-item" v-for="v in versions" :key="v.id">
          <span class="version-num">v{{ v.version }}</span>
          <span class="version-status">{{ v.published_at ? '已发布' : '未发布' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../../utils/api';

const route = useRoute();
const item = ref<any>({});
const reviews = ref<any[]>([]);
const versions = ref<any[]>([]);

const statusOrder = ['草稿', '待医学审核', '已审定', '已发布'];
const statusTagClass = computed(() => {
  const s = item.value.current_status;
  const map: Record<string, string> = { '草稿': 'tag-info', '待医学审核': 'tag-warn', '已审定': 'tag-info', '已发布': 'tag-ok', '已撤回或已下线': 'tag-error' };
  return map[s] || 'tag-info';
});

function isStatusAtLeast(target: string) {
  const current = statusOrder.indexOf(item.value.current_status);
  const idx = statusOrder.indexOf(target);
  return current >= idx;
}

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

async function submitReview() {
  try {
    await api.submitContent({ contentId: item.value.id, evidenceIds: [] });
    await loadDetail();
  } catch (e: any) { alert(e.message); }
}

async function approveReview() {
  try {
    await api.reviewContent({ contentId: item.value.id, decision: '通过', comment: '审核通过' });
    await loadDetail();
  } catch (e: any) { alert(e.message); }
}

async function rejectReview() {
  try {
    await api.reviewContent({ contentId: item.value.id, decision: '退回', comment: '需要修改' });
    await loadDetail();
  } catch (e: any) { alert(e.message); }
}

async function publish() {
  try {
    await api.publishContent({ contentId: item.value.id, reviewerId: 'current-reviewer' });
    await loadDetail();
  } catch (e: any) { alert(e.message); }
}

async function offline() {
  try {
    await api.offlineContent({ contentId: item.value.id, reason: '质量问题', operatorId: 'current-admin' });
    await loadDetail();
  } catch (e: any) { alert(e.message); }
}

async function loadDetail() {
  try {
    const id = route.params.id as string;
    const data = await api.getContent(id);
    item.value = data;
    reviews.value = data.reviews || [];
    versions.value = data.versions || [];
  } catch (e) {
    console.error('Failed to load detail:', e);
  }
}

onMounted(() => { loadDetail(); });
</script>

<style scoped>
.content-detail { padding: 0; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 500; flex: 1; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.section-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
.info-row { display: flex; padding: 8px 0; border-bottom: 1px solid var(--border); }
.info-label { width: 100px; font-size: 13px; color: var(--text-2); }
.status-flow { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.flow-step { padding: 6px 12px; border-radius: 6px; font-size: 12px; background: var(--bg); color: var(--text-3); }
.flow-step.done { background: var(--primary-light); color: var(--primary); }
.flow-arrow { color: var(--text-3); }
.action-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.review-item { padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.review-comment { color: var(--text-2); margin-top: 4px; }
.review-time { color: var(--text-3); font-size: 11px; margin-top: 4px; }
.version-item { display: flex; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.version-num { font-weight: 500; color: var(--primary); }
.empty-text { font-size: 13px; color: var(--text-3); }
</style>
