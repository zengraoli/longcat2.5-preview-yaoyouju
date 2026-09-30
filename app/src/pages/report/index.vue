<template>
  <view class="report">
    <view class="report__header">
      <text class="report__back" @click="goBack">‹</text>
      <text class="report__title">录入报告与医嘱（可选）</text>
      <text class="report__step">第 3 / 4 步</text>
    </view>

    <!-- 录入方式 -->
    <view class="report__tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="report__tab"
        :class="{ 'report__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 粘贴文字 -->
    <view v-if="activeTab === 'paste'" class="card">
      <view class="report__card-title">
        <text class="card-title">检查报告原文</text>
        <StatusTag label="报告原文" />
      </view>
      <textarea
        v-model="reportText"
        class="report__textarea"
        placeholder="腰椎MRI平扫：L4/5椎间盘轻度膨出；L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能…（示例文本，仅用于演示）"
        placeholder-class="report__placeholder"
        :maxlength="20000"
      />
      <view class="report__row">
        <view class="report__field">
          <text class="report__label">报告日期</text>
          <picker mode="date" :value="reportDate" @change="onDateChange">
            <view class="report__input">
              <text :class="{ 'report__placeholder-text': !reportDate }">{{ reportDate || '选择日期' }}</text>
              <text class="report__input-icon">📅</text>
            </view>
          </picker>
        </view>
        <view class="report__field">
          <text class="report__label">检查类型</text>
          <picker :range="examTypes" :value="examTypeIndex" @change="onTypeChange">
            <view class="report__input">
              <text>{{ examTypes[examTypeIndex] }}</text>
              <text class="report__input-icon">⌄</text>
            </view>
          </picker>
        </view>
      </view>
      <text class="report__label">检查机构（可选）</text>
      <input
        v-model="hospital"
        class="report__input report__input--text"
        placeholder="如：XX市人民医院"
        placeholder-class="report__placeholder"
      />
    </view>

    <!-- 拍照提取 -->
    <view v-else-if="activeTab === 'ocr'" class="card">
      <text class="card-title">拍照提取（模拟）</text>
      <view class="report__ocr-box" @click="onOcr">
        <text class="report__ocr-icon">📷</text>
        <text class="report__ocr-text">{{ ocrText || '点击拍照，提取报告文字（演示返回示例文本）' }}</text>
      </view>
    </view>

    <!-- 暂不录入 -->
    <view v-else class="card">
      <text class="report__skip-text">暂不录入报告。你可以稍后再录入，也可以直接核对已有信息。</text>
    </view>

    <!-- 既有医嘱 -->
    <view class="card">
      <view class="report__card-title">
        <text class="card-title">医生已经给出的建议（可选）</text>
        <StatusTag label="自述" />
      </view>
      <textarea
        v-model="adviceText"
        class="report__textarea"
        placeholder="如：医生建议先保守治疗，4周后复查；避免久坐和弯腰负重"
        placeholder-class="report__placeholder"
        :maxlength="2000"
      />
      <view class="report__chips">
        <AppChip
          v-for="opt in adviceOptions"
          :key="opt"
          :state="advice.includes(opt) ? 'selected' : 'unselected'"
          @click="toggleAdvice(opt)"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <TipBar type="info">
      原文仅用于对照解释，每个关键解释都可回看原文。本产品不做影像读片诊断，也不会把报告中未描述的内容写成“已排除”。
    </TipBar>

    <AppButton block @click="onNext">下一步：核对信息</AppButton>
    <text class="report__skip" @click="onSkip">跳过，先不录入报告</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, addEvent, createReport, createEpisode } from '@/api';

const tabs = [
  { key: 'paste', label: '粘贴文字（推荐）' },
  { key: 'ocr', label: '拍照提取' },
  { key: 'skip', label: '暂不录入' },
];
const examTypes = ['MRI', 'CT', 'X光', '超声'];
const adviceOptions = ['保守治疗', '复查时间', '用药', '康复建议', '手术评估'];

const activeTab = ref('paste');
const reportText = ref('');
const reportDate = ref('');
const examTypeIndex = ref(0);
const hospital = ref('');
const ocrText = ref('');
const adviceText = ref('');
const advice = ref<string[]>([]);

function onDateChange(e: { detail: { value: string } }) {
  reportDate.value = e.detail.value;
}
function onTypeChange(e: { detail: { value: number } }) {
  examTypeIndex.value = e.detail.value;
}
function toggleAdvice(opt: string) {
  const idx = advice.value.indexOf(opt);
  if (idx >= 0) advice.value.splice(idx, 1);
  else advice.value.push(opt);
}

async function onOcr() {
  // 拍照提取走模拟 OCR：先创建报告事件，再调用 OCR 接口
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) return;
    const event = await addEvent(episodes[0].id, {
      eventType: '报告',
      occurredAt: new Date().toISOString(),
      sourceType: '报告原文',
      rawText: '占位',
    });
    const { api } = await import('@/api');
    const result = await api.post<{ text: string }>('/reports/ocr', { careEventId: event.id });
    ocrText.value = result.text;
    reportText.value = result.text;
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function goBack() {
  uni.navigateBack();
}

async function onNext() {
  try {
    let episodes = await listEpisodes();
    if (episodes.length === 0) {
      // 自动创建病程
      const ep = await createEpisode('腰痛', reportDate.value || undefined, '尚未确认');
      episodes = [{ id: ep.id, title: '腰痛', onsetDate: reportDate.value || null, onsetCertainty: '尚未确认', status: 'active' }];
    }
    const episodeId = episodes[0].id;
    // 录入报告
    if (reportText.value.trim()) {
      const event = await addEvent(episodeId, {
        eventType: '报告',
        occurredAt: new Date().toISOString(),
        sourceType: '报告原文',
        rawText: reportText.value,
      });
      await createReport({
        careEventId: event.id,
        reportDate: reportDate.value || undefined,
        sourceType: '报告原文',
        rawText: reportText.value,
      });
    }
    // 录入医嘱
    if (adviceText.value.trim()) {
      await addEvent(episodeId, {
        eventType: '医嘱',
        occurredAt: new Date().toISOString(),
        sourceType: '自述',
        rawText: adviceText.value,
        verifyStatus: '尚未确认',
      });
    }
    uni.navigateTo({ url: '/pages/verify/index' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

function onSkip() {
  uni.navigateTo({ url: '/pages/verify/index' });
}
</script>

<style scoped>
.report {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.report__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.report__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.report__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.report__step {
  font-size: 12px;
  color: var(--text-3);
}
.report__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.report__tab {
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
.report__tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.report__card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.report__textarea {
  width: 100%; box-sizing: border-box;
  min-height: 120px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.report__placeholder {
  color: var(--text-3);
}
.report__row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.report__field { flex: 1; }
.report__label {
  font-size: 13px;
  color: var(--text-2);
  display: block;
  margin-bottom: 6px;
}
.report__input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
}
.report__input--text { justify-content: flex-start; }
.report__placeholder-text { color: var(--text-3); }
.report__input-icon { color: var(--text-3); font-size: 16px; }
.report__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.report__ocr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  background: var(--bg);
  border: 1px dashed var(--border);
  border-radius: 10px;
  gap: 8px;
}
.report__ocr-icon { font-size: 28px; }
.report__ocr-text {
  font-size: 13px;
  color: var(--text-2);
  text-align: center;
  padding: 0 16px;
}
.report__skip-text {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.6;
}
.report__skip {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 16px;
  min-height: 44px;
  line-height: 44px;
}
</style>
