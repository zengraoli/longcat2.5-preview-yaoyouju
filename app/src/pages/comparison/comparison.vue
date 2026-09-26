<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">原文对照</text>
      </view>
    </view>

    <view class="tabs">
      <view class="tab active">按解释查看</view>
      <view class="tab">按术语查看</view>
    </view>

    <view class="explain-card" v-if="currentExplanation">
      <text class="explain-head">
        解释 ②-2 <text class="explain-line">对应原文：{{ currentExplanation.line }}</text>
      </text>
      <text class="explain-quote">“{{ currentExplanation.quote }}”</text>
      <text class="explain-text">{{ currentExplanation.text }}</text>
    </view>

    <view class="card">
      <view class="card-head">
        <view class="raw-title-row">
          <image src="/static/icons/ic_doc.png" class="raw-icon" />
          <text class="raw-title">报告原文 · {{ formatDate(reportDate) }} · {{ examType }}</text>
          <text class="src-tag tag-muted">未修改</text>
        </view>
      </view>
      <text class="raw-text">
        <text
          v-for="(seg, i) in rawSegments"
          :key="i"
          :class="{ cited: seg.type === 'cited', conflict: seg.type === 'conflict' }"
        >{{ seg.text }}</text>
      </text>
      <view class="legend-row">
        <view class="legend-item">
          <view class="legend-dot cited"></view>
          <text class="legend-text">本条解释引用</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot conflict"></view>
          <text class="legend-text">与你描述侧别不一致，需确认</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">本段涉及的术语</text>
      <view class="term-row" v-for="(t, i) in terms" :key="i">
        <text class="term-name">{{ t.term }}</text>
        <text class="term-pos">报告中的表述 · {{ t.position }}</text>
      </view>
    </view>

    <view class="warn-alert">
      <image src="/static/icons/ic_warn.png" class="alert-icon" />
      <text class="alert-text">报告中没有描述的内容（例如是否存在神经根水肿）不会被写成“已排除”，而会标为“报告未提及”。</text>
    </view>

    <view class="footer">
      <button class="sub-btn" @click="goBack">返回一页分析</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../api/request';

const report = ref<any>({});
const terms = ref<{ term: string; position: string }[]>([]);
const reportDate = ref('');
const examType = ref('MRI');
const analysis = ref<any>(null);

const currentExplanation = computed(() => {
  const exps = analysis.value?.sections?.explanation || [];
  const exp = exps[1] || exps[0];
  if (!exp) return null;
  return { text: exp.text, line: '第 2 行', quote: '“硬膜囊受压”描述影像上突出物与神经外膜结构的位置关系' };
});

const rawSegments = computed(() => {
  const text: string = report.value.rawText || '';
  if (!text) return [];
  const termsList = (report.value.extractedTerms || []).map((t: any) => t.term).filter((t: string) => t.length >= 2);
  const segments: { text: string; type: 'normal' | 'cited' | 'conflict' }[] = [];
  let rest = text;
  // 按标点切分句子
  const sentences = text.split(/(?<=[。；\n])/);
  for (const sentence of sentences) {
    if (!sentence) continue;
    if (sentence.includes('右侧')) {
      segments.push({ text: sentence, type: 'conflict' });
    } else if (termsList.some((t) => sentence.includes(t))) {
      segments.push({ text: sentence, type: 'cited' });
    } else {
      segments.push({ text: sentence, type: 'normal' });
    }
  }
  return segments;
});

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

function goBack() {
  uni.navigateBack();
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (!episodeId) return;
    const reports = await api.getReportsByEpisode(episodeId);
    if (reports && reports.length > 0) {
      report.value = await api.getStructuredInfo(reports[0].id);
      reportDate.value = report.value.reportDate || '';
      terms.value = (report.value.extractedTerms || []).slice(0, 6);
    }
    const latest = await api.getLatestAnalysis(episodeId);
    if (latest.status === 'ok') analysis.value = latest;
  } catch (e) {
    console.error('Failed to load comparison:', e);
  }
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 48rpx;
}

.header {
  padding: 32rpx 0 24rpx;
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

.tabs {
  display: flex;
  gap: 8rpx;
  background: var(--surface);
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 26rpx;
  color: var(--text-2);
  border-radius: 12rpx;
}

.tab.active {
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(27, 34, 48, 0.08);
  color: var(--text-1);
  font-weight: 500;
}

.explain-card {
  background: var(--primary-light);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.explain-head {
  font-size: 24rpx;
  color: var(--primary);
  display: block;
  margin-bottom: 12rpx;
}

.explain-line {
  color: var(--text-3);
  font-weight: 400;
}

.explain-quote {
  font-size: 26rpx;
  color: var(--primary);
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.explain-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.7;
  display: block;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.card-head {
  margin-bottom: 20rpx;
}

.raw-title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.raw-icon {
  width: 36rpx;
  height: 36rpx;
}

.raw-title {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
  flex: 1;
}

.src-tag {
  font-size: 20rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.tag-muted {
  background: var(--bg);
  color: var(--text-3);
}

.raw-text {
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--text-1);
}

.raw-text .cited {
  background: rgba(15, 110, 116, 0.15);
  border-radius: 4rpx;
}

.raw-text .conflict {
  background: rgba(199, 119, 0, 0.18);
  border-radius: 4rpx;
}

.legend-row {
  display: flex;
  gap: 32rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid var(--border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.legend-dot.cited {
  background: var(--primary);
}

.legend-dot.conflict {
  background: var(--warn);
}

.legend-text {
  font-size: 22rpx;
  color: var(--text-2);
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 20rpx;
}

.term-row {
  display: flex;
  align-items: baseline;
  gap: 20rpx;
  padding: 16rpx 0;
  border-bottom: 2rpx solid var(--border);
}

.term-row:last-child {
  border-bottom: none;
}

.term-name {
  font-size: 24rpx;
  color: var(--primary);
  width: 160rpx;
  flex-shrink: 0;
}

.term-pos {
  font-size: 22rpx;
  color: var(--text-3);
}

.warn-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(199, 119, 0, 0.08);
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

.footer {
  padding: 24rpx 0;
}
</style>
