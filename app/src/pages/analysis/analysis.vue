<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">一页分析</text>
      </view>
      <view class="header-actions">
        <image src="/static/icons/ic_share.png" class="action-icon" @click="share" />
        <image src="/static/icons/ic_more.png" class="action-icon" @click="showMore = !showMore" />
      </view>
    </view>

    <view class="meta-row">
      <text class="nodiag-tag">不作诊断</text>
      <text class="meta-text">基于 {{ formatDate(analysis.createdAt) }} 的信息</text>
    </view>
    <view class="meta-row sub">
      <text class="meta-text">分析版本 v{{ analysis.version }} · 模型 M-2609</text>
    </view>

    <text class="intro">你上传的报告中提到了 {{ analysis.sections.known.join('、') }}；你描述目前腰痛持续约 1 个月且最近加重。报告日期已确认，症状开始日期和是否出现腿部无力还需要确认。下面先解释报告术语，再整理复诊时需要确认的问题。</text>

    <view class="section-card">
      <view class="section-head">
        <view class="num-circle">1</view>
        <text class="section-title">当前确认的信息与来源</text>
      </view>
      <view class="bullet-item" v-for="(item, i) in analysis.sections.known" :key="'k' + i">
        <view class="bullet-dot"></view>
        <text class="bullet-text">报告（{{ formatDate(reportDate) }}，MRI）提到 {{ item }}；腰痛约 1 个月，最近一周加重，主要在左侧。</text>
        <text class="src-tag tag-info">报告原文 · 可查看</text>
      </view>
      <view class="bullet-item">
        <view class="bullet-dot"></view>
        <text class="bullet-text">你描述：腰痛约 1 个月，最近一周加重，主要在左侧；没有大小便或鞍区异常。</text>
        <text class="src-tag tag-warn">自述 · {{ formatDate(analysis.createdAt) }}</text>
      </view>
      <view class="bullet-item" v-if="doctorAdvice">
        <view class="bullet-dot"></view>
        <text class="bullet-text">医生建议：{{ doctorAdvice }}</text>
        <text class="src-tag tag-warn">自述 · 未经核实</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-head">
        <view class="num-circle">2</view>
        <text class="section-title">这些信息能支持什么解释</text>
      </view>
      <view class="exp-item" v-for="(exp, i) in analysis.sections.explanation" :key="'e' + i">
        <view class="bullet-dot"></view>
        <text class="exp-text">{{ exp.text }}</text>
        <text class="src-tag tag-ok">来源：{{ exp.source }}</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-head">
        <view class="num-circle">3</view>
        <text class="section-title">仍缺哪些信息、哪些不能据此判断</text>
      </view>
      <view class="bullet-item" v-for="(item, i) in analysis.sections.unknown" :key="'u' + i">
        <view class="bullet-dot"></view>
        <text class="bullet-text">{{ item }}</text>
      </view>
      <view class="bullet-item">
        <view class="bullet-dot"></view>
        <text class="bullet-text">不能据此判断这次疼痛的原因、严重程度，或是否需要手术。</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-head">
        <view class="num-circle">4</view>
        <text class="section-title">建议向医生确认的问题与下一步</text>
      </view>
      <view class="next-item" v-for="(item, i) in analysis.sections.nextSteps" :key="'n' + i">
        <view class="next-box"></view>
        <text class="next-text">{{ item }}</text>
      </view>
      <button class="soft-btn" @click="addToFollowup">加入复诊问题清单（已选 {{ followupCount }} 条）</button>
    </view>

    <view class="section-card">
      <view class="section-head">
        <view class="num-circle">5</view>
        <text class="section-title">可选科普视频与本次记录</text>
      </view>
      <view class="video-card">
        <view class="video-thumb">
          <image src="/static/icons/ic_play.png" class="play-icon" />
        </view>
        <view class="video-info">
          <text class="video-title">腰椎节段位置：L5/S1 在哪里</text>
          <view class="tag-row">
            <text class="src-tag tag-ok">已审核 v2</text>
            <text class="src-tag tag-time">2:10</text>
            <text class="src-tag tag-info">有字幕</text>
          </view>
        </view>
      </view>
      <view class="card-actions">
        <button class="sub-btn" @click="saveToTimeline">保存到病程</button>
        <button class="primary-btn small" @click="goFollowup">生成复诊摘要</button>
      </view>
    </view>

    <view class="section-card feedback-card">
      <text class="section-title">这次分析对你有帮助吗？</text>
      <view class="chip-group">
        <view
          v-for="opt in ['看懂了', '知道下一步', '都不好，问题没解决']"
          :key="opt"
          class="chip"
          :class="{ selected: feedback === opt }"
          @click="feedback = opt"
        >{{ opt }}</view>
      </view>
      <view class="report-row">
        <image src="/static/icons/ic_flag.png" class="flag-icon" />
        <text class="report-link" @click="goFeedback">报告错误（会记录分析版本与影响范围）</text>
      </view>
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">本页说明“已经知道什么、仍不知道什么、接下来怎么办”，帮助你理解和复诊，不代替医生诊断。</text>
    </view>

    <MainTabBar active-tab="index" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MainTabBar from '../../components/MainTabBar.vue';
