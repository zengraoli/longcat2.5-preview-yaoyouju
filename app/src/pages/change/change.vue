<template>
  <view class="page">
    <view class="header">
      <text class="page-title">当前关键变化确认</text>
    </view>

    <view class="card">
      <text class="card-title">请确认您目前的情况</text>
      <text class="card-desc">以下信息将帮助为您提供更准确的分析</text>

      <view class="form-item">
        <text class="form-label">疼痛程度（0-10）</text>
        <slider :value="painLevel" :min="0" :max="10" @change="onPainChange" show-value />
      </view>

      <view class="form-item">
        <text class="form-label">疼痛部位</text>
        <view class="chip-group">
          <view
            v-for="part in painParts"
            :key="part"
            class="chip"
            :class="{ selected: selectedParts.includes(part) }"
            @click="togglePart(part)"
          >
            {{ part }}
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">症状持续时间</text>
        <picker :range="durationOptions" :value="durationIndex" @change="onDurationChange">
          <view class="picker-value">{{ durationOptions[durationIndex] }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">是否有以下症状</text>
        <view class="checkbox-group">
          <view class="checkbox-item" v-for="s in redFlagSymptoms" :key="s.key" @click="toggleSymptom(s.key)">
            <view class="checkbox" :class="{ checked: symptoms[s.key] }">
              <text v-if="symptoms[s.key]" class="check-icon">✓</text>
            </view>
            <text class="checkbox-label">{{ s.label }}</text>
          </view>
        </view>
      </view>

      <button class="primary-btn" @click="submit">确认并继续</button>
      <button class="skip-btn" @click="skip">跳过</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const painLevel = ref(0);
const painParts = ['腰部', '臀部', '大腿', '小腿', '脚部'];
const selectedParts = ref<string[]>([]);
const durationOptions = ['少于1周', '1-4周', '1-3个月', '3个月以上'];
const durationIndex = ref(0);
const redFlagSymptoms = [
  { key: 'bowel', label: '大小便失禁或排便困难' },
  { key: 'numbness', label: '会阴部麻木' },
  { key: 'weakness', label: '下肢无力或行走困难' },
  { key: 'fever', label: '发热或寒战' },
  { key: 'trauma', label: '近期有外伤史' },
];
const symptoms = ref<Record<string, boolean>>({});

function onPainChange(e: any) {
  painLevel.value = e.detail.value;
}

function togglePart(part: string) {
  const idx = selectedParts.value.indexOf(part);
  if (idx >= 0) {
    selectedParts.value.splice(idx, 1);
  } else {
    selectedParts.value.push(part);
  }
}

function onDurationChange(e: any) {
  durationIndex.value = e.detail.value;
}

function toggleSymptom(key: string) {
  symptoms.value[key] = !symptoms.value[key];
}

function submit() {
  const hasRedFlag = Object.values(symptoms.value).some(v => v);
  if (hasRedFlag) {
    uni.navigateTo({ url: '/pages/redflag/redflag' });
  } else {
    uni.navigateTo({ url: '/pages/index/index' });
  }
}

function skip() {
  uni.navigateTo({ url: '/pages/index/index' });
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
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
}

.card-desc {
  font-size: 24rpx;
  color: var(--text-2);
  margin-top: 8rpx;
  display: block;
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;
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

.picker-value {
  height: 80rpx;
  line-height: 80rpx;
  background: var(--bg);
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid var(--border);
  border-radius: 8rpx;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.checked {
    background: var(--primary);
    border-color: var(--primary);
  }
}

.check-icon {
  color: #fff;
  font-size: 24rpx;
}

.checkbox-label {
  font-size: 26rpx;
  color: var(--text-1);
}

.primary-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--primary);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;
  margin-top: 40rpx;
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
