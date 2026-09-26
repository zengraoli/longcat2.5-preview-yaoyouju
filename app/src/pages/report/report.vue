<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">录入报告与医嘱（可选）</text>
      </view>
      <text class="step-chip">第 3 / 4 步</text>
    </view>

    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: mode === t.key }"
        @click="onTabClick(t.key)"
      >{{ t.label }}</view>
    </view>

    <block v-if="mode === 'paste'">
      <view class="card">
        <view class="card-head">
          <text class="card-title">检查报告原文</text>
          <text class="source-tag tag-info">来源：报告原文</text>
        </view>
        <textarea
          v-model="rawText"
          class="text-area"
          placeholder="请粘贴检查报告或医嘱的文字内容"
          placeholder-class="placeholder"
          :maxlength="5000"
        />

        <view class="form-row">
          <view class="form-col">
            <text class="form-label">报告日期</text>
            <view class="date-row">
              <input class="input" type="text" placeholder="选择日期" :value="reportDate || '选择日期'" readonly @click="openDatePicker" />
              <image src="/static/icons/ic_calendar.png" class="input-icon" @click="openDatePicker" />
            </view>
          </view>
          <view class="form-col">
            <text class="form-label">检查类型</text>
            <picker :range="examTypes" :value="examTypeIndex" @change="onExamTypeChange">
              <view class="picker-val">{{ examTypes[examTypeIndex] }}</view>
            </picker>
          </view>
        </view>

        <view class="form-col">
          <text class="form-label">检查机构（可选）</text>
          <input class="input" v-model="hospital" placeholder="如：XX市人民医院" placeholder-class="placeholder" />
        </view>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="card-title">医生已经给出的建议（可选）</text>
          <text class="source-tag tag-warn">来源：自述</text>
        </view>
        <textarea
          v-model="doctorAdvice"
          class="text-area small"
          placeholder="如：医生建议先保守治疗，4周后复查；避免久坐和弯腰负重"
          placeholder-class="placeholder"
          :maxlength="2000"
        />
        <view class="chip-group">
          <view
            v-for="c in adviceChips"
            :key="c"
            class="chip"
            :class="{ selected: adviceChipSelected === c }"
            @click="adviceChipSelected = adviceChipSelected === c ? '' : c"
          >{{ c }}</view>
        </view>
      </view>
    </block>

    <view class="card" v-else-if="mode === 'ocr'">
      <view class="upload-box" @click="mockOcr">
        <image src="/static/icons/ic_image.png" class="upload-icon" />
        <text class="upload-text">拍照提取（演示为模拟识别）</text>
        <text class="upload-hint">识别结果会进入“粘贴文字”页签，可修改后再保存</text>
      </view>
    </view>

    <view class="card empty-card" v-else>
      <text class="empty-text">暂不录入报告。你可以先核对已有的信息，之后随时在“病程”中补充。</text>
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">原文仅用于对照解释，每个关键解释都可回看原文。本产品不做影像读片诊断，也不会把报告中未描述的内容写成“已排除”。</text>
    </view>

    <view class="footer">
      <button class="primary-btn" :disabled="mode === 'paste' && (!canSubmit || !reportDate)" @click="onNext">
        下一步：核对信息
      </button>
      <text class="link-text" @click="skip">跳过，先不录入报告</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { api } from '../../api/request';

const tabs = [
  { key: 'paste', label: '粘贴文字（推荐）' },
  { key: 'ocr', label: '拍照提取' },
  { key: 'skip', label: '暂不录入' },
];

const mode = ref<'paste' | 'ocr' | 'skip'>('paste');
const rawText = ref('');
const reportDate = ref('');
const hospital = ref('');
const doctorAdvice = ref('');
const adviceChipSelected = ref('');
const examTypes = ['MRI', 'CT', 'X光', '超声', '其他'];
const examTypeIndex = ref(0);

const canSubmit = computed(() => rawText.value.trim().length > 0);

function onTabClick(key: 'paste' | 'ocr' | 'skip') {
  mode.value = key;
}

function openDatePicker() {
  const input = document.createElement('input');
  input.type = 'date';
  input.value = reportDate.value || '';
  input.onchange = () => {
    reportDate.value = input.value || '';
  };
  input.click();
}

function onExamTypeChange(e: any) {
  examTypeIndex.value = e.detail.value;
}

function mockOcr() {
  rawText.value = '腰椎MRI：L4/5椎间盘中央型突出，硬膜囊及双侧神经根受压，椎管轻度狭窄。';
  mode.value = 'paste';
  uni.showToast({ title: '识别成功，已填入原文', icon: 'success' });
}

function goBack() {
  uni.navigateBack();
}

async function submitReport() {
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (!episodeId) {
      uni.showToast({ title: '请先创建病程', icon: 'none' });
      return;
    }
    const sourceType = '报告原文';
    const careEvent = await api.createCareEvent({
      episodeId,
      eventType: '报告',
      occurredAt: new Date(reportDate.value).toISOString(),
      sourceType,
      rawText: rawText.value,
      verifyStatus: '尚未确认',
    });
    await api.createReport({
      careEventId: careEvent.id,
      reportDate: reportDate.value,
      rawText: rawText.value,
      sourceType,
    });
    if (doctorAdvice.value.trim()) {
      await api.createCareEvent({
        episodeId,
        eventType: '医嘱',
        occurredAt: new Date(reportDate.value).toISOString(),
        sourceType: '自述',
        rawText: doctorAdvice.value,
        verifyStatus: '未经核实',
      });
    }
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
    throw e;
  }
}

async function onNext() {
  if (mode.value === 'paste') {
    try {
      await submitReport();
      uni.navigateTo({ url: '/pages/verify/verify' });
    } catch {
      // 错误已在 submitReport 中提示
    }
  } else if (mode.value === 'ocr') {
    uni.navigateTo({ url: '/pages/verify/verify' });
  } else {
    uni.navigateTo({ url: '/pages/verify/verify' });
  }
}

async function skip() {
  uni.navigateTo({ url: '/pages/verify/verify' });
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

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
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

.text-area {
  width: 100%;
  height: 240rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-1);
  box-sizing: border-box;
}

.text-area.small {
  height: 160rpx;
}

.form-row {
  display: flex;
  gap: 24rpx;
  margin-top: 24rpx;
}

.form-col {
  flex: 1;
  margin-bottom: 24rpx;
}

.form-row .form-col {
  margin-bottom: 0;
}

.form-label {
  font-size: 26rpx;
  color: var(--text-2);
  display: block;
  margin-bottom: 12rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
  box-sizing: border-box;
}

.date-row {
  position: relative;
}

.input-icon {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 40rpx;
  height: 40rpx;
}

.picker-val {
  height: 88rpx;
  line-height: 88rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 24rpx;
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
  background: var(--primary);
  color: #fff;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 80rpx 0;
}

.upload-icon {
  width: 80rpx;
  height: 80rpx;
}

.upload-text {
  font-size: 28rpx;
  color: var(--text-1);
  font-weight: 500;
}

.upload-hint {
  font-size: 22rpx;
  color: var(--text-3);
}

.empty-card {
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: var(--text-3);
  line-height: 1.6;
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
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
