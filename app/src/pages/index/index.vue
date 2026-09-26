<template>
  <view class="home-page">
    <view class="header">
      <view>
        <text class="page-title">当前情况</text>
        <text class="page-subtitle">{{ episodeSubtitle }}</text>
      </view>
    </view>

    <view class="card pending-card" v-if="pendingItems.length > 0">
      <view class="pending-head">
        <image src="/static/icons/ic_warn.png" class="pending-icon" />
        <text class="pending-title">有 {{ pendingItems.length }} 项信息尚未确认</text>
      </view>
      <text class="pending-desc">确认后才会生成新的分析；没有回答的问题会记录为“尚未确认”，不会被当作“没有”。</text>
      <view class="pending-q" v-for="item in pendingItems" :key="item">
        <text class="pending-q-text">{{ item }}</text>
      </view>
      <view class="pending-actions">
        <button class="primary-btn" @click="goToAnalysis">现在确认（约 30 秒）</button>
        <button class="sub-btn" @click="dismissPending">稍后</button>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">最新一页分析</text>
        <text class="version-tag" v-if="analysis">v{{ analysis.version }} · {{ formatDate(analysis.createdAt) }}</text>
      </view>
      <view class="card" v-if="analysis">
        <view class="kv-row" v-for="(k, i) in analysis.sections.known.slice(0, 2)" :key="i">
          <text class="kv-tag" style="background: var(--primary); color: #fff;">已知</text>
          <text class="kv-text">{{ k }}</text>
        </view>
        <button class="sub-btn block" @click="goToAnalysis">查看完整分析</button>
      </view>
      <view class="card empty" v-else>
        <text class="empty-text">尚未生成分析</text>
        <button class="sub-btn" @click="goToAnalysis">生成分析</button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">快捷入口</text>
      <view class="quick-grid">
        <view class="quick-item" @click="goToPage('/pages/today/today')">
          <image src="/static/icons/ic_pen.png" class="quick-icon" />
          <text class="quick-label">记录今天</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/report/report')">
          <image src="/static/icons/ic_upload.png" class="quick-icon" />
          <text class="quick-label">录入报告</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/qa/qa')">
          <image src="/static/icons/ic_chat.png" class="quick-icon" />
          <text class="quick-label">问与解释</text>
        </view>
        <view class="quick-item" @click="goToPage('/pages/followup/followup')">
          <image src="/static/icons/ic_doc.png" class="quick-icon" />
          <text class="quick-label">复诊摘要</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="recommendItems.length > 0">
      <text class="section-title">为你推荐</text>
      <view class="card" v-for="item in recommendItems" :key="item.id" @click="goToContent">
        <view class="rec-info">
          <text class="rec-title">{{ item.title }}</text>
          <text class="rec-meta">{{ item.type }} · 已审核 v{{ item.version || 1 }}</text>
          <text class="rec-reason" v-if="item.recommendReason">推荐理由：{{ item.recommendReason }}</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="planDate">
      <view class="card card-row plan-card" @click="goToPage('/pages/followup/followup')">
        <view class="plan-left">
          <text class="plan-label">计划复诊</text>
          <text class="plan-date">{{ planDate }}（约 {{ planDays }} 天后）</text>
          <text class="plan-source">来源：按最近记录推算 · 未经核实</text>
        </view>
        <text class="plan-arrow">›</text>
      </view>
    </view>

    <view class="section emergency-section">
      <view class="emergency-bar" @click="goEmergency">
        <image src="/static/icons/ic_warn.png" class="emergency-icon" />
        <text class="emergency-text">症状突然变化或出现严重信号？查看就医提示</text>
      </view>
    </view>
      <MainTabBar active-tab="index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api/request';
import MainTabBar from '../../components/MainTabBar.vue';
import { ensureEpisodeId } from '../../utils/episode';

const episode = ref<any>({});
const analysis = ref<any>(null);
const records = ref<any[]>([]);
const recommendItems = ref<any[]>([]);

const pendingItems = computed<string[]>(() => (analysis.value?.sections?.unknown || []).slice(0, 4));

const episodeSubtitle = computed(() => {
  const ep = episode.value;
  if (!ep || !ep.title) return '暂无病程数据';
  const statusText = ep.status === 'active' ? '保守治疗中' : (ep.status || '尚未确认');
  const last = records.value[0] ? records.value[0].occurred_at?.slice(0, 10) : '';
  return `本次发作 · ${statusText} · 上次记录：${last || '暂无'} · 起点${ep.onset_date ? ep.onset_date.slice(0, 7) : '尚未确认'}`;
});

