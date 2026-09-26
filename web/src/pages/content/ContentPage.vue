<template>
  <div class="content-page" @click="selected = null">
    <div class="page-head">
      <h1 class="page-title">审核内容库</h1>
      <button class="icon-btn" aria-label="搜索" @click.stop>
        <img src="@/assets/icons/ic_search.png" alt="搜索" />
      </button>
    </div>

    <div class="filter-bar" @click.stop>
      <button class="chip chip-active">全部</button>
      <button class="chip">报告术语</button>
      <button class="chip">节段位置</button>
      <button class="chip">医生会观察什么</button>
      <button class="chip">信息来源怎么看</button>
      <button class="chip">生活影响</button>
    </div>

    <div class="info-alert" @click.stop>
      <img src="@/assets/icons/ic_info.png" alt="" />
      <span>这里的内容都经过临床审定，附字幕与文字替代。示意图不是你的真实病变，不能据此判断本人病因。</span>
    </div>

    <div class="content-layout">
      <div class="content-grid">
        <div
          class="content-card card"
          :class="{ dimmed: item.current_status === '已撤回或已下线', selected: selected?.id === item.id }"
          v-for="item in items"
          :key="item.id"
          @click.stop="selected = item"
        >
          <div class="content-thumb">
            <img src="@/assets/icons/ic_play.png" alt="" v-if="item.type === '视频'" />
            <img src="@/assets/icons/ic_image.png" alt="" v-else />
          </div>
          <div class="content-info">
            <h3 class="content-title">{{ item.title }}</h3>
            <p class="content-meta">{{ item.type === '视频' ? '视频 · 含字幕' : '图文 · 阅读 3 分钟' }}</p>
            <div class="tag-row">
              <span class="tag" :class="statusClass(item.current_status)">{{ statusLabel(item.current_status) }}</span>
              <span class="tag tag-scope">适用：{{ scopeLabel(item.applicable_scope) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 详情抽屉 -->
      <aside class="detail-drawer" v-if="selected" @click.stop>
        <div class="drawer-head">
          <span class="card-title">内容详情</span>
          <button class="close-btn" @click="selected = null">✕</button>
        </div>
        <div class="drawer-body">
          <h3 class="drawer-title">{{ selected.title }}</h3>
          <div class="tag-row">
            <span class="tag" :class="statusClass(selected.current_status)">{{ statusLabel(selected.current_status) }}</span>
            <span class="tag tag-version">已审核 v{{ versionOf(selected) }}</span>
          </div>
          <p class="drawer-meta">临床审定 · 2026-08 · 依据：指南 G-03 · 科普 #12</p>

          <div class="drawer-section">
            <h4>为什么推荐给你</h4>
            <p>你的报告提到 L5/S1、硬膜囊受压；示意图不是你的真实病变，不能据此判断本人病因。</p>
          </div>

          <div class="drawer-section">
            <h4>适用范围</h4>
            <p><strong>适用：</strong>{{ selected.applicable_scope || '尚未确认' }}</p>
            <p><strong>不适用：</strong>{{ selected.not_applicable || '尚未确认' }}</p>
          </div>

          <div class="drawer-section">
            <h4>文字替代（全文）</h4>
            <p class="subtitle-text">{{ subtitleOf(selected) }}</p>
          </div>

          <div class="drawer-section">
            <h4>复述任务</h4>
            <p>看完后，用一句话说说你理解了什么（可选）</p>
            <textarea class="retell-input" placeholder="例如：L5/S1 是腰椎最下面那个椎间盘的位置…"></textarea>
            <button class="btn-primary btn-block">提交</button>
          </div>

          <div class="drawer-section">
            <h4>这条内容对你有帮助吗？</h4>
            <div class="chip-row">
              <button class="chip">看懂了</button>
              <button class="chip">没看懂</button>
              <button class="chip">内容有误（举报）</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const items = ref<any[]>([]);
const selected = ref<any>(null);

function statusLabel(s: string) {
  return s === '已发布' ? '已审核' : s === '更正中' ? '已下线 · 更正中' : s === '已审定' ? '已审定' : s;
}
function statusClass(s: string) {
  return s === '已发布' ? 'tag-ok' : s === '更正中' ? 'tag-error' : 'tag-warn';
}
function scopeLabel(s?: string | null) {
  if (!s) return '报告术语';
  if (s.includes('L5/S1') || s.includes('节段')) return '节段位置';
  if (s.includes('信息来源')) return '信息来源';
  if (s.includes('生活') || s.includes('日常')) return '生活影响';
  if (s.includes('复诊')) return '医生会观察什么';
  return '报告术语';
}
function versionOf(item: any) {
  return item.versions?.[0]?.version ?? 1;
}
function subtitleOf(item: any) {
  return item.versions?.[0]?.subtitle_text || item.subtitle_text || '（文字替代待补充）';
}

onMounted(async () => {
  try {
    items.value = await api.getPublishedContents();
  } catch (e) {
    console.error('Failed to load contents:', e);
  }
});
</script>

<style scoped>
.content-page {
  padding: 0;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn img {
  width: 22px;
  height: 22px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.chip {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  padding: 8px 18px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}

.chip-active,
.chip:active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.info-alert {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #E7F0FE;
  border-radius: 12px;
  padding: 16px 18px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 20px;
}

.info-alert img {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.content-layout:has(.detail-drawer) {
  grid-template-columns: 1fr 360px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-content: start;
}

.content-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.content-card.dimmed {
  opacity: 0.45;
}

.content-card.selected {
  outline: 2px solid var(--primary);
}

.content-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: #DDE5EA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.content-thumb img {
  width: 22px;
  height: 22px;
  background: var(--primary);
  border-radius: 6px;
  padding: 4px;
  filter: brightness(0) invert(1);
}

.content-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.content-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 8px;
}

.tag-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 8px;
}

.tag-ok { background: #E5F6EE; color: var(--ok); }
.tag-warn { background: rgba(199, 119, 0, 0.1); color: var(--warn); }
.tag-error { background: rgba(217, 59, 59, 0.08); color: var(--error); }
.tag-scope { background: var(--bg); color: var(--text-2); }
.tag-version { background: #E7F0FE; color: var(--info); }

/* 详情抽屉 */
.detail-drawer {
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 20px;
}

.drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text-3);
  cursor: pointer;
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
  margin: 8px;
}

.drawer-meta {
  font-size: 12px;
  color: var(--text-3);
  margin: 8px 0 16px;
}

.drawer-section {
  margin-bottom: 18px;
}

.drawer-section h4 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}

.drawer-section p {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}

.subtitle-text {
  background: var(--bg);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-1);
}

.retell-input {
  width: 100%;
  height: 80px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  margin: 8px 0 12px;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-block {
  width: 100%;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 500;
}
</style>
