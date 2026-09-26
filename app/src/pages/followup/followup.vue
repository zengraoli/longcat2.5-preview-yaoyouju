<template>
  <view class="page">
    <view class="header">
      <text class="page-title">复诊准备</text>
      <image src="/static/icons/ic_share.png" class="action-icon" @click="copyText" />
    </view>

    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >{{ t.label }}</view>
    </view>

    <block v-if="activeTab === 'summary'">
      <view class="card summary-card">
        <text class="summary-title">复诊交接摘要</text>
        <text class="summary-meta">生成于 {{ formatDate(generatedAt) }} · 由用户自述与报告原文整理 · 未经医生核实</text>
        <view class="divider"></view>

        <view class="section-block">
          <view class="block-head">
            <text class="block-title">本次发作起点</text>
            <text class="link-text-sm">✏️ 纠正</text>
          </view>
          <text class="block-text">{{ onsetText }}</text>
          <view class="tag-row">
            <text class="tag tag-source">自述</text>
            <text class="tag" :class="onsetConfirmed ? 'tag-ok' : 'tag-warn'">{{ onsetConfirmed ? '已确认' : '日期尚未确认' }}</text>
          </view>
        </view>

        <view class="section-block">
          <view class="block-head">
            <text class="block-title">主要症状与变化</text>
            <text class="link-text-sm">✏️ 纠正</text>
          </view>
          <text class="block-text">{{ chiefText }}</text>
          <view class="tag-row">
            <text class="tag tag-source">自述 · {{ symptomCount }} 条记录</text>
            <text class="tag tag-warn">腿部无力：尚未确认</text>
          </view>
        </view>

        <view class="section-block">
          <view class="block-head">
            <text class="block-title">相关检查原文</text>
            <text class="link-text-sm">✏️ 纠正</text>
          </view>
          <view v-for="(r, i) in sections.examinationFindings?.reports || []" :key="i">
            <text class="block-text">{{ r.date }} 腰椎 MRI：“{{ r.text }}”</text>
          </view>
          <view class="tag-row">
            <text class="tag tag-info">报告原文</text>
          </view>
        </view>

        <view class="section-block">
          <view class="block-head">
            <text class="block-title">已经接受的专业建议</text>
            <text class="link-text-sm">✏️ 纠正</text>
          </view>
          <text class="block-text" v-for="(r, i) in sections.diagnosisAndAssessment?.doctorRecords || []" :key="i">{{ r.text }}</text>
          <view class="tag-row">
            <text class="tag tag-source">自述转述</text>
            <text class="tag tag-warn">未经核实</text>
          </view>
        </view>

        <view class="section-block">
          <view class="block-head">
            <text class="block-title">已采取的行动</text>
            <text class="link-text-sm">✏️ 纠正</text>
          </view>
          <text class="block-text">{{ actionsText }}</text>
          <view class="tag-row">
            <text class="tag tag-source">自述</text>
          </view>
        </view>

        <view class="section-block">
          <view class="block-head">
            <text class="block-title">最希望解决的问题</text>
            <text class="link-text-sm">✏️ 纠正</text>
          </view>
          <text class="block-text">{{ questions.join('；') }}</text>
        </view>

        <view class="shield-note">
          <image src="/static/icons/ic_shield.png" class="shield-icon" />
          <text class="shield-text">本摘要整理已有信息，保留时间来源与未核实项，不含诊断结论。</text>
        </view>
      </view>

      <view class="export-actions">
        <button class="export-btn primary" @click="exportPdf">
          <image src="/static/icons/ic_doc.png" class="export-icon" />
          导出 PDF
        </button>
        <button class="export-btn" @click="copyText">
          <image src="/static/icons/ic_image.png" class="export-icon" />
          生成图片
        </button>
        <button class="export-btn" @click="copyText">
          <image src="/static/icons/ic_share.png" class="export-icon" />
          复制文本
        </button>
      </view>

      <view class="info-alert">
        <image src="/static/icons/ic_info.png" class="alert-icon" />
        <text class="alert-text">导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。</text>
      </view>
    </block>

    <block v-else-if="activeTab === 'questions'">
      <view class="card question-card" v-for="(q, i) in questions" :key="i">
        <text class="question-num">{{ i + 1 }}</text>
        <text class="question-text">{{ q }}</text>
      </view>
    </block>

    <block v-else>
      <view class="card">
        <text class="card-title">就诊时可以带上</text>
        <view class="bring-item" v-for="(item, i) in bringItems" :key="i">
          <text class="bring-check">✓</text>
          <text class="bring-text">{{ item }}</text>
        </view>
      </view>
    </block>

    <MainTabBar active-tab="followup" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainTabBar from '../../components/MainTabBar.vue';
