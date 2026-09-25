<template>
  <div class="contents-page">
    <div class="page-header">
      <h2 class="page-title">内容库</h2>
      <button class="btn-primary" @click="showCreate = true">新建内容</button>
    </div>

    <div class="filter-bar">
      <button
        v-for="f in statusFilters"
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
            <th>标题</th>
            <th>类型</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id">
            <td>{{ item.title }}</td>
            <td>{{ item.type }}</td>
            <td><span class="tag" :class="statusTagClass(item.current_status)">{{ item.current_status }}</span></td>
            <td>
              <button class="btn-small" @click="viewDetail(item.id)">查看</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="filteredItems.length === 0">
        <p>暂无内容</p>
      </div>
    </div>

    <div class="modal" v-if="showCreate" @click.self="showCreate = false">
      <div class="modal-content card">
        <h3 class="modal-title">新建内容</h3>
        <div class="form-group">
          <label>类型</label>
          <select v-model="newItem.type">
            <option>视频</option>
            <option>图文组件</option>
          </select>
        </div>
        <div class="form-group">
          <label>标题</label>
          <input v-model="newItem.title" placeholder="请输入标题" />
        </div>
        <div class="form-group">
          <label>适用范围</label>
          <input v-model="newItem.applicable_scope" placeholder="请输入适用范围" />
        </div>
        <div class="form-group">
          <label>不适用范围</label>
          <input v-model="newItem.not_applicable" placeholder="请输入不适用范围" />
        </div>
        <div class="form-group">
          <label>脚本</label>
          <textarea v-model="newItem.script" placeholder="请输入脚本内容"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="createItem">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../utils/api';

const router = useRouter();
const items = ref<any[]>([]);
const activeFilter = ref('all');
const showCreate = ref(false);
const newItem = ref({ type: '视频', title: '', applicable_scope: '', not_applicable: '', script: '' });

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: '草稿' },
  { label: '待审', value: '待医学审核' },
  { label: '已审定', value: '已审定' },
  { label: '已发布', value: '已发布' },
];

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return items.value;
  return items.value.filter(i => i.current_status === activeFilter.value);
});

function statusTagClass(status: string) {
  const map: Record<string, string> = {
    '草稿': 'tag-info',
    '待医学审核': 'tag-warn',
    '已审定': 'tag-info',
    '已发布': 'tag-ok',
    '已撤回或已下线': 'tag-error',
  };
  return map[status] || 'tag-info';
}

function viewDetail(id: string) {
  router.push(`/contents/${id}`);
}

async function createItem() {
  try {
    await api.createContent(newItem.value);
    showCreate.value = false;
    await loadItems();
  } catch (e: any) {
    alert(e.message);
  }
}

async function loadItems() {
  try {
    items.value = await api.getContents();
  } catch (e) {
    console.error('Failed to load contents:', e);
  }
}

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.contents-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 8px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}

.filter-btn.active {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 12px 8px;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--text-2);
  font-weight: 500;
}

.btn-small {
  padding: 6px 12px;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
}

.form-group textarea {
  height: 120px;
  padding: 12px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
