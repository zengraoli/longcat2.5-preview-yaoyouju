<template>
  <AppLayout>
    <div class="safety">
      <div class="safety__header">
        <h1 class="safety__title">安全与开关</h1>
        <div class="safety__search">
          <input v-model="search" class="safety__search-input" placeholder="搜索内容 / 工单 / 匿名标识" @input="onSearch" />
        </div>
      </div>

      <div class="safety__grid">
        <div class="safety__main">
          <!-- 应急开关 -->
          <div class="card">
            <div class="card__header">
              <div class="card__title">⏻ 应急开关</div>
              <span class="card__tag card__tag--danger">高危需双人确认</span>
            </div>
            <div v-for="sw in switches" :key="sw.key" class="switch-row">
              <div class="switch-row__body">
                <div class="switch-row__name">{{ switchLabel(sw.key) }}</div>
                <div class="switch-row__key">{{ sw.key }}</div>
                <div class="switch-row__desc">{{ switchDesc(sw.key) }}</div>
                <div class="switch-row__meta">
                  <span class="switch-row__confirm">确认：{{ sw.confirmMode === '单人' ? '单人 + 原因' : '双人' }}</span>
                  <span class="switch-row__change">最近变更 {{ sw.change }}</span>
                </div>
              </div>
              <button class="switch" :class="{ 'switch--on': sw.enabled }" :disabled="!canWriteSwitch" @click="onToggle(sw)" />
            </div>
            <p v-if="switchPending" class="card__note">开关变更待第二人确认（{{ switchPending }}）</p>
          </div>

          <!-- 安全事件 -->
          <div class="card">
            <div class="card__header">
              <div class="card__title">⚠ 安全事件（24 小时）</div>
              <div class="card__header-filters">
                <span class="card__filter-tag">24h: 高 {{ highCount }} · 中 {{ midCount }} · 低 {{ lowCount }}</span>
                <select v-model="severityFilter" class="card__select">
                  <option value="">严重度：全部</option>
                  <option>高</option>
                  <option>中</option>
                  <option>低</option>
                </select>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr><th>规则</th><th>严重度</th><th>系统动作（规则版本）</th><th>来源</th><th>用户</th><th>时间</th></tr>
              </thead>
              <tbody>
                <tr v-for="(e, i) in filteredEvents" :key="i">
                  <td>{{ e.ruleCode }}</td>
                  <td><StatusTag :label="e.severity" /></td>
                  <td class="table__action">{{ e.actionTaken }} · {{ rulesetVersion }}</td>
                  <td>{{ e.source }}</td>
                  <td class="table__user">{{ e.user }}</td>
                  <td>{{ formatTime(e.createdAt) }}</td>
                </tr>
                <tr v-if="filteredEvents.length === 0">
                  <td colspan="6" class="table__empty">24 小时内无安全事件</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="safety__side">
          <!-- 红旗规则集 -->
          <div class="card">
            <div class="card__header">
              <div class="card__title">🛡 红旗规则集</div>
              <div class="card__header-tags">
                <span class="card__version">当前 {{ rulesetVersion }}</span>
                <span class="card__tag">临床审定</span>
                <button class="btn btn--text" @click="showRules = true">查看规则表</button>
              </div>
            </div>
            <p class="card__note">
              规则以版本管理；每次评估记录所用版本。变更需临床负责人签署并触发回归评测（危险遗漏 = 0 才可生效）。规则引擎不可用时拒绝创建分析并始终显示静态就医提示。
            </p>
          </div>

          <TipBar type="warn">
            本页只显示匿名标识与规则动作，不显示用户的问卷原文；高严重级 24 小时内 > 3 例将自动通知临床负责人复盘。
          </TipBar>
        </div>
      </div>

      <!-- 开关变更原因弹层 -->
      <Modal :open="!!switchTarget" :title="`变更开关：${switchTarget ? switchLabel(switchTarget.key) : ''}`" confirm-text="发起变更" @close="switchTarget = null" @confirm="confirmSwitchChange">
        <p class="modal__hint">变更原因（写入审计）</p>
        <textarea v-model="switchReason" class="modal__textarea" placeholder="例如：维护需要 / 应急下线" :maxlength="500" />
        <p v-if="switchTarget && switchTarget.confirmMode === '双人'" class="modal__note">高危开关需双人确认：发起后由临床审核 / 超管确认后生效。</p>
      </Modal>

      <!-- 规则表弹层 -->
      <Modal :open="showRules" title="红旗规则表" @close="showRules = false">
        <table class="table">
          <thead><tr><th>编号</th><th>名称</th><th>严重度</th><th>动作</th></tr></thead>
          <tbody>
            <tr v-for="r in ruleTable" :key="r.code">
              <td>{{ r.code }}</td>
              <td>{{ r.name }}</td>
              <td><StatusTag :label="r.severity" /></td>
              <td>{{ r.action }}</td>
            </tr>
          </tbody>
        </table>
      </Modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import Modal from '@/components/Modal.vue';
import { getDashboard, listSwitches, setSwitch, listSafetyEvents } from '@/api';
import type { DashboardStats } from '@/api/types';
import { RULES } from '@/utils/rules';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const canWriteSwitch = computed(() => (auth.session?.permissions ?? []).includes('switch:write'));

