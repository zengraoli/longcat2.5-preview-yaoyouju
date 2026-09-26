<template>
  <div class="safety-page">
    <div class="page-header">
      <h2 class="page-title">安全事件与应急开关</h2>
    </div>

    <div class="card">
      <div class="card-head">
        <h3 class="section-title">应急开关</h3>
        <span class="head-note">变更需双人确认 · 最近变更：2026-09-20 14:30</span>
      </div>
      <div class="switch-list">
        <div class="switch-item" v-for="sw in featureSwitches" :key="sw.key">
          <div class="switch-info">
            <span class="switch-name">{{ switchLabel(sw.key) }}</span>
            <span class="switch-key">{{ sw.key }}</span>
          </div>
          <span class="switch-reason">{{ sw.reason }}</span>
          <button
            class="toggle-btn"
            :class="{ enabled: sw.enabled }"
            @click="toggleSwitch(sw)"
          >
            {{ sw.enabled ? '已启用' : '已禁用' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3 class="section-title">安全事件</h3>
        <span class="head-note">规则集版本 {{ ruleSetVersion }} · 变更需双人确认</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>规则</th>
            <th>严重度</th>
            <th>动作</th>
            <th>来源</th>
            <th>用户</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in safetyEvents" :key="event.id">
            <td><span class="tag tag-error">{{ event.rule_code }}</span></td>
            <td><span class="tag" :class="event.severity === 'high' ? 'tag-error' : 'tag-warn'">{{ event.severity }}</span></td>
            <td>{{ event.action_taken }}</td>
            <td>分析请求</td>
            <td>{{ event.user_id?.slice(0, 8) }}***</td>
            <td>{{ formatTime(event.created_at) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="safetyEvents.length === 0">
        <p>暂无安全事件</p>
      </div>
    </div>

    <div class="card">
      <h3 class="section-title">事故记录</h3>
      <div class="empty-state">
        <p>暂无事故记录</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const featureSwitches = ref<{ key: string; enabled: boolean; reason: string }[]>([]);
const safetyEvents = ref<any[]>([]);
const ruleSetVersion = ref('RF-v1.0');

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function switchLabel(key: string) {
  return {
    personalized_analysis: '个性化分析',
    video_recommendation: '视频推荐',
    case_card: '案例卡片',
  }[key] || key;
}

async function toggleSwitch(sw: { key: string; enabled: boolean; reason: string }) {
  try {
    await api.setFeatureSwitch({ key: sw.key, enabled: !sw.enabled, reason: sw.reason });
    await loadSwitches();
  } catch (e: any) { alert(e.message); }
}

async function loadSwitches() {
  try {
    featureSwitches.value = await api.getFeatureSwitches();
  } catch (e) {
    console.error('Failed to load switches:', e);
  }
}

async function loadEvents() {
  try {
    safetyEvents.value = await api.getSafetyEvents();
    ruleSetVersion.value = await api.getSafetyRuleVersion();
  } catch (e) {
    console.error('Failed to load safety events:', e);
  }
}

onMounted(() => { loadSwitches(); loadEvents(); });
</script>

<style scoped>
.safety-page { padding: 0; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 500; }
.section-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
.switch-list { display: flex; flex-direction: column; gap: 12px; }
.switch-item { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.switch-info { display: flex; flex-direction: column; gap: 2px; }

.switch-name { font-size: 14px; font-weight: 500; }

.switch-key { font-size: 11px; color: var(--text-3); }
.switch-reason { flex: 1; font-size: 12px; color: var(--text-3); }
.toggle-btn { padding: 8px 16px; border: 2rpx solid var(--border); border-radius: 8px; font-size: 12px; cursor: pointer; background: var(--surface); }
.toggle-btn.enabled { background: var(--ok); color: #fff; border-color: var(--ok); }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 12px 8px; border-bottom: 1px solid var(--border); }
.data-table th { color: var(--text-2); font-weight: 500; }
.empty-state { text-align: center; padding: 40px; color: var(--text-3); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-head .section-title { margin-bottom: 0; }
.head-note { font-size: 12px; color: var(--text-3); }
.tag-warn { background: rgba(199, 119, 0, 0.1); color: var(--warn); }
.tag-ok { background: #E5F6EE; color: var(--ok); }
.tag-error { background: rgba(217, 59, 59, 0.08); color: var(--error); }
.tag-info { background: #E7F0FE; color: var(--info); }
</style>
