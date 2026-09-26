<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">核对整理后的信息</text>
      </view>
      <text class="step-chip">第 4 / 4 步</text>
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">请核对系统整理的信息。缺失项显示为“尚未确认”，冲突项需要你确认后才会进入分析。</text>
    </view>

    <!-- 报告信息 -->
    <view class="card">
      <view class="card-head">
        <text class="card-title">报告信息 · {{ formatDate(report.reportDate) }}</text>
        <view class="head-right">
          <text class="source-tag tag-info">来源：报告原文</text>
          <image src="/static/icons/ic_edit.png" class="edit-icon" @click="goReport" />
        </view>
      </view>
      <view class="term-row" v-for="(t, i) in cleanTerms(report.extractedTerms || []).slice(0, 8)" :key="i">
        <text class="term-label">{{ termLabel(t.term) }}</text>
        <text class="term-value">{{ t.term }}</text>
        <text class="line-tag">原文{{ t.position || '第' + (i + 1) + '行' }}</text>
      </view>
      <view class="empty-row" v-if="!report.extractedTerms || report.extractedTerms.length === 0">
        <text class="empty-text">暂无提取到的关键术语</text>
      </view>
    </view>

    <!-- 冲突确认 -->
    <view class="conflict-card" v-if="report.hasConflict">
      <view class="conflict-title-row">
        <image src="/static/icons/ic_warn.png" class="conflict-icon" />
        <text class="conflict-title">侧别冲突：{{ conflictText }}</text>
      </view>
      <view class="conflict-btns">
        <button
          v-for="opt in ['我的症状在左侧', '都有 / 不确定']"
          :key="opt"
          class="conflict-btn"
          @click="resolveConflict(opt)"
        >{{ opt }}</button>
      </view>
    </view>

    <!-- 症状与变化 -->
    <view class="card">
      <view class="card-head">
        <text class="card-title">症状与变化</text>
        <view class="head-right">
          <text class="source-tag tag-warn">来源：自述</text>
          <image src="/static/icons/ic_edit.png" class="edit-icon" @click="goChange" />
        </view>
      </view>
      <view class="info-row" v-for="(row, i) in symptomRows" :key="i">
        <text class="row-label">{{ row.label }}</text>
        <text class="row-value">{{ row.value }}</text>
        <text class="row-tag" :class="row.value === '尚未确认' || row.value === '尚未回答' ? 'tag-warn' : 'tag-ok'">
          {{ row.value === '尚未确认' || row.value === '尚未回答' ? '尚未确认' : '已确认' }}
        </text>
      </view>
    </view>

    <!-- 既有医嘱 -->
    <view class="card">
      <view class="card-head">
        <text class="card-title">既有医嘱</text>
        <view class="head-right">
          <text class="source-tag tag-warn">来源：自述</text>
          <image src="/static/icons/ic_edit.png" class="edit-icon" @click="goReport" />
        </view>
      </view>
      <view v-if="doctorAdvice">
        <text class="row-label">医生建议</text>
        <text class="advice-text">{{ doctorAdvice }}</text>
        <text class="row-tag tag-warn">未经核实</text>
      </view>
      <view class="empty-row" v-else>
        <text class="empty-text">尚未录入医嘱</text>
      </view>
    </view>

    <view class="warn-alert">
      <image src="/static/icons/ic_warn.png" class="alert-icon" />
      <text class="alert-text">“尚未确认”不会被当作“没有”；旧记录中的“当时没有”也不会被当作“现在没有”。</text>
    </view>

    <view class="footer">
      <button class="primary-btn" :disabled="generating" @click="generate">
        {{ generating ? '正在生成…' : '确认无误，生成一页分析' }}
      </button>
      <text class="link-text" @click="goBackByStep">返回修改</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';
import { api } from '../../api/request';
import { parseChangeText, bowelStatus } from '../../utils/chief';

const report = ref<any>({});
const episode = ref<any>({});
const changeAnswers = ref<any>(null);
const analysis = ref<any>(null);
const doctorAdvice = ref('');
const generating = ref(false);
const openMenuId = ref('');

const conflictText = computed(() => '报告为“右侧”，你的描述为“左侧”');

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

function cleanTerms(terms: any[]) {
  const seen = new Set<string>();
  return (terms || [])
    .map((t: any) => ({ term: t.term as string, position: t.position as string }))
    .filter((t: any) => t.term && (t.term.length >= 2 || t.term.includes('/')))
    .filter((t: any) => !seen.has(t.term) && seen.add(t.term));
}

function termLabel(term: string) {
  if (term.includes('神经根')) return '神经根';
  if (term.includes('硬膜囊')) return '关键术语';
  if (term.includes('突出') || term.includes('膨出')) return '关键术语';
  return '关键术语';
}

const symptomRows = computed(() => {
  const rows = [];
  const onset = changeAnswers.value?.['开始日期'] || episode.value.onset_date || '尚未确认';
  rows.push({ label: '症状开始', value: onset });
  rows.push({ label: '最近变化', value: changeAnswers.value?.['变化'] || '尚未确认' });
  const unknown: string[] = analysis.value?.sections?.unknown || [];
  rows.push({ label: '腿部无力', value: unknown.some((u: string) => u.includes('腿部无力')) ? '尚未回答' : '尚未确认' });
  const change = changeAnswers.value || parseChangeText(null);
  rows.push({ label: '大小便/鞍区', value: bowelStatus(change) });
  rows.push({ label: '主要困惑', value: changeAnswers.value?.['困惑'] || '尚未确认' });
  return rows;
});

