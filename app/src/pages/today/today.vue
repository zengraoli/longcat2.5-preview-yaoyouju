<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">记录今天</text>
      </view>
      <text class="step-chip">约 1 分钟</text>
    </view>

    <view class="note-row">
      <image src="/static/icons/ic_clock.png" class="note-icon" />
      <text class="note-text">{{ today }} · 每个问题都可以跳过，跳过会记为“尚未确认”</text>
    </view>

    <view class="card">
      <text class="question-title">今天能坐多久？</text>
      <view class="chip-group">
        <view
          v-for="opt in ['<15分钟', '15-30', '30-60', '>60分钟']"
          :key="opt"
          class="chip"
          :class="{ selected: form.sitLabel === opt }"
          @click="selectSit(opt)"
        >{{ opt }}</view>
        <view class="chip chip-skip" :class="{ selected: form.sitSkipped }" @click="form.sitSkipped = !form.sitSkipped">跳过</view>
      </view>
    </view>

    <view class="card">
      <text class="question-title">能否完成原本计划的活动？</text>
      <view class="chip-group">
        <view
          v-for="opt in ['能', '部分', '不能']"
          :key="opt"
          class="chip"
          :class="{ selected: form.activityDone === opt }"
          @click="form.activityDone = opt"
        >{{ opt }}</view>
        <view class="chip chip-skip" :class="{ selected: form.activitySkipped }" @click="form.activitySkipped = !form.activitySkipped">跳过</view>
      </view>
    </view>

    <view class="card">
      <text class="question-title">睡眠受影响程度</text>
      <view class="chip-group">
        <view
          v-for="opt in sleepOptions"
          :key="opt.value"
          class="chip chip-pick"
          :class="{ selected: form.sleepImpact === opt.value }"
          @click="form.sleepImpact = opt.value"
        >
          {{ opt.value }}<text class="chip-sub">{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="question-title">与昨天相比</text>
      <view class="chip-group">
        <view
          v-for="opt in ['加重', '差不多', '减轻']"
          :key="opt"
          class="chip"
          :class="{ selected: form.compareToYesterday === opt }"
          @click="form.compareToYesterday = opt"
        >{{ opt }}</view>
        <view class="chip chip-skip" :class="{ selected: form.compareSkipped }" @click="form.compareSkipped = !form.compareSkipped">跳过</view>
      </view>
    </view>

    <view class="card">
      <text class="question-title">今天有腿部麻木或无力吗？</text>
      <text class="question-note">不会沿用昨天的答案——如果你今天不确定，请选“尚未确认”。</text>
      <view class="chip-group">
        <view
          v-for="opt in ['有', '没有', '尚未确认']"
          :key="opt"
          class="chip"
          :class="{ selected: form.legChange === opt }"
          @click="form.legChange = opt"
        >{{ opt }}</view>
      </view>
    </view>

    <view class="card">
      <text class="question-title">今天做了什么？（可多选）</text>
      <view class="chip-group">
        <view
          v-for="opt in ['步行', '热敷', '按医嘱用药', '休息', '康复练习', '工作/久坐', '其他']"
          :key="opt"
          class="chip"
          :class="{ selected: form.activities.includes(opt) }"
          @click="toggleActivity(opt)"
        >{{ opt }}</view>
      </view>
    </view>

    <view class="card">
      <text class="question-title">今天最担心什么？</text>
      <input class="input" v-model="form.topWorry" placeholder="例如：会不会越来越严重 / 要不要换医院…" placeholder-class="placeholder" />
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">记录只用于整理你的病程和复诊摘要；变化图不会把某一次疼痛上升解读为影像恶化。</text>
    </view>

    <view class="footer">
      <button class="primary-btn" @click="submit(false)">保存记录</button>
      <text class="link-text" @click="submit(true)">保存并更新“当前情况”（症状有新变化时）</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '../../api/request';

const today = new Date().toISOString().slice(0, 10);

const sleepOptions = [
  { value: 0, label: '没影响' },
  { value: 1, label: '偶尔醒' },
  { value: 2, label: '常醒' },
  { value: 3, label: '几乎没睡' },
];

const form = reactive({
  sitLabel: '',
  sitSkipped: false,
  activityDone: '',
  activitySkipped: false,
  sleepImpact: null,
  compareToYesterday: '',
  compareSkipped: false,
  legChange: '',
  activities: [] as string[],
  topWorry: '',
});

function selectSit(label: string) {
  form.sitLabel = form.sitLabel === label ? '' : label;
  form.sitSkipped = false;
}

function toggleActivity(opt: string) {
  const idx = form.activities.indexOf(opt);
  if (idx >= 0) form.activities.splice(idx, 1);
  else form.activities.push(opt);
}

function goBack() {
  uni.navigateBack();
}

async function submit(updateCurrent: boolean) {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) {
      uni.showToast({ title: '请先创建病程', icon: 'none' });
      return;
    }
    const episodeId = episodes[0].id;
    const sitMinutes = form.sitSkipped
      ? null
      : { '<15分钟': 10, '15-30': 22, '30-60': 45, '>60分钟': 75 }[form.sitLabel] ?? null;
    const careEvent = await api.createCareEvent({
      episodeId,
      eventType: '症状',
      occurredAt: new Date().toISOString(),
      sourceType: '自述',
      rawText: `日常记录：坐姿${form.sitSkipped ? '跳过' : form.sitLabel || '尚未确认'}；活动${form.activitySkipped ? '跳过' : form.activityDone || '部分'}；睡眠影响${form.sleepImpact}；相比昨天${form.compareSkipped ? '跳过' : form.compareToYesterday || '尚未确认'}；腿部${form.legChange || '尚未确认'}；做了：${form.activities.join('、') || '未记录'}；担心：${form.topWorry || '未记录'}`,
      verifyStatus: '尚未确认',
    });
    await api.createSymptomLog({
      careEventId: careEvent.id,
      sitMinutes,
      plannedActivityDone: form.activitySkipped ? '' : form.activityDone || '部分',
      sleepImpact: form.sleepImpact,
      topWorry: form.topWorry,
      legChange: form.legChange || '尚未确认',
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => {
      if (updateCurrent) {
        uni.navigateTo({ url: '/pages/change/change' });
      } else {
        uni.navigateBack();
      }
    }, 800);
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 48rpx;
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

.note-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.note-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.note-text {
  font-size: 24rpx;
  color: var(--text-3);
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.question-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 24rpx;
}

.question-note {
  font-size: 22rpx;
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
  padding: 16rpx 36rpx;
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

.chip-skip {
  color: var(--text-3);
}

.chip-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 16rpx 28rpx;
}

.chip-sub {
  font-size: 20rpx;
  color: var(--text-3);
}

.chip.selected .chip-sub {
  color: rgba(255, 255, 255, 0.85);
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

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
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
  padding: 24rpx 0;
}

.link-text {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: var(--primary);
  margin-top: 32rpx;
}
</style>
