<template>
  <AppLayout>
    <div class="contents">
      <div class="contents__header">
        <h1 class="contents__title">内容库</h1>
        <div class="contents__search">
          <input v-model="search" class="contents__search-input" placeholder="搜索标题 / 编号" @input="onSearch" />
        </div>
      </div>

      <!-- 筛选 -->
      <div class="contents__filters">
        <select v-model="statusFilter" class="contents__select">
          <option value="">状态：全部</option>
          <option>已发布</option>
          <option>待审</option>
          <option>已审定</option>
          <option>草稿</option>
          <option>更正中</option>
          <option>已撤回</option>
          <option>已下线</option>
        </select>
        <select v-model="typeFilter" class="contents__select">
          <option value="">类型：全部</option>
          <option>视频</option>
          <option>图文组件</option>
        </select>
        <div class="contents__filter-actions">
          <button v-if="canOffline" class="btn btn--secondary" @click="onBatchOffline">批量下线（需双人确认）</button>
          <button v-if="canCreate" class="btn btn--primary" @click="showCreate = true">＋ 新建内容</button>
        </div>
      </div>

      <!-- 状态统计 -->
      <div class="contents__status-stats">
        <span v-for="s in statusStats" :key="s.label" class="contents__status-stat" :class="`contents__status-stat--${s.tone}`">
          {{ s.label }} {{ s.count }}
        </span>
      </div>

      <!-- 表格 -->
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>标题</th><th>类型</th><th>状态</th><th>当前版本</th><th>审核人</th><th>发布时间</th><th>引用数</th><th>下线开关</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pagedItems" :key="item.id">
              <td class="table__title">{{ item.title }}</td>
              <td>{{ item.type }}</td>
              <td><StatusTag :label="item.currentStatus" /></td>
              <td>v{{ item.version ?? '—' }}</td>
              <td>{{ item.reviewer ?? '—' }}</td>
              <td>{{ item.publishedAt ? item.publishedAt.slice(0, 10) : '—' }}</td>
              <td>{{ item.refCount }}</td>
              <td>
                <input type="checkbox" class="table__check" :checked="selected.has(item.id)" @change="toggleSelect(item.id)" />
              </td>
              <td class="table__actions">
                <button class="btn btn--text" @click="goDetail(item)">详情</button>
                <button v-if="canEdit(item)" class="btn btn--text" @click="onCorrect(item)">更正</button>
                <button v-if="canOffline"
                  class="btn btn--text"
                  :class="{ 'btn--danger': item.offlineSwitch }"
                  @click="onToggleOffline(item)"
                >
                  {{ item.offlineSwitch ? '取消下线' : '下线' }}
                </button>
              </td>
            </tr>
            <tr v-if="pagedItems.length === 0">
              <td colspan="9" class="table__empty">暂无内容</td>
            </tr>
          </tbody>
        </table>
        <div class="table__pagination">
          <span>共 {{ filteredItems.length }} 条 · 每页 {{ pageSize }} 条</span>
          <div class="table__pages">
            <button class="table__page" :disabled="page <= 1" @click="page--">‹</button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              class="table__page"
              :class="{ 'table__page--active': p === page }"
              @click="page = p"
            >
              {{ p }}
            </button>
            <button class="table__page" :disabled="page >= totalPages" @click="page++">›</button>
          </div>
        </div>
      </div>

      <TipBar type="warn">
        “下线开关”立即对用户端隐藏内容且不改变审核状态，用于应急；正式撤回请在详情页走“撤回”流程并定位引用页面。
      </TipBar>

      <!-- 新建内容弹层 -->
      <Modal :open="showCreate" title="新建内容" confirm-text="创建" @close="showCreate = false" @confirm="confirmCreate">
        <div class="form-field">
          <label class="form-label">标题</label>
          <input v-model="newTitle" class="form-input" placeholder="内容标题" :maxlength="100" />
        </div>
        <div class="form-field">
          <label class="form-label">类型</label>
          <select v-model="newType" class="form-input">
            <option>视频</option>
            <option>图文组件</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">脚本</label>
          <textarea v-model="newScript" class="modal__textarea" placeholder="脚本内容" :maxlength="10000" />
        </div>
      </Modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import Modal from '@/components/Modal.vue';
import { listContents, setContentOfflineSwitch, batchOffline, createContent, transitionContent } from '@/api';
import { useAuthStore } from '@/stores/auth';
import type { ContentItem } from '@/api/types';

