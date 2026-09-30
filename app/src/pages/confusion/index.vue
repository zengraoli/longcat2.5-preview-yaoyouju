<template>
  <view class="confusion">
    <view class="confusion__header">
      <text class="confusion__back" @click="goBack">‹</text>
      <text class="confusion__title">你现在最想解决什么</text>
      <text class="confusion__step">第 2 / 4 步</text>
    </view>

    <text class="confusion__desc">
      选择一个最困扰你的问题（可稍后更改）。系统会按你的选择调整解释的重点、长度和形式。
    </text>

    <view
      v-for="opt in options"
      :key="opt.key"
      class="confusion__option"
      :class="{ 'confusion__option--selected': selected === opt.key }"
      @click="selected = opt.key"
    >
      <view class="confusion__option-icon" :class="{ 'confusion__option-icon--selected': selected === opt.key }">
        <Icon :name="opt.icon" :size="22" />
      </view>
      <view class="confusion__option-body">
        <text class="confusion__option-title">{{ opt.title }}</text>
        <text class="confusion__option-desc">{{ opt.desc }}</text>
      </view>
      <view class="confusion__radio" :class="{ 'confusion__radio--checked': selected === opt.key }">
        <view v-if="selected === opt.key" class="confusion__radio-dot" />
      </view>
    </view>

    <view class="card">
      <text class="card-title">希望的解释方式</text>
      <view class="confusion__chips">
        <AppChip
          v-for="opt in formatOptions"
          :key="opt"
          :state="format.includes(opt) ? 'selected' : 'unselected'"
          @click="toggleFormat(opt)"
        >
          {{ opt }}
        </AppChip>
      </view>
      <text class="confusion__note">
        不会根据你的选择给你贴任何标签，也不会为了让你更安心而改写事实。
      </text>
    </view>

    <AppButton block @click="onNext">下一步</AppButton>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import Icon from '@/components/Icon.vue';
import { CONFUSION_OPTIONS } from '@/utils/confusion';

const options = CONFUSION_OPTIONS;
const formatOptions = ['简短要点', '详细说明', '带图示视频', '先看原文对照'];

const selected = ref('report');
const format = ref<string[]>(['简短要点', '带图示视频']);

function toggleFormat(opt: string) {
  const idx = format.value.indexOf(opt);
  if (idx >= 0) format.value.splice(idx, 1);
  else format.value.push(opt);
}

function goBack() {
  uni.navigateBack();
}

async function onNext() {
  // 困惑选择只影响解释重点，不写入病程事件（避免出现在“尚未确认”里）
  uni.navigateTo({ url: '/pages/report/index' });
}
</script>

<style scoped>
.confusion {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.confusion__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.confusion__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.confusion__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.confusion__step {
  font-size: 12px;
  color: var(--text-3);
}
.confusion__desc {
  font-size: 14px;
  color: var(--text-2);
  display: block;
  margin-bottom: 16px;
  line-height: 1.6;
}
.confusion__option {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.confusion__option--selected {
  border-color: var(--primary);
  background: var(--primary-light);
}
.confusion__option-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.confusion__option-icon--selected {
  background: var(--primary);
}
.confusion__option-body { flex: 1; }
.confusion__option-title {
  font-size: 15px;
  font-weight: 500;
  display: block;
}
.confusion__option-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
}
.confusion__radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
}
.confusion__radio--checked {
  border-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.confusion__radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
}
.confusion__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.confusion__note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
}
</style>
