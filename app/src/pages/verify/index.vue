<template>
  <view class="verify">
    <view class="verify__header">
      <text class="verify__back" @click="goBack">‹</text>
      <text class="verify__title">核对整理后的信息</text>
      <text class="verify__step">第 4 / 4 步</text>
    </view>

    <TipBar type="info">
      请核对系统整理的信息。缺失项显示为“尚未确认”，冲突项需要你确认后才会进入分析。
    </TipBar>

    <!-- 报告信息 -->
    <view class="card">
      <view class="verify__card-title">
        <text class="verify__card-name">报告信息 · {{ reportDate }}</text>
        <view class="verify__card-actions">
          <StatusTag label="报告原文" />
          <text class="verify__edit">✎</text>
        </view>
      </view>
      <view v-for="(term, i) in terms" :key="i" class="verify__term">
        <text class="verify__term-label">{{ term.label }}</text>
        <text class="verify__term-text">{{ term.text }}</text>
        <text class="verify__term-pos">{{ term.pos }}</text>
      </view>

      <!-- 侧别冲突 -->
      <view v-if="conflict" class="verify__conflict">
        <text class="verify__conflict-title">⚠ 侧别冲突：{{ conflict.text }}</text>
        <view class="verify__conflict-actions">
          <AppButton type="soft" @click="resolveConflict('left')">我的症状在左侧</AppButton>
          <AppButton type="secondary" @click="resolveConflict('both')">都有 / 不确定</AppButton>
        </view>
      </view>
    </view>

    <!-- 症状与变化 -->
    <view class="card">
      <view class="verify__card-title">
        <text class="verify__card-name">症状与变化</text>
        <view class="verify__card-actions">
          <StatusTag label="自述" />
          <text class="verify__edit">✎</text>
        </view>
      </view>
      <view v-for="(row, i) in symptoms" :key="i" class="verify__row">
        <text class="verify__row-label">{{ row.label }}</text>
        <text class="verify__row-text">{{ row.text }}</text>
        <StatusTag :label="row.status" />
      </view>
    </view>

    <!-- 既有医嘱 -->
    <view class="card">
      <view class="verify__card-title">
        <text class="verify__card-name">既有医嘱</text>
        <view class="verify__card-actions">
          <StatusTag label="自述" />
          <text class="verify__edit">✎</text>
        </view>
      </view>
      <view class="verify__row">
        <text class="verify__row-label">医生建议</text>
        <text class="verify__row-text">保守治疗，4周后复查</text>
        <StatusTag label="未经核实" />
      </view>
    </view>

    <TipBar type="warn">
      “尚未确认”不会被当作“没有”；旧记录中的“当时没有”也不会被当作“现在没有”。
    </TipBar>

    <AppButton block @click="onGenerate">确认无误，生成一页分析</AppButton>
    <text class="verify__back-link" @click="goBack">返回修改</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, timeline, createAnalysis } from '@/api';

const reportDate = ref('2026-08-30');
const terms = ref([
  { label: '关键术语', text: 'L5/S1 椎间盘向后突出', pos: '原文第2行' },
  { label: '', text: '相应硬膜囊受压', pos: '原文第2行' },
  { label: '神经根', text: '报告写“右侧神经根受压可能”', pos: '原文第3行' },
]);
const conflict = ref<{ text: string } | null>({ text: '报告为“右侧”，你的描述为“左侧”' });
const symptoms = ref([
  { label: '症状开始', text: '约1个月内（记不清具体日期）', status: '尚未确认' },
  { label: '最近变化', text: '加重', status: '已确认' },
  { label: '腿部无力', text: '尚未回答', status: '尚未确认' },
  { label: '大小便/鞍区', text: '没有', status: '已确认' },
  { label: '主要困惑', text: '报告术语', status: '已确认' },
]);

function resolveConflict(_choice: string) {
  conflict.value = null;
}

function goBack() {
  uni.navigateBack();
}

async function onGenerate() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) return;
    const result = await createAnalysis(episodes[0].id);
    if (result.safety.redFlags.length > 0) {
      uni.navigateTo({ url: '/pages/redflag/index' });
      return;
    }
    uni.navigateTo({ url: `/pages/analysis/index?id=${result.taskId}` });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      await timeline(episodes[0].id);
    }
  } catch {
    // 核对页数据加载失败不阻塞
  }
});
</script>

<style scoped>
.verify {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.verify__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.verify__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.verify__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.verify__step {
  font-size: 12px;
  color: var(--text-3);
}
.verify__card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.verify__card-name {
  font-size: 15px;
  font-weight: 500;
}
.verify__card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.verify__edit { color: var(--text-3); font-size: 16px; }
.verify__term {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.verify__term-label {
  font-size: 13px;
  color: var(--text-2);
  width: 56px;
  flex-shrink: 0;
}
.verify__term-text {
  font-size: 14px;
  flex: 1;
}
.verify__term-pos {
  font-size: 11px;
  color: var(--text-3);
  flex-shrink: 0;
}
.verify__conflict {
  background: rgba(217, 59, 59, 0.06);
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
}
.verify__conflict-title {
  font-size: 14px;
  color: var(--error);
  display: block;
  margin-bottom: 10px;
  line-height: 1.5;
}
.verify__conflict-actions {
  display: flex;
  gap: 10px;
}
.verify__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.verify__row-label {
  font-size: 13px;
  color: var(--text-2);
  width: 72px;
  flex-shrink: 0;
}
.verify__row-text {
  font-size: 14px;
  flex: 1;
}
.verify__back-link {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 16px;
  min-height: 44px;
  line-height: 44px;
}
</style>
