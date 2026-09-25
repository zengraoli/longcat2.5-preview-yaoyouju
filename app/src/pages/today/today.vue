<template>
  <view class="page">
    <view class="header">
      <text class="page-title">记录今天</text>
      <text class="page-subtitle">以生活任务组织记录，允许跳过</text>
    </view>

    <view class="card">
      <view class="form-item">
        <text class="form-label">今天能坐多久？</text>
        <view class="chip-group">
          <view
            v-for="opt in sitOptions"
            :key="opt.value"
            class="chip"
            :class="{ selected: form.sitMinutes === opt.value }"
            @click="form.sitMinutes = opt.value"
          >
            {{ opt.label }}
          </view>
        </view>
        <view class="skip-row">
          <text class="skip-label">跳过此项</text>
          <switch :checked="form.sitSkipped" @change="form.sitSkipped = $event.detail.value" />
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">计划的活动是否完成？</text>
        <picker :range="activityOptions" :value="activityIndex" @change="onActivityChange">
          <view class="picker-val">{{ activityOptions[activityIndex] }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">睡眠受影响程度（1-5）</text>
        <slider :value="form.sleepImpact" :min="1" :max="5" @change="onSleepChange" show-value />
      </view>

      <view class="form-item">
        <text class="form-label">最担心的事</text>
        <input
          v-model="form.topWorry"
          class="text-input"
          placeholder="您今天最担心的是什么？"
          placeholder-class="placeholder"
          :maxlength="100"
        />
        <view class="skip-row">
          <text class="skip-label">跳过此项</text>
          <switch :checked="form.worrySkipped" @change="form.worrySkipped = $event.detail.value" />
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">腿部变化</text>
        <view class="chip-group">
          <view
            v-for="opt in legOptions"
            :key="opt.value"
            class="chip"
            :class="{ selected: form.legChange === opt.value }"
            @click="form.legChange = opt.value"
          >
            {{ opt.label }}
          </view>
        </view>
      </view>

      <button class="primary-btn" @click="submit">保存记录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '../../api/request';

const sitOptions = [
  { label: '< 30分钟', value: 15 },
  { label: '30-60分钟', value: 45 },
  { label: '1-2小时', value: 90 },
  { label: '> 2小时', value: 150 },
];

const activityOptions = ['已完成', '部分完成', '未完成', '未计划'];
const activityIndex = ref(0);

const legOptions = [
  { label: '无变化', value: '无' },
  { label: '有改善', value: '有改善' },
  { label: '有加重', value: '有加重' },
  { label: '尚未确认', value: '尚未确认' },
];

const form = reactive({
  sitMinutes: null as number | null,
  sitSkipped: false,
  sleepImpact: 3,
  topWorry: '',
  worrySkipped: false,
  legChange: '尚未确认',
});

function onActivityChange(e: any) {
  activityIndex.value = e.detail.value;
}

function onSleepChange(e: any) {
  form.sleepImpact = e.detail.value;
}

async function submit() {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) {
      uni.showToast({ title: '请先创建病程', icon: 'none' });
      return;
    }
    const episodeId = episodes[0].id;
    const careEvent = await api.createCareEvent({
      episodeId,
      eventType: '症状',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: `日常记录: 坐姿${form.sitSkipped ? '跳过' : form.sitMinutes + '分钟'}, 活动${activityOptions[activityIndex.value]}, 睡眠影响${form.sleepImpact}`,
      verifyStatus: '尚未确认',
    });
    await api.createSymptomLog({
      careEventId: careEvent.id,
      sitMinutes: form.sitSkipped ? null : form.sitMinutes,
      plannedActivityDone: activityOptions[activityIndex.value],
      sleepImpact: form.sleepImpact,
      topWorry: form.worrySkipped ? '' : form.topWorry,
      legChange: form.legChange,
    });
    uni.showToast({ title: '记录已保存', icon: 'success' });
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

.skip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.skip-label {
  font-size: 22rpx;
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
}

.text-input {
  height: 80rpx;
  background: var(--bg);
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
}

.placeholder {
  color: var(--text-3);
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
  margin-top: 40rpx;
}
</style>
