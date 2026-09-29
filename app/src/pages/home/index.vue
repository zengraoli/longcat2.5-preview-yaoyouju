<template>
  <view class="home">
    <view class="home__header">
      <view>
        <text class="home__title">当前情况</text>
        <text class="home__subtitle">本次发作 · 第 5 周 · 上次记录：昨天</text>
      </view>
      <view class="home__header-right">
        <text class="home__bell">🔔</text>
        <view class="home__avatar">U</view>
      </view>
    </view>

    <!-- 待确认项 -->
    <view class="home__pending card">
      <view class="home__pending-title">
        <text class="home__pending-icon">⚠</text>
        <text class="home__pending-text">有 {{ pendingCount }} 项信息尚未确认</text>
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
        <text class="home__analysis-version">v{{ analysis?.version }} · 今天</text>
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

    <!-- 快捷入口 -->
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
      <view class="home__grid-item" @click="goFollowup">
        <text class="home__grid-icon">📋</text>
        <text class="home__grid-title">复诊摘要</text>
        <text class="home__grid-desc">{{ followupQuestionCount }} 个问题待确认</text>
      </view>
    </view>

    <!-- 复诊倒计时 -->
    <view class="card home__countdown">
      <text class="home__countdown-icon">📅</text>
      <view class="home__countdown-body">
        <text class="home__countdown-title">计划复诊：2026-10-08（约 17 天后）</text>
        <text class="home__countdown-desc">来源：你录入的医嘱“4 周后复查” · 未经核实</text>
      </view>
      <text class="home__countdown-arrow">›</text>
    </view>

    <!-- 为你推荐 -->
    <view class="card">
      <text class="card-title">为你推荐（原因：报告提到 L5/S1）</text>
      <view v-for="item in recommended" :key="item.id" class="home__recommend">
        <view class="home__recommend-thumb">
          <text class="home__recommend-play">▶</text>
        </view>
        <view class="home__recommend-body">
          <text class="home__recommend-title">{{ item.title }}</text>
          <view class="home__recommend-meta">
            <StatusTag label="已审核 v2" />
            <text class="home__recommend-duration">2:10</text>
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

    <BottomTab :items="tabItems" current="/pages/home/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppButton from '@/components/AppButton.vue';
import StatusTag from '@/components/StatusTag.vue';
import EmergencyBar from '@/components/EmergencyBar.vue';
import BottomTab from '@/components/BottomTab.vue';
import {
  listEpisodes,
  getLatestAnalysis,
  listPublishedContents,
  getSafetyTips,
  type AnalysisResult,
  type ContentItem,
} from '@/api';

const pendingCount = ref(2);
const pendingItems = ref(['今天是否有腿部麻木或无力', '报告写“右侧”，你的描述是“左侧”']);
const pendingDismissed = ref(false);
const analysis = ref<AnalysisResult | null>(null);
const recommended = ref<ContentItem[]>([]);
const followupQuestionCount = ref(4);
const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

const tabItems = [
  { pagePath: 'pages/home/index', text: '当前情况', icon: '🏠' },
  { pagePath: 'pages/qa/index', text: '问与解释', icon: '💬' },
  { pagePath: 'pages/timeline/index', text: '病程', icon: '📈' },
  { pagePath: 'pages/followup/index', text: '复诊准备', icon: '📋' },
  { pagePath: 'pages/mine/index', text: '我的', icon: '👤' },
];

function goConfirm() {
  uni.navigateTo({ url: '/pages/confirm/index' });
}
function goRecord() {
  uni.navigateTo({ url: '/pages/record/index' });
}
function goReport() {
  uni.navigateTo({ url: '/pages/report/index' });
}
function goQa() {
  uni.switchTab({ url: '/pages/qa/index' });
}
function goFollowup() {
  uni.switchTab({ url: '/pages/followup/index' });
}
function goAnalysis() {
  uni.navigateTo({ url: '/pages/analysis/index' });
}

onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      // 取最新一次分析
      analysis.value = await getLatestAnalysis(episodes[0].id);
    }
  } catch {
    // 未登录时跳转登录页
    uni.reLaunch({ url: '/pages/login/index' });
  }
  try {
    const contents = await listPublishedContents();
    recommended.value = contents.slice(0, 2);
  } catch {
    // 推荐加载失败不阻塞
  }
  try {
    const tips = await getSafetyTips();
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞
  }
});
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
  font-size: 17px;
  font-weight: 500;
  display: block;
}
.home__subtitle {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
}
.home__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.home__bell { font-size: 20px; }
.home__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.home__pending {
  background: rgba(199, 119, 0, 0.06);
}
.home__pending-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.home__pending-icon { color: var(--warn); }
.home__pending-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--warn);
}
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
}
.home__grid-icon {
  font-size: 24px;
  color: var(--primary);
  display: block;
}
.home__grid-title {
  font-size: 15px;
  font-weight: 500;
  display: block;
  margin-top: 8px;
}
.home__grid-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
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