import { api } from '../../api/request';

const pages = getCurrentPages();
const cur = pages[pages.length - 1] as any;
const taskId = cur?.options?.taskId || '';

const analysis = ref<any>({ sections: { known: [], explanation: [], unknown: [], nextSteps: [] } });
const reportDate = ref('');
const doctorAdvice = ref('');
const feedback = ref('');
const followupCount = ref(0);
const showMore = ref(false);

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

function goBack() {
  uni.navigateBack();
}

function share() {
  uni.showToast({ title: '摘要链接（演示）', icon: 'none' });
}

function goFeedback() {
  uni.navigateTo({ url: '/pages/feedback/feedback' });
}

function goFollowup() {
  uni.navigateTo({ url: '/pages/followup/followup' });
}

function addToFollowup() {
  followupCount.value++;
  uni.showToast({ title: '已加入复诊问题清单', icon: 'success' });
}

function saveToTimeline() {
  api.createCareEvent({
    episodeId: analysis.value.episodeId,
    eventType: '分析',
    occurredAt: analysis.value.createdAt,
    sourceType: '系统生成',
    raw_text: `一页分析 v${analysis.value.version}（模型 M-2609）`,
    verifyStatus: '已确认',
  }).then(() => uni.showToast({ title: '已保存到病程', icon: 'success' }))
    .catch((e: any) => uni.showToast({ title: e.message, icon: 'none' }));
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (taskId) {
      analysis.value = await api.getAnalysis(taskId);
    } else if (episodeId) {
      // 优先展示已有最新分析，避免重复创建
      const latest = await api.getLatestAnalysis(episodeId);
      if (latest.status === 'ok') {
        analysis.value = latest;
      } else {
        const res = await api.createAnalysis({ episodeId });
        if (!res.safetyMessage) {
          analysis.value = await api.getAnalysis(res.taskId);
        }
      }
    }
    const events = episodeId ? await api.getCareEvents(episodeId) : [];
    const reportEvent = (events || []).find((e: any) => e.event_type === '报告');
    reportDate.value = reportEvent?.occurred_at || '';
    const adviceEvent = (events || []).find((e: any) => e.event_type === '医嘱');
    doctorAdvice.value = adviceEvent?.raw_text || '';
  } catch (e) {
    console.error('Failed to load analysis:', e);
  }
});
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
  padding: 32rpx 0 16rpx;
}

.back-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.back-icon {
  width: 36rpx;
  height: 36rpx;
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

.meta-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.meta-row.sub {
  margin-bottom: 20rpx;
}

.nodiag-tag {
  font-size: 20rpx;
  color: var(--error);
  background: rgba(217, 59, 59, 0.08);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.meta-text {
  font-size: 22rpx;
  color: var(--text-3);
}

.intro {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.7;
  display: block;
  margin-bottom: 24rpx;
}

.section-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.num-circle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
}

.bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.bullet-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--text-3);
  flex-shrink: 0;
  margin-top: 12rpx;
}

.bullet-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.src-tag {
  font-size: 20rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.tag-info {
  background: rgba(47, 111, 216, 0.08);
  color: var(--info);
}

.tag-warn {
  background: rgba(199, 119, 0, 0.1);
  color: var(--warn);
}

.tag-ok {
  background: rgba(30, 158, 90, 0.1);
  color: var(--ok);
}

.tag-time {
  background: var(--bg);
  color: var(--text-3);
}

.exp-item {
  margin-bottom: 24rpx;
  position: relative;
}

.exp-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  display: block;
  margin-bottom: 8rpx;
}

.next-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.next-box {
  width: 24rpx;
  height: 24rpx;
  border-radius: 4rpx;
  background: var(--primary);
  flex-shrink: 0;
}

.next-text {
  font-size: 26rpx;
  color: var(--text-1);
}

.soft-btn {
  width: 100%;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 24rpx;
  margin-top: 8rpx;
}

.video-card {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.video-thumb {
  width: 120rpx;
  height: 90rpx;
  border-radius: 12rpx;
  background: #DDE5EA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.play-icon {
  width: 40rpx;
  height: 40rpx;
  background: var(--primary);
  border-radius: 8rpx;
  padding: 6rpx;
}

.video-title {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 10rpx;
}

.tag-row {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.card-actions {
  display: flex;
  gap: 16rpx;
}

.sub-btn {
  flex: 1;
  height: 80rpx;
  background: var(--surface);
  border: 2rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 26rpx;
  color: var(--text-1);
}

.primary-btn.small {
  flex: 1;
  height: 80rpx;
  font-size: 26rpx;
}

.feedback-card .section-title {
  margin-bottom: 20rpx;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  padding: 14rpx 32rpx;
  background: var(--bg);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.chip.selected {
  background: var(--surface);
  border-color: var(--border);
}

.report-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
}

.flag-icon {
  width: 32rpx;
  height: 32rpx;
}

.report-link {
  font-size: 24rpx;
  color: var(--text-3);
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
}

.alert-icon {
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.alert-text {
  font-size: 24rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}
</style>
