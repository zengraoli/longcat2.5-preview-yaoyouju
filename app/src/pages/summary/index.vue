<template>
  <view class="summary">
    <view class="summary__header">
      <text class="summary__title">复诊准备</text>
      <text class="summary__share" @click="onShare">↑</text>
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

      <view v-for="section in sections" :key="section.key" class="summary__section">
        <view class="summary__section-header">
          <text class="summary__section-title">{{ section.title }}</text>
          <text class="summary__correct" @click="onCorrect(section.key)">✎ 纠正</text>
        </view>
        <view v-for="(item, i) in section.items" :key="i" class="summary__section-item">
          <text class="summary__section-text">{{ item.text }}</text>
          <view class="summary__tags">
            <StatusTag v-if="item.source" :label="item.source" />
            <StatusTag v-if="item.mark" :label="item.mark" />
          </view>
        </view>
        <text v-if="section.items.length === 0" class="summary__section-empty">尚未确认</text>
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
      <text v-if="questions.length === 0" class="summary__section-empty">暂无复诊问题，可在“问与解释”中加入</text>
    </view>

    <!-- 带什么 -->
    <view v-else class="card">
      <text class="card-title">带什么</text>
      <view class="summary__bring">
        <text class="summary__bring-icon">✓</text>
        <text class="summary__bring-text">已录入的检查报告原文</text>
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
      <AppButton type="secondary" @click="onExport('文本')">⧉ 复制文本</AppButton>
    </view>

    <TipBar type="info">
      导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。
    </TipBar>

    <!-- 纠正弹层 -->
    <view v-if="correcting" class="mask" @click="correcting = ''">
      <view class="dialog" @click.stop>
        <text class="dialog__title">纠正「{{ correcting }}」</text>
        <textarea
          v-model="correctText"
          class="dialog__textarea"
          placeholder="输入修正后的内容"
          placeholder-class="dialog__placeholder"
          :maxlength="2000"
        />
        <AppButton block @click="onSaveCorrect">保存</AppButton>
        <text class="dialog__cancel" @click="correcting = ''">取消</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, previewSummary, saveSummary, exportSummary, type SummaryContent } from '@/api';

const today = new Date().toISOString().slice(0, 10);
const tabs = [
  { key: 'summary', label: '一页交接摘要' },
  { key: 'questions', label: '问题清单' },
  { key: 'bring', label: '带什么' },
];
const activeTab = ref('summary');
const content = ref<SummaryContent | null>(null);
const summaryId = ref('');
const correcting = ref('');
const correctText = ref('');

const questions = computed(() => content.value?.复诊问题 ?? []);

interface SectionItem {
  text: string;
  source?: string;
  mark?: string;
}

const sections = computed(() => {
  if (!content.value) return [];
  const toItems = (arr: Array<{ text: string; source?: string; mark?: string }>): SectionItem[] =>
    (Array.isArray(arr) ? arr : []).filter((i) => i && typeof i.text === 'string') as SectionItem[];
  return [
    { key: '当前情况', title: '当前情况', items: toItems(content.value.当前情况) },
    { key: '报告要点', title: '相关检查原文', items: toItems(content.value.报告要点) },
    { key: '医嘱要点', title: '已经接受的专业建议', items: toItems(content.value.医嘱要点) },
    { key: '尚未确认', title: '尚未确认', items: toItems(content.value.尚未确认) },
    { key: '下一步', title: '下一步', items: toItems(content.value.下一步) },
  ];
});

async function load() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) return;
    const preview = await previewSummary(episodes[0].id);
    content.value = preview;
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function onShare() {
  onExport('文本');
}

/** 转义 HTML，避免摘要文本在打印弹窗中造成 XSS */
function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function onExport(format: '文本' | 'PDF' | '图片') {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) {
      uni.showToast({ title: '请先建立病程', icon: 'none' });
      return;
    }
    if (!content.value) {
      uni.showToast({ title: '请先生成摘要', icon: 'none' });
      return;
    }
    const saved = await saveSummary(episodes[0].id, content.value);
    summaryId.value = saved.id;
    const result = await exportSummary(saved.id, format);
    if (format === '文本') {
      uni.setClipboardData({
        data: result.text,
        success: () => uni.showToast({ title: '已复制文本', icon: 'success' }),
        fail: () => uni.showToast({ title: '复制失败', icon: 'none' }),
      });
    } else {
      // PDF 通过浏览器打印生成（H5 打开打印窗口）
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<html><head><title>复诊交接摘要</title></head><body><pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(result.text)}</pre></body></html>`);
        win.document.close();
        win.print();
      } else {
        uni.showModal({
          title: '导出 PDF',
          content: '请允许弹出窗口以打印 PDF。',
          showCancel: false,
        });
      }
    }
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function onCorrect(key: string) {
  correcting.value = key;
  const section = content.value?.[key as keyof SummaryContent];
  if (Array.isArray(section) && section.length > 0 && typeof section[0] === 'object') {
    correctText.value = (section[0] as { text: string }).text;
  } else {
    correctText.value = '';
  }
}

async function onSaveCorrect() {
  if (!content.value || !correcting.value) return;
  const key = correcting.value as keyof SummaryContent;
  const section = content.value[key];
  if (Array.isArray(section) && section.length > 0 && typeof section[0] === 'object') {
    (section[0] as { text: string }).text = correctText.value;
  }
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const saved = await saveSummary(episodes[0].id, content.value);
      summaryId.value = saved.id;
    }
    correcting.value = '';
    uni.showToast({ title: '已保存', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

onMounted(load);
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
.summary__section-item {
  margin-bottom: 8px;
}
.summary__section-text {
  font-size: 14px;
  line-height: 1.6;
  display: block;
  margin-bottom: 4px;
}
.summary__section-empty {
  font-size: 13px;
  color: var(--text-3);
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
.dialog__textarea {
  width: 100%;
  min-height: 100px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.dialog__placeholder { color: var(--text-3); }
.dialog__cancel {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 12px;
  min-height: 44px;
  line-height: 44px;
}
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
}
</style>
