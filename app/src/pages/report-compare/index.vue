<template>
  <view class="compare">
    <view class="compare__header">
      <text class="compare__back" @click="goBack">‹</text>
      <text class="compare__title">原文对照</text>
    </view>

    <!-- 查看方式 -->
    <view class="compare__tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="compare__tab"
        :class="{ 'compare__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 解释卡片（来自最新分析） -->
    <view v-if="activeTab === 'byExplanation'" class="compare__explanation">
      <text class="compare__explanation-label">解释 {{ currentIndex + 1 }} / {{ explanations.length }}</text>
      <text class="compare__explanation-pos" v-if="currentExplanation">
        来源：{{ evidenceTitle(currentExplanation.source) }}
      </text>
      <text class="compare__explanation-text">{{ currentExplanation?.text }}</text>
      <view class="compare__explanation-nav">
        <AppButton type="secondary" block @click="prevExplanation">‹ 上一条</AppButton>
        <AppButton type="secondary" block @click="nextExplanation">下一条 ›</AppButton>
      </view>
    </view>

    <!-- 报告原文 -->
    <view class="card">
      <view class="compare__report-title">
        <text class="compare__report-name">📄 报告原文{{ reportDate ? ' · ' + reportDate : '' }}</text>
        <StatusTag label="未修改" />
      </view>
      <text class="compare__raw">{{ rawText || '暂无报告原文' }}</text>
      <view class="compare__legend">
        <text class="compare__legend-item">
          <text class="compare__legend-dot compare__legend-dot--ok" />解释引用的来源
        </text>
        <text class="compare__legend-item" v-if="sideConflict">
          <text class="compare__legend-dot compare__legend-dot--warn" />与你描述侧别不一致，需确认
        </text>
      </view>
    </view>

    <!-- 本段涉及的术语 -->
    <view class="card" v-if="activeTab === 'byTerm'">
      <text class="card-title">本段涉及的术语</text>
      <view v-for="(term, i) in terms" :key="i" class="compare__term">
        <text class="compare__term-name">{{ term.name }}</text>
        <text class="compare__term-def">{{ term.def }}</text>
      </view>
      <text v-if="terms.length === 0" class="compare__empty">报告中未识别到术语</text>
    </view>

    <TipBar type="warn">
      报告中没有描述的内容（例如是否存在神经根水肿）不会被写成“已排除”，而会标为“报告未提及”。
    </TipBar>

    <AppButton type="secondary" block @click="goBack">返回一页分析</AppButton>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, getLatestAnalysis, timeline } from '@/api';
import type { AnalysisResult } from '@/api';

const tabs = [
  { key: 'byExplanation', label: '按解释查看' },
  { key: 'byTerm', label: '按术语查看' },
];
const activeTab = ref('byExplanation');
const analysis = ref<AnalysisResult | null>(null);
const rawText = ref('');
const reportDate = ref('');
const currentIndex = ref(0);
const sideConflict = ref(false);

function extractSide(text: string): string | null {
  if (/双侧|两边/.test(text)) return '双侧';
  if (/左侧|左边/.test(text)) return '左侧';
  if (/右侧|右边/.test(text)) return '右侧';
  return null;
}

const explanations = computed(() => analysis.value?.sections.解释 ?? []);
const currentExplanation = computed(() => explanations.value[currentIndex.value] ?? null);

const terms = computed(() => {
  if (!rawText.value) return [];
  const termDefs: Array<{ name: string; def: string }> = [
    { name: 'L5/S1', def: '第 5 腰椎与第 1 骶椎之间的椎间盘' },
    { name: 'L4/5', def: '第 4 腰椎与第 5 腰椎之间的椎间盘' },
    { name: '硬膜囊受压', def: '突出物与神经外膜结构的位置关系（影像描述）' },
    { name: '神经根受压', def: '神经根受压迫的可能（需结合查体）' },
    { name: '椎间盘突出', def: '椎间盘内容物超出椎体边缘的影像描述' },
    { name: '椎间盘膨出', def: '椎间盘外层完整、整体超出椎体边缘的影像描述' },
  ];
  return termDefs.filter((t) => rawText.value.includes(t.name));
});

function evidenceTitle(source: string | null) {
  if (!source) return '系统生成';
  const citation = analysis.value?.citations.find((c) => c.evidenceDocId === source);
  if (citation?.evidenceDocTitle) return citation.evidenceDocTitle;
  return '证据库';
}

function prevExplanation() {
  if (currentIndex.value > 0) currentIndex.value -= 1;
}
function nextExplanation() {
  if (currentIndex.value < explanations.value.length - 1) currentIndex.value += 1;
}

function goBack() {
  uni.navigateBack();
}

onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) return;
    const latest = await getLatestAnalysis(episodes[0].id);
    analysis.value = latest;
    // 加载报告原文（用于原文对照）
    const tl = await timeline(episodes[0].id);
    const reportEvent = [...tl.events].reverse().find((e) => e.eventType === '报告' && e.rawText);
    if (reportEvent) {
      rawText.value = reportEvent.rawText ?? '';
      reportDate.value = reportEvent.occurredAt.slice(0, 10);
    }
    // 仅当报告与自述侧别确实不一致时才提示
    const reportSide = extractSide(rawText.value);
    const selfText = tl.events
      .filter((e) => e.sourceType === '自述' && e.rawText)
      .map((e) => e.rawText)
      .join('，');
    const selfSide = extractSide(selfText);
    sideConflict.value = !!(reportSide && selfSide && reportSide !== selfSide && reportSide !== '双侧' && selfSide !== '双侧');
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.compare {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.compare__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.compare__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.compare__title {
  font-size: 17px;
  font-weight: 500;
}
.compare__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.compare__tab {
  flex: 1;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 14px;
  color: var(--text-2);
}
.compare__tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.compare__explanation {
  background: var(--primary-light);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.compare__explanation-label {
  font-size: 13px;
  color: var(--primary);
  font-weight: 500;
}
.compare__explanation-pos {
  font-size: 12px;
  color: var(--text-2);
  margin-left: 8px;
}
.compare__explanation-text {
  font-size: 14px;
  color: var(--text-1);
  line-height: 1.6;
  display: block;
  margin-top: 8px;
}
.compare__explanation-nav {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.compare__report-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.compare__report-name {
  font-size: 15px;
  font-weight: 500;
}
.compare__raw {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-1);
  display: block;
  white-space: pre-line;
}
.compare__legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.compare__legend-item {
  font-size: 12px;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 4px;
}
.compare__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.compare__legend-dot--ok { background: var(--ok); }
.compare__legend-dot--warn { background: var(--warn); }
.compare__term {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.compare__term-name {
  font-size: 14px;
  color: var(--primary);
  width: 72px;
  flex-shrink: 0;
}
.compare__term-def {
  font-size: 14px;
  color: var(--text-1);
  flex: 1;
  line-height: 1.5;
}
.compare__empty {
  font-size: 13px;
  color: var(--text-3);
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
  display: block;
  margin-bottom: 12px;
}
</style>