const planDate = computed(() => {
  const latest = records.value[0]?.occurred_at;
  if (!latest) return '';
  const d = new Date(latest);
  d.setDate(d.getDate() + 28);
  return d.toISOString().slice(0, 10);
});

const planDays = computed(() => {
  const latest = records.value[0]?.occurred_at;
  if (!latest) return 0;
  return Math.max(0, Math.round((new Date(planDate.value).getTime() - new Date(latest).getTime()) / 86400000));
});

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

function dismissPending() {
  // 稍后：不跳转，仅本次隐藏提示（分析生成时会再次询问）
}

function goToContent() {
  goToPage('/pages/content/content');
}

function goEmergency() {
  uni.showModal({
    title: '紧急就医提示',
    content: '如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。',
    showCancel: false,
    confirmText: '我知道了',
  });
}

function goToPage(url: string) {
  uni.navigateTo({ url });
}

function goToAnalysis() {
  uni.navigateTo({ url: '/pages/change/change' });
}

onMounted(async () => {
  const episodeId = await ensureEpisodeId();
  if (!episodeId) return;
  try {
    const episodes = await api.getEpisodes();
    episode.value = episodes[0] || {};
    records.value = await api.getTimeline(episodeId);
  } catch (e) {
    console.error('Failed to load episodes:', e);
  }
  try {
    const latest = await api.getLatestAnalysis(episodeId);
    if (latest.status === 'ok') analysis.value = latest;
  } catch (e) {
    console.error('Failed to load analysis:', e);
  }
  try {
    recommendItems.value = await api.getPublishedContents();
  } catch (e) {
    console.error('Failed to load contents:', e);
  }
});
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 140rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48rpx 32rpx 24rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--text-1);
}

.emergency-btn {
  padding: 12rpx 24rpx;
  background: rgba(217, 59, 59, 0.1);
  border-radius: 20rpx;
}

.emergency-text {
  font-size: 22rpx;
  color: var(--error);
}

.section {
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  display: block;
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-text {
  font-size: 26rpx;
  color: var(--text-1);
  flex: 1;
}

.card.empty {
  flex-direction: column;
  align-items: flex-start;
}

.empty-text {
  font-size: 26rpx;
  color: var(--text-3);
  margin-bottom: 16rpx;
}

.analysis-summary {
  font-size: 26rpx;
  color: var(--text-1);
}

.analysis-version {
  font-size: 20rpx;
  color: var(--text-3);
  margin-top: 8rpx;
  display: block;
}

.sub-btn {
  background: var(--primary-light);
  color: var(--primary);
  font-size: 24rpx;
  border-radius: 12rpx;
  border: none;
  padding: 12rpx 28rpx;
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.quick-item {
  width: calc(50% - 8rpx);
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.quick-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
}

.emergency-section {
  margin-bottom: 160rpx;
}

.emergency-bar {
  display: flex;
  align-items: center;
  background: rgba(217, 59, 59, 0.1);
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
}

.emergency-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
}

.emergency-text {
  font-size: 26rpx;
  color: var(--error);
  font-weight: 500;
  flex: 1;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.page-subtitle {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-top: 6rpx;
}

.version-tag {
  font-size: 20rpx;
  color: var(--text-2);
  background: var(--bg);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.pending-card {
  background: #FDF6E3;
  margin-bottom: 32rpx;
}

.pending-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.pending-icon {
  width: 36rpx;
  height: 36rpx;
}

.pending-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--warn);
}

.pending-desc {
  font-size: 24rpx;
  color: var(--text-2);
  line-height: 1.6;
  display: block;
  margin-bottom: 16rpx;
}

.pending-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.pending-actions .primary-btn {
  flex: 1;
  margin: 0;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 26rpx;
}

.pending-actions .sub-btn {
  flex: 1;
}

.plan-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.plan-left {
  flex: 1;
}

.plan-label {
  font-size: 24rpx;
  color: var(--text-2);
  display: block;
}

.plan-date {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--primary);
  display: block;
  margin: 4rpx 0;
}

.plan-source {
  font-size: 20rpx;
  color: var(--text-3);
  display: block;
}

.plan-arrow {
  font-size: 40rpx;
  color: var(--text-3);
}

.quick-label {
  font-size: 24rpx;
  color: var(--text-2);
}

.rec-info {
  display: flex;
  flex-direction: column;
}

.rec-title {
  font-size: 26rpx;
  color: var(--text-1);
  font-weight: 500;
}

.rec-meta {
  font-size: 22rpx;
  color: var(--text-3);
  margin-top: 6rpx;
}

.rec-reason {
  font-size: 22rpx;
  color: var(--text-2);
  margin-top: 6rpx;
}

.countdown-text {
  font-size: 26rpx;
  color: var(--primary);
  font-weight: 500;
}
</style>
