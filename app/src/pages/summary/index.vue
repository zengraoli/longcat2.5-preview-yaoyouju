<template>
  <view class="summary">
    <view class="summary__header">
      <text class="summary__title">复诊准备</text>
      <text class="summary__share">↑</text>
    </view>

    <!-- 页签 -->
    <view class="summary__tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="summary__tab"
        :class="{ 'summary__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 一页交接摘要 -->
    <view v-if="activeTab === 'summary'" class="card">
      <text class="summary__doc-title">复诊交接摘要</text>
      <text class="summary__doc-meta">生成于 {{ today }} · 由用户自述与报告原文整理 · 未经医生核实</text>

      <view class="summary__section">
        <view class="summary__section-header">
          <text class="summary__section-title">本次发作起点</text>
          <text class="summary__correct">✎ 纠正</text>
        </view>
        <text class="summary__section-text">约 2026 年 8 月中旬开始腰痛，具体日期不确定；起初以久坐后酸痛为主。</text>
        <view class="summary__tags">
          <StatusTag label="自述" />
          <StatusTag label="日期尚未确认" />
        </view>
      </view>

      <view class="summary__section">
        <view class="summary__section-header">
          <text class="summary__section-title">主要症状与变化</text>
          <text class="summary__correct">✎ 纠正</text>
        </view>
        <text class="summary__section-text">
          目前腰痛持续约 1 个月，最近 1 周加重；主要在左侧；能坐约 30 分钟；夜间痛醒 1 次/晚。是否有腿部无力：尚未确认。无大小便或鞍区异常。
        </text>
        <view class="summary__tags">
          <StatusTag label="自述 · 12 条记录" />
          <StatusTag label="腿部无力：尚未确认" />
        </view>
      </view>

      <view class="summary__section">
        <view class="summary__section-header">
          <text class="summary__section-title">相关检查原文</text>
          <text class="summary__correct">✎ 纠正</text>
        </view>
        <text class="summary__section-text">
          2026-08-30 腰椎 MRI：“L5/S1 椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。”
        </text>
        <view class="summary__tags">
          <StatusTag label="报告原文" />
          <StatusTag label="与自述侧别不一致" />
        </view>
      </view>

      <view class="summary__section">
        <view class="summary__section-header">
          <text class="summary__section-title">已经接受的专业建议</text>
          <text class="summary__correct">✎ 纠正</text>
        </view>
        <text class="summary__section-text">保守治疗，4 周后复查（2026-09-10 就诊时医生口头建议）。</text>
        <view class="summary__tags">
          <StatusTag label="自述转述" />
          <StatusTag label="未经核实" />
        </view>
      </view>

      <view class="summary__section">
        <view class="summary__section-header">
          <text class="summary__section-title">已采取的行动</text>
          <text class="summary__correct">✎ 纠正</text>
        </view>
        <text class="summary__section-text">每日步行约 20 分钟、热敷；避免久坐；未使用药物。</text>
        <view class="summary__tags">
          <StatusTag label="自述" />
        </view>
      </view>

      <view class="summary__section">
        <view class="summary__section-header">
          <text class="summary__section-title">最希望解决的问题</text>
          <text class="summary__correct">✎ 纠正</text>
        </view>
        <text class="summary__section-text">
          ① 报告的右侧神经根受压与我左侧疼痛是否有关？② 保守治疗期间哪些变化要提前复诊？③ 目前活动、久坐和睡姿要怎么调整？④ 手术必要性如何评估？
        </text>
      </view>

      <view class="summary__note">
        🛡 本摘要整理已有信息，保留时间来源与未核实项，不含诊断结论。
      </view>
    </view>

    <!-- 问题清单 -->
    <view v-else-if="activeTab === 'questions'" class="card">
      <text class="card-title">问题清单（{{ questions.length }}）</text>
      <view v-for="(q, i) in questions" :key="i" class="summary__question">
        <text class="summary__question-num">{{ i + 1 }}</text>
        <text class="summary__question-text">{{ q }}</text>
      </view>
    </view>

    <!-- 带什么 -->
    <view v-else class="card">
      <text class="card-title">带什么</text>
      <view class="summary__bring">
        <text class="summary__bring-icon">✓</text>
        <text class="summary__bring-text">已录入的检查报告原文（2026-08-30 腰椎MRI）</text>
      </view>
      <view class="summary__bring">
        <text class="summary__bring-icon">✓</text>
        <text class="summary__bring-text">症状开始时间与最近变化记录</text>
      </view>
      <view class="summary__bring">
        <text class="summary__bring-icon">✓</text>
        <text class="summary__bring-text">正在使用的药物与既有医嘱</text>
      </view>
    </view>

    <!-- 导出 -->
    <view class="summary__export">
      <AppButton type="primary" @click="onExport('PDF')">📄 导出 PDF</AppButton>
      <AppButton type="secondary" @click="onExport('图片')">🖼 生成图片</AppButton>
      <AppButton type="secondary" @click="onExport('文本')">⧉ 复制文本</AppButton>
    </view>

    <TipBar type="info">
      导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。
    </TipBar>

  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, previewSummary, exportSummary, saveSummary } from '@/api';

const today = new Date().toISOString().slice(0, 10);
const tabs = [
  { key: 'summary', label: '一页交接摘要' },
  { key: 'questions', label: '问题清单 (4)' },
  { key: 'bring', label: '带什么' },
];
const activeTab = ref('summary');
const questions = ref([
  '报告的右侧神经根受压与我左侧疼痛是否有关？',
  '保守治疗期间哪些变化要提前复诊？',
  '目前活动、久坐和睡姿要怎么调整？',
  '手术必要性如何评估？',
]);


async function onExport(format: '文本' | 'PDF' | '图片') {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) return;
    const content = await previewSummary(episodes[0].id);
    const saved = await saveSummary(episodes[0].id, content);
    const result = await exportSummary(saved.id, format);
    if (format === '文本') {
      uni.setClipboardData({ data: result.text });
    }
    uni.showToast({ title: format === '文本' ? '已复制文本' : `已导出${format}（演示）`, icon: 'success' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      await previewSummary(episodes[0].id);
    }
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.summary {
  min-height: 100vh;
  padding: 16px 16px 100px;
}
.summary__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.summary__title {
  font-size: 17px;
  font-weight: 500;
}
.summary__share { font-size: 20px; color: var(--text-2); }
.summary__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.summary__tab {
  flex: 1;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-2);
}
.summary__tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.summary__doc-title {
  font-size: 16px;
  font-weight: 500;
  display: block;
}
.summary__doc-meta {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin: 4px 0 16px;
  line-height: 1.5;
}
.summary__section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.summary__section:last-of-type {
  border-bottom: none;
}
.summary__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.summary__section-title {
  font-size: 15px;
  font-weight: 500;
}
.summary__correct {
  font-size: 13px;
  color: var(--primary);
}
.summary__section-text {
  font-size: 14px;
  line-height: 1.6;
  display: block;
  margin-bottom: 8px;
}
.summary__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.summary__note {
  background: var(--primary-light);
  border-radius: 10px;
  padding: 12px;
  font-size: 12px;
  color: var(--primary);
  line-height: 1.5;
  margin-top: 8px;
}
.summary__question {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.summary__question-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.summary__question-text {
  font-size: 14px;
  flex: 1;
  line-height: 1.5;
}
.summary__bring {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.summary__bring-icon { color: var(--ok); }
.summary__bring-text { font-size: 14px; flex: 1; }
.summary__export {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
</style>
