<template>
  <view class="page">
    <view class="header">
      <text class="page-title">反馈与错误举报</text>
      <text class="page-subtitle">帮助我们改进服务质量</text>
    </view>

    <view class="card">
      <view class="tabs">
        <view class="tab" :class="{ active: mode === 'feedback' }" @click="mode = 'feedback'">帮助类型</view>
        <view class="tab" :class="{ active: mode === 'report' }" @click="mode = 'report'">错误举报</view>
      </view>

      <view v-if="mode === 'feedback'">
        <text class="form-label">这个分析对您有帮助吗？</text>
        <view class="chip-group">
          <view
            v-for="opt in helpTypes"
            :key="opt.value"
            class="chip"
            :class="{ selected: helpType === opt.value }"
            @click="helpType = opt.value"
          >
            {{ opt.label }}
          </view>
        </view>

        <text class="form-label">未解决的问题</text>
        <textarea
          v-model="unsolvedQuestion"
          class="text-area"
          placeholder="请描述您仍未解决的问题"
          placeholder-class="placeholder"
          :maxlength="500"
        />
      </view>

      <view v-else>
        <text class="form-label">错误分类</text>
        <picker :range="errorCategories" :value="categoryIndex" @change="onCategoryChange">
          <view class="picker-val">{{ errorCategories[categoryIndex] }}</view>
        </picker>

        <text class="form-label">严重程度</text>
        <view class="chip-group">
          <view
            v-for="opt in severityOptions"
            :key="opt.value"
            class="chip"
            :class="{ selected: severity === opt.value }"
            @click="severity = opt.value"
          >
            {{ opt.label }}
          </view>
        </view>

        <text class="form-label">问题描述</text>
        <textarea
          v-model="errorDescription"
          class="text-area"
          placeholder="请描述您发现的问题"
          placeholder-class="placeholder"
          :maxlength="500"
        />

        <view class="auto-info">
          <text class="info-title">自动附带信息</text>
          <text class="info-line">分析版本: {{ analysisVersion || '尚未确认' }}</text>
          <text class="info-line">模型版本: {{ modelVersion || '尚未确认' }}</text>
          <text class="info-line">内容版本: {{ contentVersion || '尚未确认' }}</text>
          <text class="info-line">规则集版本: RF-v1.0</text>
        </view>
      </view>

      <button class="primary-btn" @click="submit">提交</button>
    </view>

    <view class="privacy-note">
      <text class="note-text">您的反馈不会自动进入训练或内容库</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../../api/request';

const mode = ref<'feedback' | 'report'>('feedback');
const helpTypes = [
  { label: '看懂了', value: '看懂了' },
  { label: '知道下一步', value: '知道下一步' },
  { label: '都不好', value: '都不好' },
];
const helpType = ref('');
const unsolvedQuestion = ref('');
const errorCategories = ['错误安慰', '关键遗漏', '左右侧混淆', '隐私问题', '其他'];
const categoryIndex = ref(0);
const severityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
];
const severity = ref('medium');
const errorDescription = ref('');
const analysisVersion = ref('1');
const modelVersion = ref('p-2026.06');
const contentVersion = ref('cl-v2');

function onCategoryChange(e: any) {
  categoryIndex.value = e.detail.value;
}

async function submit() {
  try {
    if (mode.value === 'feedback') {
      await api.createFeedback({
        helpType: helpType.value,
        unsolvedQuestion: unsolvedQuestion.value,
        isErrorReport: false,
      });
    } else {
      await api.createFeedback({
        isErrorReport: true,
        errorCategory: errorCategories[categoryIndex.value],
        severity: severity.value,
        errorDescription: errorDescription.value,
      });
    }
    uni.showToast({ title: '提交成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
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
  margin-bottom: 32rpx;
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

.form-label {
  font-size: 26rpx;
  color: var(--text-2);
  margin-bottom: 16rpx;
  display: block;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 32rpx;
}

.chip {
  padding: 12rpx 24rpx;
  background: var(--bg);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;

  &.selected {
    background: var(--primary-light);
    color: var(--primary);
    border-color: var(--primary);
  }
}

.text-area {
  width: 100%;
  height: 200rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
  box-sizing: border-box;
  margin-bottom: 32rpx;
}

.placeholder {
  color: var(--text-3);
}

.picker-val {
  height: 80rpx;
  line-height: 80rpx;
  background: var(--bg);
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
  margin-bottom: 32rpx;
}

.auto-info {
  background: var(--bg);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 32rpx;
}

.info-title {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 12rpx;
}

.info-line {
  font-size: 22rpx;
  color: var(--text-2);
  display: block;
  margin-bottom: 8rpx;
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
}

.privacy-note {
  margin-top: 24rpx;
  text-align: center;
}

.note-text {
  font-size: 20rpx;
  color: var(--text-3);
}
</style>