const router = useRouter();
const auth = useAuthStore();
const items = ref<ContentItem[]>([]);
const selected = ref<Set<string>>(new Set());
const search = ref('');
const statusFilter = ref('');
const typeFilter = ref('');
const page = ref(1);
const pageSize = 10;
const showCreate = ref(false);
const newTitle = ref('');
const newType = ref('视频');
const newScript = ref('');

const statusStats = computed(() => {
  const count = (s: string) => items.value.filter((i) => i.currentStatus === s).length;
  return [
    { label: '已发布', count: count('已发布'), tone: 'ok' },
    { label: '待医学审核', count: count('待审'), tone: 'warn' },
    { label: '已审定', count: count('已审定'), tone: 'info' },
    { label: '草稿', count: count('草稿'), tone: 'neutral' },
    { label: '更正中', count: count('更正中'), tone: 'info' },
    { label: '已撤回', count: count('已撤回'), tone: 'error' },
    { label: '已下线', count: count('已下线'), tone: 'error' },
  ];
});

const filteredItems = computed(() => {
  let list = items.value;
  if (statusFilter.value) list = list.filter((i) => i.currentStatus === statusFilter.value);
  if (typeFilter.value) list = list.filter((i) => i.type === typeFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((i) => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }
  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize)));

/** 分页页码：最多显示当前页前后各 2 页 + 首尾，避免页码过多横向溢出 */
const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = page.value;
  const window = 2;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let p = current - window; p <= current + window; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
});

const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredItems.value.slice(start, start + pageSize);
});

function canEdit(item: ContentItem) {
  const perms = auth.session?.permissions ?? [];
  const editable = ['草稿', '更正中', '已撤回'].includes(item.currentStatus);
  return editable && (perms.includes('content:edit') || perms.includes('content:correct:initiate'));
}

const canOffline = computed(() => (auth.session?.permissions ?? []).includes('content:offline'));
const canCreate = computed(() => (auth.session?.permissions ?? []).includes('content:edit'));

function goDetail(item: ContentItem) {
  router.push({ name: 'content-detail', params: { id: item.id } });
}

function toggleSelect(id: string) {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
}

async function onBatchOffline() {
  if (selected.value.size === 0) {
    toast('请先勾选要下线的内容');
    return;
  }
  try {
    const result = await batchOffline([...selected.value]);
    toast(result.status === '已下线' ? '已下线（双人确认完成）' : '已发起，待第二人确认');
    selected.value.clear();
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function confirmCreate() {
  if (!newTitle.value.trim()) {
    toast('请填写标题');
    return;
  }
  try {
    await createContent({ type: newType.value, title: newTitle.value.trim(), script: newScript.value || '脚本内容' });
    toast('已创建草稿');
    showCreate.value = false;
    newTitle.value = '';
    newScript.value = '';
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onCorrect(item: ContentItem) {
  try {
    const result = await transitionContent(item.id, '更正');
    toast(result.currentStatus === '更正中' ? '已提交更正（双人确认完成）' : '已发起更正，待第二人确认');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onToggleOffline(item: ContentItem) {
  try {
    if (item.offlineSwitch) {
      // 取消下线：复位下线开关
      await setContentOfflineSwitch(item.id, false);
      toast('已取消下线');
    } else {
      // 下线开关：应急隐藏，不改变审核状态
      await setContentOfflineSwitch(item.id, true);
      toast('已下线（应急隐藏）');
    }
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

function onSearch() {
  page.value = 1;
}

async function load() {
  try {
    items.value = await listContents();
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
.contents__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.contents__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.contents__search-input {
  width: 320px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.contents__filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.contents__select {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
  background: var(--surface);
  color: var(--text-2);
}
.contents__filter-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}
.contents__status-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.contents__status-stat {
  font-size: 13px;
  color: var(--text-2);
}
.contents__status-stat--ok { color: var(--ok); }
.contents__status-stat--warn { color: var(--warn); }
.contents__status-stat--error { color: var(--error); }
.contents__status-stat--info { color: var(--info); }
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
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
.table__title {
  font-weight: 500;
}
.table__check {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.table__actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
.table__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-3);
}
.table__pages {
  display: flex;
  gap: 4px;
  align-items: center;
}
.table__page {
  min-width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  font-size: 13px;
  cursor: pointer;
}
.table__page--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.form-field {
  margin-bottom: 12px;
}
.form-label {
  font-size: 13px;
  color: var(--text-2);
  display: block;
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
  background: var(--surface);
  color: var(--text-1);
}
.modal__textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
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
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
.btn--text.btn--danger { color: var(--error); }
</style>
