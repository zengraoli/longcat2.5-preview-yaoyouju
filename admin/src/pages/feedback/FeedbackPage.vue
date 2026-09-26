<template>
  <div class="feedback-page">
    <div class="page-header">
      <h2 class="page-title">举报与反馈队列</h2>
    </div>

    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>类型</th>
            <th>严重度</th>
            <th>分类</th>
            <th>状态</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id">
            <td>{{ item.id.slice(0, 8) }}</td>
            <td>{{ item.is_error_report ? '错误举报' : '帮助类型反馈' }}</td>
            <td>
              <span v-if="item.is_error_report" :class="['tag', severityTagClass(item.severity)]">
                {{ severityLabel(item.severity) }}
              </span>
              <span v-else>-</span>
            </td>
            <td>{{ item.category || '-' }}</td>
            <td><span class="tag" :class="item.error_status === 'open' ? 'tag-warn' : 'tag-ok'">{{ item.error_status || 'open' }}</span></td>
            <td>{{ formatTime(item.created_at) }}</td>
            <td>
              <button class="btn-small" @click="viewDetail(item)">查看</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="filteredItems.length === 0">
        <p>暂无记录</p>
      </div>
    </div>

    <div class="modal" v-if="showDetail" @click.self="showDetail = false">
      <div class="modal-content card">
        <h3 class="modal-title">详情</h3>
        <div class="detail-body">
          <p><strong>类型:</strong> {{ detail.is_error_report ? '错误举报' : '帮助类型反馈' }}</p>
          <p v-if="detail.is_error_report"><strong>严重度:</strong> {{ severityLabel(detail.severity) }}</p>
          <p v-if="detail.is_error_report"><strong>分类:</strong> {{ detail.category }}</p>
          <p v-if="detail.is_error_report"><strong>描述:</strong> {{ detail.description }}</p>
          <p><strong>用户ID:</strong> {{ detail.user_id?.slice(0, 8) }}***</p>
          <div class="version-box">
            <p class="version-title">自动附带的四类版本</p>
            <p>分析版本：{{ detail.analysis_version ? 'v' + detail.analysis_version : '尚未确认' }}</p>
            <p>模型版本：{{ detail.model_version || '尚未确认' }}</p>
            <p>内容库版本：{{ detail.content_version || '尚未确认' }}</p>
            <p>检索策略 / 规则集：{{ detail.rule_set_version || '尚未确认' }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-small-danger" @click="grantView">单条授权查看</button>
          <button class="btn-secondary" @click="showDetail = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../utils/api';

const items = ref<any[]>([]);
const activeFilter = ref('all');
const showDetail = ref(false);
const detail = ref<any>({});

const filters = [
  { label: '全部', value: 'all' },
  { label: '错误举报', value: 'error' },
  { label: '反馈', value: 'feedback' },
];

const filteredItems = computed(() => {
  if (activeFilter.value === 'error') return items.value.filter(i => i.is_error_report);
  if (activeFilter.value === 'feedback') return items.value.filter(i => !i.is_error_report);
  return items.value;
});

function severityTagClass(severity: string) {
  const map: Record<string, string> = { low: 'tag-info', medium: 'tag-warn', high: 'tag-error' };
  return map[severity] || 'tag-info';
}

function severityLabel(severity: string) {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高' };
  return map[severity] || severity || '-';
}

function grantView() {
  alert('已记录单条授权查看：仅限本条分析涉及的报告与记录，可随时撤回。');
}

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

async function viewDetail(item: any) {
  try {
    detail.value = await api.getFeedback(item.id);
    showDetail.value = true;
  } catch (e: any) { alert(e.message); }
}

async function loadItems() {
  try {
    items.value = await api.getFeedbackList();
  } catch (e) {
    console.error('Failed to load feedback:', e);
  }
}

onMounted(() => { loadItems(); });
</script>

<style scoped>
.feedback-page { padding: 0; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 500; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }
.filter-btn { padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 13px; color: var(--text-2); cursor: pointer; }
.filter-btn.active { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 12px 8px; border-bottom: 1px solid var(--border); }
.data-table th { color: var(--text-2); font-weight: 500; }
.btn-small { padding: 6px 12px; background: var(--primary-light); color: var(--primary); border: none; border-radius: 8px; font-size: 12px; cursor: pointer; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { width: 500px; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 16px; font-weight: 500; margin-bottom: 20px; }
.detail-body p { margin-bottom: 12px; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-3); }

.version-box {
  margin-top: 16px;
  background: var(--bg);
  border-radius: 8px;
  padding: 14px;
}

.version-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}

.version-box p {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
}

.btn-small-danger {
  background: none;
  color: var(--error);
  border: 1px solid rgba(217, 59, 59, 0.3);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
}
</style>