import { api } from '../../api/request';
import { parseChangeText, buildChiefText } from '../../utils/chief';

const tabs = [
  { key: 'summary', label: '一页交接摘要' },
  { key: 'questions', label: '问题清单' },
  { key: 'bring', label: '带什么' },
];

const activeTab = ref<'summary' | 'questions' | 'bring'>('summary');
const sections = ref<any>({});
const generatedAt = ref('');
const unknown = ref<string[]>([]);
const episode = ref<any>({});

const symptomCount = computed(() => sections.value.symptomsAndChanges?.recentLogs?.length ?? 0);
const changeRaw = ref<string | null>(null);
const lastLog = ref<any>(null);

const chiefData = computed(() => ({
  episode: episode.value || null,
  change: parseChangeText(changeRaw.value),
  lastLog: lastLog.value,
  analysisUnknown: unknown.value,
}));

const chiefText = computed(() => buildChiefText(chiefData.value));

const onsetConfirmed = computed(() => {
  const answer = chiefData.value?.change?.onset;
  return !!answer && answer !== '尚未确认' && !answer.includes('约') && !answer.includes('记不清');
});

const chiefOnset = computed(() => {
  const answer = chiefData.value?.change?.onset;
  if (answer && answer !== '尚未确认') return answer;
  return sections.value.chiefComplaint?.onsetDate || '尚未确认';
});

const onsetText = computed(() => {
  // 优先取用户在"变化确认"中的回答，避免与"主要症状"段落出现两个日期
  const answer = chiefData.value?.change?.onset;
  if (answer && answer !== '尚未确认') return `${answer} 开始腰痛（自述）。`;
  const onset = sections.value.chiefComplaint?.onsetDate;
  return onset ? `${onset} 开始腰痛（具体日期以记录为准）。` : '症状开始时间尚未确认。可在"当前情况-生成分析"中回答后自动记录。';
});

const actionsText = computed(() => {
  const logs = sections.value.symptomsAndChanges?.recentLogs || [];
  if (logs.length === 0) return '已采取的行动尚未记录。可在"病程-记录今天"中补充。';
  return `最近记录：坐姿约 ${logs[0].sitMinutes ?? '尚未确认'} 分钟；${logs[0].topWorry ? '担心：' + logs[0].topWorry : '未记录担心的事'}。`;
});


const questions = computed(() => {
  const qs: string[] = [...(sections.value.questionsForDoctor?.questions || [])];
  qs.push(...unknown.value);
  return qs;
});

const latestReportDate = ref('');

const bringItems = computed(() => {
  const items: string[] = [];
  if (latestReportDate.value) {
    items.push(`已录入的检查报告原文（${latestReportDate.value}）`);
  }
  items.push('症状开始时间与最近变化记录');
  if ((sections.value.diagnosisAndAssessment?.doctorRecords || []).length > 0) {
    items.push('正在使用的药物与既有医嘱');
  }
  return items;
});

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