const stats = ref<DashboardStats | null>(null);
const switches = ref<Array<{ key: string; enabled: boolean; reason: string; updatedAt: string; confirmMode: string; confirm: string; change: string }>>([]);
const events = ref<Array<{ ruleCode: string; severity: string; actionTaken: string; source: string; user: string; createdAt: string }>>([]);
const rulesetVersion = ref('RF-v3');
const severityFilter = ref('');
const search = ref('');
const switchTarget = ref<{ key: string; enabled: boolean; confirmMode: string } | null>(null);
const switchReason = ref('');
const switchPending = ref('');
const showRules = ref(false);

const ruleTable = RULES.filter((r) => r.category === 'red-flag');

const highCount = computed(() => events.value.filter((e) => e.severity === '高').length);
const midCount = computed(() => events.value.filter((e) => e.severity === '中').length);
const lowCount = computed(() => events.value.filter((e) => e.severity === '低').length);

const filteredEvents = computed(() => {
  let list = events.value;
  if (severityFilter.value) list = list.filter((e) => e.severity === severityFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter((e) => e.ruleCode.toLowerCase().includes(q) || e.source.toLowerCase().includes(q) || e.user.toLowerCase().includes(q));
  }
  return list;
});

function switchLabel(key: string) {
  const map: Record<string, string> = {
    个性化分析: '个性化分析',
    视频推荐: '视频推荐',
    拍照提取: '拍照提取（OCR）',
    案例卡片: '案例卡片（二期）',
  };
  return map[key] ?? key;
}

function switchDesc(key: string) {
  const map: Record<string, string> = {
    个性化分析: '关闭后：不创建分析与对话任务；客户端显示回退页；已审核科普与摘要仍可用',
    视频推荐: '关闭后：分析 ⑤ 段与首页不显示推荐',
    拍照提取: '关闭后：仅允许粘贴文字',
    案例卡片: '二期功能总开关；默认关闭',
  };
  return map[key] ?? '';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function onSearch() {
  // 搜索在 filteredEvents 计算属性中实时生效
}

function onToggle(sw: { key: string; enabled: boolean; confirmMode: string }) {
  switchTarget.value = { key: sw.key, enabled: !sw.enabled, confirmMode: sw.confirmMode };
  switchReason.value = '';
}

async function confirmSwitchChange() {
  if (!switchTarget.value) return;
  if (!switchReason.value.trim()) {
    toast('请填写变更原因');
    return;
  }
  try {
    const result = await setSwitch(switchTarget.value.key, switchTarget.value.enabled, switchReason.value);
    if (result.status === '待第二人确认') {
      switchPending.value = switchLabel(switchTarget.value.key);
      toast('已发起，待第二人确认');
    } else {
      switchPending.value = '';
      toast(switchTarget.value.enabled ? '已开启' : '已关闭');
    }
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
  switchTarget.value = null;
}

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;max-width:80%;text-align:center;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

async function load() {
  try {
    const [dash, sw, ev] = await Promise.all([getDashboard(), listSwitches(), listSafetyEvents()]);
    stats.value = dash;
    if (dash.failureRate) rulesetVersion.value = dash.rulesetVersion ?? rulesetVersion.value;
    switches.value = sw.map((s) => ({
      key: s.key,
      enabled: !!s.enabled,
      reason: s.reason,
      updatedAt: s.updatedAt,
      confirmMode: s.confirmMode ?? '双人',
      confirm: s.confirmMode === '单人' ? '单人 + 原因' : '双人',
      change: s.updatedAt ? s.updatedAt.slice(5, 10) : '—',
    }));
    events.value = ev.map((e) => ({
      ruleCode: e.ruleCode,
      severity: e.severity,
      actionTaken: e.actionTaken,
      source: e.source,
      user: e.userId ? e.userId.slice(0, 8) : '—',
      createdAt: e.createdAt,
    }));
  } catch {
    // 加载失败不阻塞
  }
}

onMounted(load);
</script>

<style scoped>
.safety__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.safety__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.safety__search-input {
  width: 320px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.safety__grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;
}
.safety__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.safety__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  flex-wrap: wrap;
  gap: 8px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
}
.card__header-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.card__filter-tag {
  font-size: 12px;
  color: var(--warn);
  background: rgba(199, 119, 0, 0.1);
  padding: 2px 10px;
  border-radius: 4px;
}
.card__select {
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  background: var(--surface);
  color: var(--text-2);
}
.card__header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.card__version {
  font-size: 12px;
  color: var(--text-2);
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
.switch-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.switch-row:last-child {
  border-bottom: none;
}
.switch-row__name {
  font-size: 14px;
  font-weight: 500;
}
.switch-row__key {
  font-size: 11px;
  color: var(--text-3);
}
.switch-row__desc {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 4px;
  line-height: 1.5;
}
.switch-row__meta {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-3);
}
.switch {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--border);
  position: relative;
  flex-shrink: 0;
  margin-top: 2px;
  border: none;
  cursor: pointer;
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
  background: var(--ok);
}
.switch--on::after {
  left: 20px;
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
.table__action {
  line-height: 1.5;
}
.table__user {
  color: var(--text-2);
  white-space: nowrap;
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
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
.modal__hint {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 8px;
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
.modal__note {
  font-size: 12px;
  color: var(--warn);
  margin: 12px 0 0;
}
</style>
