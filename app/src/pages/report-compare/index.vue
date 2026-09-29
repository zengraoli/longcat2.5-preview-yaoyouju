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

    <!-- 解释卡片 -->
    <view class="compare__explanation">
      <text class="compare__explanation-label">解释 ②-2</text>
      <text class="compare__explanation-pos">对应原文：第 2 行</text>
      <text class="compare__explanation-text">
        “硬膜囊受压”描述影像上突出物与神经外膜结构的位置关系，是影像描述，不等于症状严重程度。
      </text>
    </view>

    <!-- 报告原文 -->
    <view class="card">
      <view class="compare__report-title">
        <text class="compare__report-name">📄 报告原文 · 2026-08-30 · 腰椎MRI</text>
        <StatusTag label="未修改" />
      </view>
      <text class="compare__raw">
        检查所见：腰椎生理曲度存在，各椎体形态、信号未见明显异常。\nL4/5椎间盘轻度膨出。\n<text class="compare__highlight">L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。</text>\n椎管未见明显狭窄。\n印象：L5/S1椎间盘突出；L4/5椎间盘膨出。
      </text>
      <view class="compare__legend">
        <text class="compare__legend-item">
          <text class="compare__legend-dot compare__legend-dot--ok" />本条解释引用
        </text>
        <text class="compare__legend-item">
          <text class="compare__legend-dot compare__legend-dot--warn" />与你描述侧别不一致，需确认
        </text>
      </view>
    </view>

    <!-- 本段涉及的术语 -->
    <view class="card">
      <text class="card-title">本段涉及的术语</text>
      <view v-for="(term, i) in terms" :key="i" class="compare__term">
        <text class="compare__term-name">{{ term.name }}</text>
        <text class="compare__term-def">{{ term.def }}</text>
      </view>
    </view>

    <TipBar type="warn">
      报告中没有描述的内容（例如是否存在神经根水肿）不会被写成“已排除”，而会标为“报告未提及”。
    </TipBar>

    <AppButton type="secondary" block @click="goBack">返回一页分析</AppButton>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';

const tabs = [
  { key: 'byExplanation', label: '按解释查看' },
  { key: 'byTerm', label: '按术语查看' },
];
const activeTab = ref('byExplanation');
const terms = [
  { name: '硬膜囊', def: '包裹脊髓和神经根的膜性结构在影像上的名称。' },
  { name: '神经根', def: '从脊髓分出、经椎间孔走行的神经起始段。' },
  { name: '椎间盘突出', def: '椎间盘内容物超出椎体边缘的影像描述，程度与症状不一定对应。' },
];

function goBack() {
  uni.navigateBack();
}
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
}
.compare__highlight {
  color: var(--warn);
  background: rgba(199, 119, 0, 0.1);
}
.compare__legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
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
</style>