function buildText(): string {
  return [
    '复诊交接摘要',
    `生成于 ${formatDate(generatedAt.value)} · 由用户自述与报告原文整理 · 未经医生核实`,
    '',
    `【本次发作起点】${chiefOnset.value}`,
    `【主要症状与变化】${chiefText.value}`,
    `【相关检查原文】${(sections.value.examinationFindings?.reports || []).map((r: any) => `[${r.date}] ${r.text}`).join('\n')}`,
    `【想问医生的问题】${questions.value.join('；')}`,
  ].join('\n');
}

function copyText() {
  uni.setClipboardData({
    data: buildText(),
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' }),
  });
}

function exportPdf() {
  api.exportFollowup('', 'pdf').catch(() => undefined);
  uni.showModal({
    title: '导出 PDF',
    content: '请在浏览器中使用打印功能保存为 PDF',
    showCancel: false,
  });
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    episode.value = episodes[0] || {};
    const episodeId = episodes[0]?.id;
    if (!episodeId) return;
    const data = await api.previewFollowup(episodeId);
    sections.value = data.sections || {};
    generatedAt.value = data.generatedAt || '';
    const reports = await api.getReportsByEpisode(episodeId);
    latestReportDate.value = reports?.[0]?.report_date || '';
    const latest = await api.getLatestAnalysis(episodeId);
    if (latest.status === 'ok') unknown.value = latest.sections.unknown || [];
    const events = await api.getTimeline(episodeId);
    const changeEvent = (events || []).find((e: any) => e.event_type === '变化确认');
    changeRaw.value = changeEvent?.raw_text || null;
    const logEvent = (events || []).filter((e: any) => e.event_type === '症状').sort((a: any, b: any) => (b.occurred_at || '').localeCompare(a.occurred_at || ''))[0];
    lastLog.value = logEvent ? { sitMinutes: logEvent.sit_minutes ?? null, topWorry: logEvent.top_worry ?? null, legChange: logEvent.leg_change ?? null } : null;
  } catch (e) {
    console.error('Failed to load followup:', e);
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
  padding: 32rpx 0 24rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-1);
}

.action-icon {
  width: 36rpx;
  height: 36rpx;
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

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.summary-card {
  padding: 36rpx;
}

.summary-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-1);
  display: block;
}

.summary-meta {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-top: 8rpx;
}

.divider {
  height: 2rpx;
  background: var(--border);
  margin: 24rpx 0;
}

.section-block {
  margin-bottom: 28rpx;
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.block-title {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
}

.link-text-sm {
  font-size: 22rpx;
  color: var(--primary);
}

.block-text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--text-1);
  display: block;
  margin-bottom: 12rpx;
}

.tag-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
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
  background: #E5F6EE;
  color: var(--ok);
}

.tag-warn {
  background: rgba(199, 119, 0, 0.1);
  color: var(--warn);
}

.tag-info {
  background: rgba(47, 111, 216, 0.08);
  color: var(--info);
}

.tag-error {
  background: rgba(217, 59, 59, 0.08);
  color: var(--error);
}

.shield-note {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--primary-light);
  border-radius: 16rpx;
  padding: 24rpx;
}

.shield-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.shield-text {
  font-size: 24rpx;
  color: var(--primary);
  line-height: 1.5;
  flex: 1;
}

.export-actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.export-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  background: var(--surface);
  border: 2rpx solid var(--border);
  border-radius: 16rpx;
  font-size: 26rpx;
  color: var(--text-1);
}

.export-btn.primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.export-btn.primary .export-icon {
  filter: brightness(0) invert(1);
}

.export-icon {
  width: 32rpx;
  height: 32rpx;
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

.question-card {
  display: flex;
  align-items: baseline;
  gap: 20rpx;
  padding: 24rpx 28rpx;
}

.question-num {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-1);
}

.question-text {
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-1);
  flex: 1;
}

.card-title {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 20rpx;
}

.bring-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.bring-check {
  color: var(--ok);
  font-size: 24rpx;
  font-weight: 600;
}

.bring-text {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.5;
  flex: 1;
}
</style>
