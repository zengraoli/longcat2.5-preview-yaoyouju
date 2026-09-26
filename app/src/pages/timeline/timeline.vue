<template>
  <view class="page">
    <view class="header">
      <text class="page-title">病程</text>
      <view class="header-actions">
        <image src="/static/icons/ic_search.png" class="action-icon" />
        <image src="/static/icons/ic_plus.png" class="action-icon" @click="goRecord" />
      </view>
    </view>

    <!-- 本次发作 -->
    <view class="card episode-card">
      <view class="episode-head">
        <text class="episode-title">{{ episode.title || '本次发作' }}</text>
        <text class="status-tag">{{ episode.status === 'active' ? '保守治疗中' : episode.status }}</text>
      </view>
      <text class="episode-onset">起点：{{ onsetText }}</text>
      <view class="stat-grid">
        <view class="stat-box">
          <text class="stat-num">{{ symptomCount }}</text>
          <text class="stat-label">条记录</text>
        </view>
        <view class="stat-box">
          <text class="stat-num">{{ reportCount }}</text>
          <text class="stat-label">份报告</text>
        </view>
        <view class="stat-box">
          <text class="stat-num">{{ analysisVersion ? 'v' + analysisVersion : 0 }}</text>
          <text class="stat-label">次分析</text>
        </view>
        <view class="stat-box">
          <text class="stat-num">{{ questionCount }}</text>
          <text class="stat-label">个复诊问题</text>
        </view>
      </view>
    </view>

    <!-- 14 天柱图 -->
    <view class="card">
      <view class="chart-head">
        <text class="chart-title">最近 14 天 · 每天能坐多久</text>
        <text class="chart-unit">分钟</text>
      </view>
      <view class="chart">
        <view class="chart-bar" v-for="(bar, i) in chartBars" :key="i">
          <view class="bar" :class="{ latest: i >= chartBars.length - 3 }" :style="{ height: bar.height + 'rpx' }"></view>
        </view>
      </view>
      <view class="chart-labels">
        <text class="chart-date">{{ chartBars[0]?.label }}</text>
        <text class="chart-date">{{ chartBars[chartBars.length - 1]?.label }}</text>
      </view>
      <text class="chart-disclaimer">图中变化只反映你的记录，不代表影像变化或病情恶化。</text>
    </view>

    <text class="section-label">记录（按事件，保留来源与核实状态）</text>

    <view class="timeline-list">
      <view class="timeline-item" v-for="item in timeline" :key="item.id">
        <view class="timeline-dot" :style="{ background: typeColor(item.event_type) }"></view>
        <view class="timeline-card card">
          <view class="card-head">
            <text class="event-date">{{ formatDate(item.occurred_at) }}</text>
            <view class="head-right">
              <text class="event-type-tag" :style="{ color: typeColor(item.event_type), background: typeBg(item.event_type) }">
                {{ typeLabel(item.event_type) }}
              </text>
              <view class="more-btn" @click="openMenu = openMenu === item.id ? '' : item.id">⋯</view>
            </view>
          </view>
          <text class="event-text">{{ item.raw_text || '暂无描述' }}</text>
          <view class="tag-row">
            <text class="tag tag-source">{{ item.source_type }}</text>
            <text class="tag" :class="item.verify_status === '已确认' ? 'tag-ok' : item.verify_status === '有冲突' ? 'tag-error' : 'tag-warn'">
              {{ item.verify_status }}
            </text>
          </view>
          <view class="item-menu" v-if="openMenu === item.id">
            <text class="menu-item" @click="correctEvent(item)">纠正</text>
            <text class="menu-item danger" @click="removeEvent(item)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card empty-card" v-if="timeline.length === 0">
      <text class="empty-text">暂无病程记录</text>
      <button class="sub-btn" @click="goRecord">记录今天</button>
    </view>

    <MainTabBar active-tab="timeline" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainTabBar from '../../components/MainTabBar.vue';
import { api } from '../../api/request';

const episode = ref<any>({});
const timeline = ref<any[]>([]);
const analysisVersion = ref<number | null>(null);
const openMenu = ref('');

const symptomCount = computed(() => timeline.value.length);
const reportCount = computed(() => timeline.value.filter((t) => t.event_type === '报告').length);
const questionCount = computed(() => {
  const unknown: string[] = latestAnalysis.value?.sections?.unknown || [];
  const logs = timeline.value.filter((t) => t.event_type === '症状');
  const worries = logs.filter((t) => t.top_worry && t.top_worry !== '尚未确认').length;
  return unknown.length + worries;
});

// 起病日期优先取用户在"变化确认"中的回答
const changeRaw = ref<string | null>(null);
const changeOnset = computed(() => {
  if (!changeRaw.value) return '';
  const m = changeRaw.value.match(/开始日期：([^；]*)/);
  return m?.[1]?.trim() || '';
});

const onsetText = computed(() => {
  const ep = episode.value;
  if (!ep) return '尚未确认';
  const answer = changeOnset.value;
  if (answer && answer !== '尚未确认') return `${answer} 开始腰痛（自述）。`;
  const date = ep.onset_date ? '约 ' + ep.onset_date.slice(0, 7) + ' 中旬' : '尚未确认';
  return `${date}（自述，具体日期${ep.onset_certainty}）`;
});

