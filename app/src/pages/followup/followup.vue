<template>
  <view class="page">
    <view class="header">
      <text class="page-title">复诊摘要</text>
      <text class="page-subtitle">预览并导出您的复诊摘要</text>
    </view>

    <view class="section-card" v-for="(section, key) in sections" :key="key">
      <text class="section-title">{{ section.title }}</text>
      <view class="section-body">
        <template v-if="key === 'chiefComplaint'">
          <text class="info-line">发病日期: {{ section.onsetDate || '尚未确认' }}</text>
          <text class="info-line" v-for="(item, idx) in section.selfReported" :key="idx">
            - {{ item }}
          </text>
        </template>

        <template v-else-if="key === 'examinationFindings'">
          <view class="report-item" v-for="(r, idx) in section.reports" :key="idx">
            <text class="report-date">[{{ r.date }}]</text>
            <text class="report-text">{{ r.text }}</text>
            <StatusTag type="warn" label="尚未确认" />
          </view>
          <text class="empty-hint" v-if="!section.reports || section.reports.length === 0">暂无检查报告</text>
        </template>

        <template v-else-if="key === 'diagnosisAndAssessment'">
          <view class="report-item" v-for="(r, idx) in section.doctorRecords" :key="idx">
            <text class="report-text">{{ r.text }}</text>
            <StatusTag :type="r.verifyStatus === '已确认' ? 'ok' : 'warn'" :label="r.verifyStatus" />
          </view>
          <text class="info-line">分析已知: {{ section.latestAnalysis }}</text>
        </template>

        <template v-else-if="key === 'symptomsAndChanges'">
          <view class="log-item" v-for="(log, idx) in section.recentLogs" :key="idx">
            <text class="log-line">坐{{ log.sitMinutes }}</text>
            <text class="log-line">担心: {{ log.topWorry }}</text>
            <text class="log-line">腿部: {{ log.legChange }}</text>
          </view>
          <text class="empty-hint" v-if="!section.recentLogs || section.recentLogs.length === 0">近7天暂无记录</text>
        </template>

        <template v-else-if="key === 'concerns'">
          <text class="info-line" v-for="(item, idx) in section.topWorries" :key="idx">
            - {{ item }}
          </text>
          <text class="empty-hint" v-if="!section.topWorries || section.topWorries.length === 0">暂无记录</text>
        </template>

        <template v-else-if="key === 'questionsForDoctor'">
          <view class="question-item" v-for="(q, idx) in section.questions" :key="idx">
            <text class="q-num">{{ idx + 1 }}</text>
            <text class="q-text">{{ q }}</text>
          </view>
        </template>
      </view>
    </view>

    <view class="action-bar">
      <button class="sub-btn" @click="exportText">复制文本</button>
      <button class="primary-btn" @click="exportPdf">导出 PDF</button>
    </view>
      <MainTabBar active-tab="followup" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';
import { api } from '../../api/request';
import MainTabBar from '../../components/MainTabBar.vue';

const sections = ref<any>({});

function buildText(): string {
  let text = '=== 复诊摘要 ===\n\n';
  for (const [key, section] of Object.entries(sections.value)) {
    const s = section as any;
    text += `【${s.title}】\n`;
    if (s.selfReported) s.selfReported.forEach((t: string) => { text += `- ${t}\n`; });
    if (s.onsetDate) text += `发病日期: ${s.onsetDate}\n`;
    if (s.reports) s.reports.forEach((r: any) => { text += `[${r.date}] ${r.text} (${r.verifyStatus})\n`; });
    if (s.doctorRecords) s.doctorRecords.forEach((r: any) => { text += `- ${r.text} (${r.verifyStatus})\n`; });
    if (s.latestAnalysis) text += `分析已知: ${s.latestAnalysis}\n`;
    if (s.recentLogs) s.recentLogs.forEach((l: any) => { text += `坐${l.sitMinutes}, 担心:${l.topWorry}, 腿部:${l.legChange}\n`; });
    if (s.topWorries) s.topWorries.forEach((t: string) => { text += `- ${t}\n`; });
    if (s.questions) s.questions.forEach((q: string) => { text += `- ${q}\n`; });
    text += '\n';
  }
  return text;
}

function exportText() {
  uni.setClipboardData({
    data: buildText(),
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' }),
  });
}

function exportPdf() {
  uni.showModal({
    title: '导出 PDF',
    content: '请在浏览器中使用打印功能保存为 PDF',
    showCancel: false,
  });
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) return;
    const episodeId = episodes[0].id;
    const data = await api.previewFollowup(episodeId);
    sections.value = data.sections || {};
  } catch (e) {
    console.error('Failed to load followup:', e);
  }
});
</script>

<style lang="scss" scoped>
.page { padding-bottom: 160rpx;
  min-height: 100vh;
  background: var(--bg);
  padding: 32rpx;
}

.header {
  margin-bottom: 32rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-1);
  display: block;
}

.page-subtitle {
  font-size: 24rpx;
  color: var(--text-2);
  margin-top: 12rpx;
  display: block;
}

.section-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
  margin-bottom: 20rpx;
  display: block;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid var(--border);
}

.report-item {
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid var(--border);

  &:last-child {
    border-bottom: none;
  }
}

.report-date {
  font-size: 22rpx;
  color: var(--text-3);
  margin-right: 12rpx;
}

.report-text {
  font-size: 26rpx;
  color: var(--text-1);
}

.info-line {
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  display: block;
}

.log-item {
  padding: 16rpx;
  background: var(--bg);
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}

.log-line {
  font-size: 24rpx;
  color: var(--text-2);
  display: block;
}

.question-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.q-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.q-text {
  font-size: 26rpx;
  color: var(--text-1);
  flex: 1;
}

.empty-hint {
  font-size: 24rpx;
  color: var(--text-3);
}

.action-bar {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.sub-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--surface);
  color: var(--text-1);
  font-size: 28rpx;
  border-radius: 20rpx;
  border: 2rpx solid var(--border);
}

.primary-btn {
  flex: 2;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--primary);
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;
}
</style>
