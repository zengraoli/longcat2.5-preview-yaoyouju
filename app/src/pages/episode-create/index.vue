<template>
  <view class="episode-create">
    <view class="episode-create__header">
      <text class="episode-create__back" @click="goBack">‹</text>
      <text class="episode-create__title">新建病程</text>
    </view>

    <view class="card">
      <text class="episode-create__label">病程名称</text>
      <input
        v-model="title"
        class="episode-create__input"
        placeholder="如：腰痛 3 个月"
        :maxlength="100"
      />

      <text class="episode-create__label">开始日期（可选）</text>
      <picker mode="date" :value="onsetDate" @change="onDateChange">
        <view class="episode-create__input">
          <text :class="{ 'episode-create__placeholder': !onsetDate }">
            {{ onsetDate || '选择日期，或点“记不清”' }}
          </text>
        </view>
      </picker>

      <view class="episode-create__chips">
        <AppChip
          v-for="opt in certaintyOptions"
          :key="opt"
          :state="certainty === opt ? 'selected' : 'unselected'"
          @click="certainty = opt"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <AppButton block @click="onCreate">创建病程</AppButton>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import { createEpisode } from '@/api';

const title = ref('');
const onsetDate = ref('');
const certainty = ref('尚未确认');
const certaintyOptions = ['已确认', '尚未确认'];

function onDateChange(e: { detail: { value: string } }) {
  onsetDate.value = e.detail.value;
}

function goBack() {
  uni.navigateBack();
}

async function onCreate() {
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入病程名称', icon: 'none' });
    return;
  }
  try {
    await createEpisode(title.value.trim(), onsetDate.value || undefined, certainty.value);
    uni.showToast({ title: '已创建', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}
</script>

<style scoped>
.episode-create {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.episode-create__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.episode-create__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.episode-create__title {
  font-size: 17px;
  font-weight: 500;
}
.episode-create__label {
  font-size: 13px;
  color: var(--text-2);
  margin: 12px 0 6px;
  display: block;
}
.episode-create__input {
  min-height: 48px;
  padding: 0 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
}
.episode-create__placeholder {
  color: var(--text-3);
}
.episode-create__chips {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
</style>
