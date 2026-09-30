<template>
  <AppLayout>
    <div class="contents">
      <div class="contents__header">
        <h1 class="contents__title">内容库</h1>
        <div class="contents__search">
          <input class="contents__search-input" placeholder="🔍 搜索内容 / 工单 / 匿名标识" />
        </div>
      </div>

      <!-- 筛选 -->
      <div class="contents__filters">
        <select class="contents__select"><option>类型：全部</option><option>视频</option><option>图文</option></select>
        <select class="contents__select"><option>状态：全部</option><option>已发布</option><option>待医学审核</option><option>草稿</option><option>更正中</option><option>已撤回</option></select>
        <select class="contents__select"><option>适用范围：全部</option></select>
        <select class="contents__select"><option>审核人：全部</option></select>
        <div class="contents__filter-actions">
          <button class="btn btn--secondary" @click="onBatchOffline">批量下线（需双人确认）</button>
          <button class="btn btn--primary" @click="onCreate">＋ 新建内容</button>
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
            <tr v-for="item in items" :key="item.id">
              <td class="table__title">{{ item.title }}</td>
              <td>{{ item.type }}</td>
              <td><StatusTag :label="item.currentStatus" /></td>
              <td>v{{ item.version ?? '—' }}</td>
              <td>{{ item.reviewer ?? '—' }}</td>
              <td>{{ item.publishedAt ?? '—' }}</td>
              <td>{{ item.refCount }}</td>
              <td>
                <input type="checkbox" class="table__check" :checked="selected.has(item.id)" @change="toggleSelect(item.id)" />
              </td>
              <td class="table__actions">
                <button class="btn btn--text" @click="goDetail(item)">详情</button>
                <button class="btn btn--text" @click="onCorrect(item)">更正</button>
                <button class="btn btn--text" :class="{ 'btn--danger': item.offlineSwitch }" @click="onToggleOffline(item)">
                  {{ item.offlineSwitch ? '取消下线' : '下线' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="table__pagination">
          <span>共 {{ items.length }} 条 · 每页 10 条</span>
          <div class="table__pages">
            <button class="table__page table__page--active">1</button>
            <button class="table__page">2</button>
          </div>
        </div>
      </div>

      <TipBar type="warn">
        “下线开关”立即对用户端隐藏内容且不改变审核状态，用于应急；正式撤回请在详情页走“撤回”流程并定位引用页面。
      </TipBar>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { listContents, offlineContent, batchOffline, createContent, transitionContent } from '@/api';
import type { ContentItem } from '@/api/types';

const router = useRouter();
const items = ref<ContentItem[]>([]);
const selected = ref<Set<string>>(new Set());

const statusStats = computed(() => {
  const count = (s: string) => items.value.filter((i) => i.currentStatus === s).length;
  return [
    { label: '已发布', count: count('已发布'), tone: 'ok' },
    { label: '待医学审核', count: count('待审'), tone: 'warn' },
    { label: '草稿', count: count('草稿'), tone: 'neutral' },
    { label: '更正中', count: count('更正中'), tone: 'info' },
    { label: '已撤回', count: count('已撤回'), tone: 'error' },
  ];
});

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

async function onCreate() {
  const title = prompt('内容标题');
  if (!title) return;
  try {
    await createContent({ type: '视频', title, script: '脚本内容', subtitleText: '字幕' });
    toast('已创建草稿');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onCorrect(item: ContentItem) {
  try {
    await transitionContent(item.id, '更正');
    toast('已提交更正');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onToggleOffline(item: ContentItem) {
  try {
    if (item.offlineSwitch) {
      // 取消下线：仅在已下线状态可恢复
      await transitionContent(item.id, '更正');
      toast('已恢复');
    } else {
      await offlineContent(item.id);
      toast('已下线');
    }
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
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
}
.contents__filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
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
  margin-bottom: 12px;
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
.table__title {
  font-weight: 500;
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
.switch {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--border);
  position: relative;
  display: inline-block;
}
.switch::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  top: 2px;
  left: 2px;
}
.switch--on {
  background: var(--error);
}
.switch--on::after {
  left: 20px;
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
</style>
