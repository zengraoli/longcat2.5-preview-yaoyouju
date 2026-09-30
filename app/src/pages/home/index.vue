<template>
  <view class="home">
    <view class="home__header">
      <text class="home__title">当前情况</text>
      <text class="home__content-entry" @click="goContents">内容库</text>
    </view>

    <!-- 待确认项 -->
    <view v-if="pendingItems.length > 0" class="home__pending card">
      <view class="home__pending-title">
        <text class="home__pending-icon">⚠</text>
        <text class="home__pending-text">有 {{ pendingItems.length }} 项信息尚未确认</text>
      </view>
      <view v-for="(item, i) in pendingItems" :key="i" class="home__pending-item">
        <text class="home__pending-dot">•</text>
        <text class="home__pending-item-text">{{ item }}</text>
      </view>
      <view class="home__pending-actions">
        <AppButton type="soft" @click="goConfirm">现在确认（约 30 秒）</AppButton>
        <AppButton type="secondary" @click="pendingDismissed = true">稍后</AppButton>
      </view>
    </view>

    <!-- 最新一页分析 -->
    <view class="card">
      <view class="card-title">
        最新一页分析
        <text class="home__analysis-version" v-if="analysis">v{{ analysis.version }} · {{ formatDate(analysis.createdAt) }}</text>
      </view>
      <view v-if="analysis">
        <view v-for="(item, i) in analysis.sections.已知" :key="`k${i}`" class="home__analysis-item">
          <StatusTag label="已知" />
          <text class="home__analysis-text">{{ item.text }}</text>
        </view>
        <view v-for="(item, i) in analysis.sections.未知" :key="`u${i}`" class="home__analysis-item">
          <StatusTag label="未知" />
          <text class="home__analysis-text">{{ item.text }}</text>
        </view>
        <view v-for="(item, i) in analysis.sections.下一步" :key="`n${i}`" class="home__analysis-item">
          <StatusTag label="下一步" />
          <text class="home__analysis-text">{{ item.text }}</text>
        </view>
      </view>
      <view v-else class="home__analysis-empty">尚未生成分析</view>
      <AppButton v-if="analysis" type="soft" block @click="goAnalysis">查看完整分析</AppButton>
    </view>

    <!-- 快捷入口（2×2） -->
    <view class="home__grid">
      <view class="home__grid-item" @click="goRecord">
        <text class="home__grid-icon">✎</text>
        <text class="home__grid-title">记录今天</text>
        <text class="home__grid-desc">约 1 分钟</text>
      </view>
      <view class="home__grid-item" @click="goReport">
        <text class="home__grid-icon">↑</text>
        <text class="home__grid-title">录入报告</text>
        <text class="home__grid-desc">粘贴文字</text>
      </view>
      <view class="home__grid-item" @click="goQa">
        <text class="home__grid-icon">💬</text>
        <text class="home__grid-title">问与解释</text>
        <text class="home__grid-desc">基于当前上下文</text>
      </view>
      <view class="home__grid-item" @click="goSummary">
        <text class="home__grid-icon">📋</text>
        <text class="home__grid-title">复诊摘要</text>
        <text class="home__grid-desc">{{ followupQuestionCount }} 个问题待确认</text>
      </view>
    </view>

    <!-- 复诊倒计时 -->
    <view class="card home__countdown" v-if="followupDate">
      <text class="home__countdown-icon">📅</text>
      <view class="home__countdown-body">
        <text class="home__countdown-title">计划复诊：{{ followupDate }}（约 {{ daysUntil }} 天后）</text>
        <text class="home__countdown-desc">来源：你录入的医嘱 · 未经核实</text>
      </view>
      <text class="home__countdown-arrow">›</text>
    </view>

    <!-- 为你推荐 -->
    <view class="card" v-if="recommended.length > 0">
      <text class="card-title">为你推荐</text>
      <view v-for="item in recommended" :key="item.id" class="home__recommend" @click="goContentDetail(item)">
        <view class="home__recommend-thumb">
          <text class="home__recommend-play">▶</text>
        </view>
        <view class="home__recommend-body">
          <text class="home__recommend-title">{{ item.title }}</text>
          <view class="home__recommend-meta">
            <StatusTag label="已审核" />
            <text class="home__recommend-duration">{{ item.type === '视频' ? '视频' : '图文' }}</text>
          </view>
        </view>
      </view>
    </view>

    <EmergencyBar @click="showEmergency = true" />

    <!-- 就医提示弹层 -->
    <view v-if="showEmergency" class="mask" @click="showEmergency = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">{{ emergency.title }}</text>
        <view v-for="(item, i) in emergency.redFlags" :key="i" class="dialog__item">
          <text class="dialog__dot">•</text>
          <text class="dialog__text">{{ item }}</text>
        </view>
        <text class="dialog__note">{{ emergency.note }}</text>
        <AppButton block @click="showEmergency = false">我知道了</AppButton>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppButton from '@/components/AppButton.vue';
import StatusTag from '@/components/StatusTag.vue';
import EmergencyBar from '@/components/EmergencyBar.vue';
import {
  listEpisodes,
  getLatestAnalysis,
  listPublishedContents,
  getSafetyTips,
  previewSummary,
  type AnalysisResult,
  type ContentItem,
} from '@/api';

const pendingItems = ref<string[]>([]);
const pendingDismissed = ref(false);
const analysis = ref<AnalysisResult | null>(null);
const recommended = ref<ContentItem[]>([]);
const followupQuestionCount = ref(0);
const followupDate = ref('');
const daysUntil = ref(0);
const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

