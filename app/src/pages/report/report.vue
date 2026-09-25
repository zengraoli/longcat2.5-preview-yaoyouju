<template>
  <view class="page">
    <view class="header">
      <text class="page-title">录入报告或医嘱</text>
      <text class="page-subtitle">粘贴文字内容，或拍照识别（演示为模拟）</text>
    </view>

    <view class="card">
      <view class="tabs">
       
view class="tab" :class="{ active: mode === 'paste' }" @click="mode = 'paste'">粘贴文字</view>
        <view class="tab" :class="{ active: mode === 'ocr' }" @click="mode = 'ocr'">拍照识别</view>
      </view>

      <view v-if="mode === 'paste'">
        <textarea
          v-model="rawText"
          class="text-area"
          placeholder="请粘贴检查报告或医嘱的文字内容"
          placeholder-class="placeholder"
          :maxlength="5000"
        />
        <text class="char-count">{{ rawText.length }}/5000</text>
      </view>

      <view v-else class="ocr-area">
        <view class="upload-box" @click="mockOcr">
          <text class="upload-icon">📷</text>
          <text class="upload-text">点击拍照上传</text>
          <text class="upload-hint">（演示模式：使用模拟文本）</text>
        </view>
      </view>

      <view class="form-row">
        <text class="form-label">来源类型</text>
        <picker :range="sourceTypes" :value="sourceTypeIndex" @change="onSourceTypeChange">
          <view class="picker-val">{{ sourceTypes[sourceTypeIndex] }}</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">报告日期</text>
        <picker mode="date" :value="reportDate" @change="onDateChange">
          <view class="picker-val">{{ reportDate || '选择日期' }}</view>
        </picker>
      </view>

      <button class="primary-btn" :disabled="!canSubmit" @click="submit">
        提交报告
      </button>
      <button class="skip-btn" @click="skip">跳过这步</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { api } from '../../api/request';

const mode = ref<'paste' | 'ocr'>('paste');
const rawText = ref('');
const sourceTypes = ['报告原文', '自述', '医生记录'];
const sourceTypeIndex = ref(0);
const reportDate = ref('');

const canSubmit = computed(() => {
  return rawText.value.trim().length > 0 && reportDate.value;
});

function onSourceTypeChange(e: any) {
  sourceTypeIndex.value = e.detail.value;
}

function onDateChange(e: any) {
  reportDate.value = e.detail.value;
}

function mockOcr() {
  rawText.value = '腰椎MRI：L4/5椎间盘中央型突出，硬膜囊及双侧神经根受压，椎管轻度狭窄。';
  uni.showToast({ title: '识别成功', icon: 'success' });
}

async function submit() {
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (!episodeId) {
      uni.showToast({ title: '请先创建病程', icon: 'none' });
      return;
    }
    const careEvent = await api.createCareEvent({
      episodeId,
      eventType: '报告',
      occurredAt: new Date(reportDate.value).toISOString(),
      sourceType: sourceTypes[sourceTypeIndex.value],
      rawText: rawText.value,
    });
    await api.createReport({
      careEventId: careEvent.id,
      reportDate: reportDate.value,
      rawText: rawText.value,
      sourceType: sourceTypes[sourceTypeIndex.value],
    });
    uni.showToast({ title: '报告已保存', icon: 'success' });
    setTimeout(() => uni.navigateTo({ url: '/pages/verify/verify' }), 1000);
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
}

function skip() {
  uni.navigateTo({ url: '/pages/verify/verify' });
}
</script>

<style lang="scss" scoped>
.page {
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

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
}

.tabs {
  display: flex;
  background: var(--bg);
  border-radius: 12rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  font-size: 26rpx;
  color: var(--text-2);
  border-radius: 10rpx;

  &.active {
    background: var(--surface);
    color: var(--primary);
    font-weight: 500;
  }
}

.text-area {
  width: 100%;
  height: 300rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
  box-sizing: border-box;
}

.placeholder {
  color: var(--text-3);
}

.char-count {
  font-size: 20rpx;
  color: var(--text-3);
  text-align: right;
  margin-top: 8rpx;
  display: block;
}

.ocr-area {
  margin-bottom: 24rpx;
}

.upload-box {
  height: 300rpx;
  background: var(--bg);
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed var(--border);
}

.upload-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 26rpx;
  color: var(--text-2);
}

.upload-hint {
  font-size: 20rpx;
  color: var(--text-3);
  margin-top: 8rpx;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: var(--text-2);
}

.picker-val {
  font-size: 26rpx;
  color: var(--text-1);
}

.primary-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: var(--primary);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;
  margin-top: 32rpx;

  &[disabled] {
    opacity: 0.5;
  }
}

.skip-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background: transparent;
  color: var(--text-2);
  font-size: 26rpx;
  border: none;
  margin-top: 16rpx;
}
</style>
