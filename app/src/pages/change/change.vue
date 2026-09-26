<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">当前关键变化确认</text>
      </view>
      <text class="step-chip">第 {{ currentStep }} / 4 步</text>
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">先确认最近的变化。没有回答的问题会记录为“尚未确认”，不会被当作“没有”。</text>
    </view>

    <view class="card" v-if="currentStep === 1">
      <text class="question-title">1. 与上次记录相比，最近腰痛或腿部症状有变化吗？</text>
      <view class="chip-group">
        <view
          v-for="opt in ['加重', '差不多', '减轻', '尚未确认']"
          :key="opt"
          class="chip"
          :class="{ selected: answers.change === opt }"
          @click="answers.change = opt"
        >{{ opt }}</view>
      </view>
    </view>

    <view class="card" v-if="currentStep === 2">
      <text class="question-title">2. 最近是否出现以下任一情况？（可多选）</text>
      <text class="question-note">这些变化需要医生及时评估，出现时会优先提示就医。</text>
      <view class="check-list">
        <view
          v-for="item in redFlagItems"
          :key="item"
          class="check-card"
          :class="{ selected: answers.redFlags.includes(item), none: item === '以上都没有' && answers.redFlags.includes(item) }"
          @click="toggleRedFlag(item)"
        >
          <view class="checkbox">
            <text v-if="answers.redFlags.includes(item)" class="check-icon">✓</text>
          </view>
          <text class="check-label">{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="card" v-if="currentStep === 3">
      <text class="question-title">3. 疼痛或麻木主要涉及哪一侧？</text>
      <view class="chip-group">
        <view
          v-for="opt in ['左侧', '右侧', '双侧', '尚未确认']"
          :key="opt"
          class="chip"
          :class="{ selected: answers.side === opt }"
          @click="answers.side = opt"
        >{{ opt }}</view>
      </view>
    </view>

    <view class="card" v-if="currentStep === 4">
      <text class="question-title">4. 这次症状大约从什么时候开始？</text>
      <view class="date-row">
        <input
          class="date-input"
          type="text"
          placeholder="选择日期，或点“记不清”"
          :value="answers.onsetDate || '选择日期'"
          readonly
          @click="openDatePicker"
        />
        <image src="/static/icons/ic_calendar.png" class="date-icon" @click="openDatePicker" />
      </view>
      <view class="chip-group">
        <view
          v-for="opt in ['记不清', '约1周内', '约1个月内', '超过3个月']"
          :key="opt"
          class="chip"
          :class="{ selected: answers.onsetRange === opt }"
          @click="answers.onsetRange = opt"
        >{{ opt }}</view>
      </view>
    </view>

    <view class="footer">
      <button class="primary-btn" @click="onNext">{{ currentStep < 4 ? '下一步' : '完成并继续' }}</button>
      <text class="link-text" @click="goContent">先看已审核科普，稍后再填</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '../../api/request';

const currentStep = ref(1);

const redFlagItems = ['大小便控制异常', '会阴区或鞍区麻木', '双腿进行性无力', '发热、夜间痛持续不缓解或体重明显下降', '以上都没有', '不确定 / 记不清'];

const answers = reactive<{
  change: string;
  redFlags: string[];
  side: string;
  onsetDate: string;
  onsetRange: string;
}>({
  change: '',
  redFlags: [],
  side: '',
  onsetDate: '',
  onsetRange: '',
});

function toggleRedFlag(item: string) {
  const idx = answers.redFlags.indexOf(item);
  if (idx >= 0) {
    answers.redFlags.splice(idx, 1);
  } else {
    // “以上都没有”与其他选项互斥
    if (item === '以上都没有') answers.redFlags = ['以上都没有'];
    else answers.redFlags = answers.redFlags.filter((i) => i !== '以上都没有');
    if (!answers.redFlags.includes(item)) answers.redFlags.push(item);
  }
}

function openDatePicker() {
  // uni-app H5 环境下使用 input[type=date]
  const input = document.createElement('input');
  input.type = 'date';
  input.value = answers.onsetDate || '';
  input.onchange = () => {
    answers.onsetDate = input.value || '';
    if (input.value) answers.onsetRange = '';
  };
  input.click();
}

function goBack() {
  if (currentStep.value > 1) {
    currentStep.value--;
  } else {
    uni.navigateBack();
  }
}

function goContent() {
  uni.navigateTo({ url: '/pages/content/content' });
}

async function saveAnswers() {
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (!episodeId) return;
    await api.createCareEvent({
      episodeId,
      eventType: '变化确认',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: JSON.stringify({
        变化: answers.change || '尚未确认',
        红旗项: answers.redFlags,
        侧别: answers.side || '尚未确认',
        开始日期: answers.onsetDate || answers.onsetRange || '尚未确认',
      }, null, 2),
      verifyStatus: '尚未确认',
    });
  } catch (e) {
    console.error('Failed to save change answers:', e);
  }
}

function hasRealRedFlag() {
  const excluded = ['以上都没有', '不确定 / 记不清'];
  return answers.redFlags.some((i) => !excluded.includes(i));
}

async function onNext() {
  if (currentStep.value < 4) {
    currentStep.value++;
    return;
  }
  await saveAnswers();
  if (hasRealRedFlag()) {
    const items = answers.redFlags.filter((i) => !['以上都没有', '不确定 / 记不清'].includes(i)).join(',');
    uni.navigateTo({ url: `/pages/redflag/redflag?items=${encodeURIComponent(items)}` });
  } else {
    uni.navigateTo({ url: '/pages/confusion/confusion' });
  }
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
  font-size: 26rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.question-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 24rpx;
}

.question-note {
  font-size: 24rpx;
  color: var(--text-3);
  display: block;
  margin: -12rpx 0 20rpx;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.chip {
  padding: 16rpx 40rpx;
  background: var(--bg);
  border-radius: 24rpx;
  font-size: 26rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.chip.selected {
  background: var(--primary);
  color: #fff;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.check-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  border: 2rpx solid var(--border);
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
}

.check-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.check-card.none.selected {
  background: var(--primary);
}

.check-card.none.selected .check-label {
  color: #fff;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid var(--border);
  border-radius: 8rpx;
  margin-right: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-card.selected .checkbox {
  background: var(--primary);
  border-color: var(--primary);
}

.check-icon {
  color: #fff;
  font-size: 24rpx;
}

.check-label {
  font-size: 26rpx;
  color: var(--text-1);
}

.date-row {
  position: relative;
  margin-bottom: 24rpx;
}

.date-input {
  width: 100%;
  height: 88rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 0 80rpx 0 24rpx;
  font-size: 26rpx;
  color: var(--text-3);
  box-sizing: border-box;
}

.date-icon {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 40rpx;
  height: 40rpx;
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