function goConfirm() {
  uni.navigateTo({ url: '/pages/confirm/index' });
}
function goRecord() {
  uni.navigateTo({ url: '/pages/record/index' });
}
async function goReport() {
  // 新用户（还没有病程）先走第 1 步“当前关键变化确认”（含红旗问题），再进入报告录入
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) {
      uni.navigateTo({ url: '/pages/confirm/index' });
      return;
    }
  } catch {
    // 查询失败不阻断，按老用户处理
  }
  uni.navigateTo({ url: '/pages/report/index' });
}
function goQa() {
  uni.switchTab({ url: '/pages/qa/index' });
}
function goSummary() {
  uni.navigateTo({ url: '/pages/summary/index' });
}
function goAnalysis() {
  if (analysis.value) {
    uni.navigateTo({ url: `/pages/analysis/index?id=${analysis.value.id}` });
  }
}
function goContentDetail(item: ContentItem) {
  uni.navigateTo({ url: `/pages/content-detail/index?id=${item.id}` });
}
function goContents() {
  uni.navigateTo({ url: '/pages/contents/index' });
}

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

/** 从医嘱中解析“N 周后复查”推算计划复诊日期 */
function parseFollowupDate(events: Array<{ eventType: string; rawText: string | null }>): string | null {
  for (const e of events) {
    if (e.eventType !== '医嘱' || !e.rawText) continue;
    const m = e.rawText.match(/(\d+)\s*周后复查/);
    if (m) {
      const weeks = parseInt(m[1], 10);
      const d = new Date();
      d.setDate(d.getDate() + weeks * 7);
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

async function load() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const latest = await getLatestAnalysis(episodes[0].id);
      analysis.value = latest;
      // 复诊问题数：来自复诊摘要
      try {
        const summary = await previewSummary(episodes[0].id);
        followupQuestionCount.value = summary.复诊问题.length;
      } catch {
        // 忽略
      }
      // 待确认项：尚未确认的事件 + 症状记录中的缺失字段
      const { timeline } = await import('@/api');
      const tl = await timeline(episodes[0].id);
      const pending: string[] = [];
      for (const e of tl.events) {
        if (e.verifyStatus === '尚未确认' && e.rawText) {
          pending.push(e.rawText.slice(0, 30) + (e.rawText.length > 30 ? '…' : ''));
        }
      }
      for (const log of tl.symptomLogs) {
        if (log.legChange === '尚未确认') pending.push('今天是否有腿部麻木或无力：尚未确认');
        if (log.plannedActivityDone === '尚未确认') pending.push('能否完成原本计划的活动：尚未确认');
      }
      pendingItems.value = pending;
      // 复诊日期：从医嘱解析
      const events = tl.events;
      const date = parseFollowupDate(events);
      if (date) {
        followupDate.value = date;
        const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
        daysUntil.value = Math.max(0, diff);
      } else {
        followupDate.value = '';
      }
    }
  } catch {
    // 未登录时不阻塞
  }
  try {
    const contents = await listPublishedContents();
    recommended.value = contents.slice(0, 2);
  } catch {
    // 加载失败不阻塞
  }
  try {
    const tips = await getSafetyTips();
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞
  }
}

onMounted(load);
// 切回首页时刷新（服务端可能已有新版本分析）
onShow(load);
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 16px 16px 100px;
}
.home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.home__title {
  font-size: 20px;
  font-weight: 500;
}
.home__content-entry {
  font-size: 13px;
  color: var(--primary);
}
.home__pending {
  background: rgba(199, 119, 0, 0.06);
}
.home__pending-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 500;
  color: var(--warn);
  margin-bottom: 8px;
}
.home__pending-icon { color: var(--warn); }
.home__pending-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.home__pending-dot { color: var(--text-2); }
.home__pending-item-text { font-size: 14px; flex: 1; }
.home__pending-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.home__analysis-version {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 400;
}
.home__analysis-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: flex-start;
}
.home__analysis-text {
  font-size: 14px;
  flex: 1;
  line-height: 1.5;
}
.home__analysis-empty {
  font-size: 14px;
  color: var(--text-3);
  margin-bottom: 12px;
}
.home__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.home__grid-item {
  width: calc(50% - 5px);
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
}
.home__grid-icon {
  font-size: 24px;
  color: var(--primary);
}
.home__grid-title {
  font-size: 15px;
  font-weight: 500;
  margin-top: 8px;
}
.home__grid-desc {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.home__countdown {
  display: flex;
  align-items: center;
  gap: 12px;
}
.home__countdown-icon { font-size: 24px; }
.home__countdown-body { flex: 1; }
.home__countdown-title {
  font-size: 15px;
  font-weight: 500;
  display: block;
}
.home__countdown-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
}
.home__countdown-arrow { color: var(--text-3); font-size: 20px; }
.home__recommend {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.home__recommend-thumb {
  width: 88px;
  height: 66px;
  border-radius: 8px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.home__recommend-play { color: var(--primary); font-size: 20px; }
.home__recommend-body { flex: 1; }
.home__recommend-title {
  font-size: 14px;
  font-weight: 500;
  display: block;
}
.home__recommend-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.home__recommend-duration { font-size: 12px; color: var(--text-3); }
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 32px;
}
.dialog {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
}
.dialog__title { font-size: 16px; font-weight: 500; margin-bottom: 12px; }
.dialog__item { display: flex; gap: 8px; margin-bottom: 8px; }
.dialog__dot { color: var(--error); }
.dialog__text { font-size: 14px; flex: 1; }
.dialog__note { font-size: 12px; color: var(--text-2); margin: 12px 0 16px; }
</style>