const confusionTitle = ref('');

async function loadData() {
  try {
    const episodes = await api.getEpisodes();
    episode.value = episodes[0] || {};
    const episodeId = episodes[0]?.id;
    if (!episodeId) return;

    const reports = await api.getReportsByEpisode(episodeId);
    if (reports && reports.length > 0) {
      report.value = await api.getStructuredInfo(reports[0].id);
    }

    const events = await api.getCareEvents(episodeId);
    const confusionEvent = (events || []).find((e: any) => e.event_type === '主要困惑');
    if (confusionEvent) {
      const m = confusionEvent.raw_text.match(/主要困惑：([^；]*)/);
      confusionTitle.value = m?.[1]?.trim() || '';
    }
    const changeEvent = (events || []).find((e: any) => e.event_type === '变化确认');
    if (changeEvent) {
      const parsed = parseChangeText(changeEvent.raw_text);
      changeAnswers.value = {
        '变化': parsed.change,
        '开始日期': parsed.onset,
        '困惑': confusionTitle.value,
      };
    }
    const adviceEvent = (events || []).find((e: any) => e.event_type === '医嘱');
    doctorAdvice.value = adviceEvent?.raw_text || '';

    const latest = await api.getLatestAnalysis(episodeId);
    if (latest.status === 'ok') analysis.value = latest;
  } catch (e) {
    console.error('Failed to load structured info:', e);
  }
}

onMounted(loadData);

function goBack() {
  uni.navigateBack();
}

function goBackByStep() {
  uni.navigateTo({ url: '/pages/change/change' });
}

function goReport() {
  uni.navigateTo({ url: '/pages/report/report' });
}

function goChange() {
  uni.navigateTo({ url: '/pages/change/change' });
}

async function resolveConflict(opt: string) {
  try {
    await api.verifyReport(report.value.reportId, {
      verifyStatus: '已确认',
      extractedTerms: report.value.extractedTerms || [],
    });
    uni.showToast({ title: `已确认：${opt}`, icon: 'success' });
    await loadData();
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
}

async function generate() {
  generating.value = true;
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (!episodeId) {
      uni.showToast({ title: '请先创建病程', icon: 'none' });
      return;
    }
    const res = await api.createAnalysis({
      episodeId,
      reportId: report.value.reportId || undefined,
    });
    if (res.safetyMessage) {
      uni.navigateTo({ url: '/pages/redflag/redflag?items=' + encodeURIComponent(res.safetyMessage) });
      return;
    }
    uni.navigateTo({ url: `/pages/analysis/analysis?taskId=${res.taskId}` });
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  } finally {
    generating.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.step-chip {
  font-size: 22rpx;
  color: var(--text-3);
  background: var(--bg);
  border-radius: 16rpx;
  padding: 8rpx 20rpx;
}

.info-alert,
.warn-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.warn-alert {
  background: rgba(199, 119, 0, 0.08);
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

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
}

.head-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.source-tag {
  font-size: 22rpx;
  border-radius: 8rpx;
  padding: 6rpx 16rpx;
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

.edit-icon {
  width: 32rpx;
  height: 32rpx;
}

.term-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 0;
  border-bottom: 2rpx solid var(--border);
}

.term-row:last-child {
  border-bottom: none;
}

.term-label {
  font-size: 24rpx;
  color: var(--text-2);
  width: 120rpx;
  flex-shrink: 0;
}

.term-value {
  font-size: 26rpx;
  color: var(--text-1);
  flex: 1;
}

.line-tag {
  font-size: 20rpx;
  color: var(--text-3);
  background: var(--bg);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  flex-shrink: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 2rpx solid var(--border);
}

.info-row:last-child {
  border-bottom: none;
}

.row-label {
  font-size: 24rpx;
  color: var(--text-2);
  width: 160rpx;
  flex-shrink: 0;
}

.row-value {
  font-size: 26rpx;
  color: var(--text-1);
  flex: 1;
}

.row-tag {
  font-size: 20rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  flex-shrink: 0;
}

.advice-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  display: block;
  margin: 12rpx 0;
}

.empty-row {
  padding: 24rpx 0;
}

.empty-text {
  font-size: 24rpx;
  color: var(--text-3);
}

.conflict-card {
  background: rgba(217, 59, 59, 0.06);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.conflict-title-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.conflict-icon {
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.conflict-title {
  font-size: 26rpx;
  color: var(--error);
  line-height: 1.5;
  flex: 1;
}

.conflict-btns {
  display: flex;
  gap: 20rpx;
}

.conflict-btn {
  flex: 1;
  height: 80rpx;
  background: var(--surface);
  border: 2rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 24rpx;
  color: var(--text-1);
}

.footer {
  padding: 24rpx 0 48rpx;
}

.link-text {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: var(--primary);
  margin-top: 32rpx;
}
</style>
