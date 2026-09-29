<template>
  <view class="confirm">
    <view class="confirm__header">
      <text class="confirm__back" @click="goBack">‹</text>
      <text class="confirm__title">当前关键变化确认</text>
      <text class="confirm__step">第 {{ step }} / 4 步</text>
    </view>

    <TipBar type="info">
      先确认最近的变化。没有回答的问题会记录为“尚未确认”，不会被当作“没有”。
    </TipBar>

    <!-- 问题 1 -->
    <view class="card">
      <text class="confirm__question">1. 与上次记录相比，最近腰痛或腿部症状有变化吗？</text>
      <view class="confirm__chips">
        <AppChip
          v-for="opt in changeOptions"
          :key="opt"
          :state="q1 === opt ? 'selected' : 'unselected'"
          @click="q1 = opt"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <!-- 问题 2：红旗信号 -->
    <view class="card">
      <text class="confirm__question">2. 最近是否出现以下任一情况？（可多选）</text>
      <text class="confirm__question-desc">这些变化需要医生及时评估，出现时会优先提示就医。</text>
      <view
        v-for="opt in redFlagOptions"
        :key="opt"
        class="confirm__check"
        @click="toggleRedFlag(opt)"
      >
        <view class="confirm__checkbox" :class="{ 'confirm__checkbox--checked': q2.includes(opt) }">
          <text v-if="q2.includes(opt)">✓</text>
        </view>
        <text class="confirm__check-text">{{ opt }}</text>
      </view>
      <view class="confirm__check confirm__check--none" @click="toggleNone">
        <view class="confirm__checkbox" :class="{ 'confirm__checkbox--checked': noneSelected }">
          <text v-if="noneSelected">✓</text>
        </view>
        <text class="confirm__check-text">以上都没有</text>
      </view>
      <view class="confirm__check" @click="q2uncertain = !q2uncertain">
        <view class="confirm__checkbox" :class="{ 'confirm__checkbox--checked': q2uncertain }">
          <text v-if="q2uncertain">✓</text>
        </view>
        <text class="confirm__check-text">不确定 / 记不清</text>
      </view>
    </view>

    <!-- 问题 3 -->
    <view class="card">
      <text class="confirm__question">3. 疼痛或麻木主要涉及哪一侧？</text>
      <view class="confirm__chips">
        <AppChip
          v-for="opt in sideOptions"
          :key="opt"
          :state="q3 === opt ? 'selected' : 'unselected'"
          @click="q3 = opt"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <!-- 问题 4 -->
    <view class="card">
      <text class="confirm__question">4. 这次症状大约从什么时候开始？</text>
      <picker mode="date" :value="q4date" @change="onDateChange">
        <view class="confirm__date">
          <text :class="{ 'confirm__date--placeholder': !q4date }">
            {{ q4date || '选择日期，或点“记不清”' }}
          </text>
          <text class="confirm__date-icon">📅</text>
        </view>
      </picker>
      <view class="confirm__chips">
        <AppChip
          v-for="opt in onsetOptions"
          :key="opt"
          :state="q4 === opt ? 'selected' : 'unselected'"
          @click="q4 = opt"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <AppButton block @click="onNext">下一步</AppButton>
    <text class="confirm__skip" @click="onSkip">先看已审核科普，稍后再填</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TipBar from '@/components/TipBar.vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import { checkSafety } from '@/api';

const step = ref(1);
const changeOptions = ['加重', '差不多', '减轻', '尚未确认'];
const redFlagOptions = [
  '大小便控制异常',
  '会阴区或鞍区麻木',
  '双腿进行性无力',
  '发热、夜间痛持续不缓解或体重明显下降',
];
const sideOptions = ['左侧', '右侧', '双侧', '尚未确认'];
const onsetOptions = ['记不清', '约1周内', '约1个月内', '超过3个月'];

const q1 = ref('');
const q2 = ref<string[]>([]);
const q2uncertain = ref(false);
const noneSelected = ref(false);
const q3 = ref('');
const q4 = ref('');
const q4date = ref('');

const redFlagHit = computed(() => q2.value.length > 0 && !noneSelected.value);

function toggleRedFlag(opt: string) {
  const idx = q2.value.indexOf(opt);
  if (idx >= 0) q2.value.splice(idx, 1);
  else q2.value.push(opt);
  if (q2.value.length > 0) noneSelected.value = false;
}

function toggleNone() {
  noneSelected.value = !noneSelected.value;
  if (noneSelected.value) q2.value = [];
}

function onDateChange(e: { detail: { value: string } }) {
  q4date.value = e.detail.value;
}

function goBack() {
  uni.navigateBack();
}

async function onNext() {
  // 提交安全预检：命中红旗则跳转就医提示
  const text = [
    q1.value && `症状${q1.value}`,
    ...q2.value,
    q3.value && `疼痛涉及${q3.value}`,
    q4.value === '记不清' ? '开始时间记不清' : '',
  ]
    .filter(Boolean)
    .join('，');
  try {
    const result = await checkSafety(text, 'confirm');
    if (!result.passed && result.redFlags.length > 0) {
      uni.navigateTo({ url: '/pages/redflag/index' });
      return;
    }
  } catch {
    // 预检失败不阻塞流程
  }
  uni.navigateTo({ url: '/pages/confusion/index' });
}

function onSkip() {
  uni.navigateTo({ url: '/pages/confusion/index' });
}
</script>

<style scoped>
.confirm {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.confirm__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.confirm__back {
  font-size: 24px;
  color: var(--text-1);
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.confirm__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.confirm__step {
  font-size: 12px;
  color: var(--text-3);
}
.confirm__question {
  font-size: 15px;
  font-weight: 500;
  display: block;
  margin-bottom: 12px;
  line-height: 1.5;
}
.confirm__question-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: -8px;
  margin-bottom: 12px;
}
.confirm__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.confirm__check {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 10px;
  background: var(--surface);
}
.confirm__check--none {
  background: var(--primary-light);
  border-color: var(--primary);
}
.confirm__checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
}
.confirm__checkbox--checked {
  background: var(--primary);
  border-color: var(--primary);
}
.confirm__check-text {
  font-size: 14px;
  flex: 1;
}
.confirm__date {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 12px;
  background: var(--surface);
  font-size: 14px;
}
.confirm__date--placeholder {
  color: var(--text-3);
}
.confirm__date-icon { font-size: 18px; }
.confirm__skip {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 16px;
  min-height: 44px;
  line-height: 44px;
}
</style>