function typeLabel(t: string) {
  return { 症状: '症状记录', 报告: '检查报告', 分析: '一页分析', 医嘱: '医生建议', 症状开始: '症状开始' }[t] || t;
}
function typeColor(t: string) {
  return { 症状: '#1E9E5A', 报告: '#2F6FD8', 分析: '#98A1AE', 医嘱: '#C77700', 症状开始: '#1E9E5A' }[t] || '#0F6E74';
}
function typeBg(t: string) {
  return { 症状: '#E5F6EE', 报告: '#E7F0FE', 分析: '#F4F6F8', 医嘱: '#FDF6E3', 症状开始: '#E5F6EE' }[t] || '#E3F1F2';
}

const chartBars = computed(() => {
  const days: { label: string; minutes: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const logs = timeline.value.filter((t) => t.occurred_at?.slice(0, 10) === key);
    days.push({ label: key.slice(5).replace('-', '/'), minutes: logs.reduce((s, t) => s + (t.sit_minutes || 0), 0) });
  }
  const max = Math.max(60, ...days.map((d) => d.minutes));
  return days.map((d) => ({ ...d, height: Math.round((d.minutes / max) * 160) }));
});

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function goRecord() {
  uni.navigateTo({ url: '/pages/today/today' });
}

function correctEvent(item: any) {
  openMenu.value = '';
  uni.showToast({ title: '请选择要纠正的内容（演示）', icon: 'none' });
}

async function removeEvent(item: any) {
  openMenu.value = '';
  if (!uni.showModal) return;
  uni.showModal({
    title: '删除记录',
    content: '确定删除这条记录？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await api.deleteCareEvent(item.id);
        await loadData();
        uni.showToast({ title: '已删除', icon: 'success' });
      } catch (e: any) {
        uni.showToast({ title: e.message, icon: 'none' });
      }
    },
  });
}

async function loadData() {
  try {
    const episodes = await api.getEpisodes();
    episode.value = episodes[0] || {};
    const episodeId = episodes[0]?.id;
    if (!episodeId) return;
    timeline.value = await api.getTimeline(episodeId);
    const events = await api.getCareEvents(episodeId);
    const changeEvent = (events || []).find((e: any) => e.event_type === '变化确认');
    changeRaw.value = changeEvent?.raw_text || null;
    const latest = await api.getLatestAnalysis(episodeId);
    if (latest.status === 'ok') {
      analysisVersion.value = latest.version;
      timeline.value.unshift({
        id: 'analysis-' + latest.analysisId,
        event_type: '分析',
        occurred_at: latest.createdAt,
        source_type: '系统生成',
        raw_text: `生成于模型 M-2609；使用报告与症状记录。`,
        verify_status: '已确认',
      });
    }
  } catch (e) {
    console.error('Failed to load timeline:', e);
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 160rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 0 24rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-1);
}

.header-actions {
  display: flex;
  gap: 24rpx;
}

.action-icon {
  width: 36rpx;
  height: 36rpx;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.episode-card {
  margin-bottom: 24rpx;
}

.episode-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.episode-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
}

.status-tag {
  font-size: 22rpx;
  color: var(--primary);
  background: var(--primary-light);
  border-radius: 8rpx;
  padding: 6rpx 16rpx;
}

.episode-onset {
  font-size: 24rpx;
  color: var(--text-3);
  display: block;
  margin: 12rpx 0 24rpx;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.stat-box {
  background: var(--bg);
  border-radius: 16rpx;
  padding: 20rpx;
  text-align: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--primary);
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: var(--text-3);
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.chart-title {
  font-size: 28rpx;
  font-weight: 500;
}

.chart-unit {
  font-size: 22rpx;
  color: var(--text-3);
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
  height: 180rpx;
}

.chart-bar {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 32rpx;
  border-radius: 8rpx 8rpx 0 0;
  background: var(--primary);
}

.bar.latest {
  background: var(--warn);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

.chart-date {
  font-size: 20rpx;
  color: var(--text-3);
}

.chart-disclaimer {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-top: 16rpx;
}

.section-label {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 20rpx;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  position: relative;
  padding-left: 24rpx;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 16rpx;
  bottom: 16rpx;
  width: 4rpx;
  background: var(--border);
}

.timeline-item {
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: -24rpx;
  top: 40rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  border: 4rpx solid var(--surface);
  transform: translateX(-2rpx);
}

.timeline-card {
  padding: 24rpx 28rpx;
  margin-bottom: 0;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.event-date {
  font-size: 24rpx;
  color: var(--text-2);
}

.head-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.event-type-tag {
  font-size: 22rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.more-btn {
  font-size: 28rpx;
  color: var(--text-3);
  padding: 0 8rpx;
}

.event-text {
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-1);
  display: block;
  margin-bottom: 16rpx;
}

.tag-row {
  display: flex;
  gap: 12rpx;
}

.tag {
  font-size: 22rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.tag-source {
  background: var(--bg);
  color: var(--text-2);
}

.tag-ok {
  background: rgba(30, 158, 90, 0.1);
  color: var(--ok);
}

.tag-warn {
  background: rgba(199, 119, 0, 0.1);
  color: var(--warn);
}

.tag-error {
  background: rgba(217, 59, 59, 0.08);
  color: var(--error);
}

.item-menu {
  display: flex;
  gap: 32rpx;
  border-top: 2rpx solid var(--border);
  margin-top: 16rpx;
  padding-top: 16rpx;
}

.menu-item {
  font-size: 24rpx;
  color: var(--primary);
}

.menu-item.danger {
  color: var(--error);
}

.empty-card {
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: var(--text-3);
  display: block;
  margin-bottom: 20rpx;
}

.sub-btn {
  background: var(--primary-light);
  color: var(--primary);
  font-size: 24rpx;
  border-radius: 12rpx;
  border: none;
  padding: 12rpx 28rpx;
}
</style>
