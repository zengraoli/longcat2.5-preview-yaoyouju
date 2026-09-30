<template>
  <view class="followup">
    <view class="followup__header">
      <text class="followup__title">复诊准备</text>
      <text class="followup__edit" @click="goSummary">编辑与导出 ›</text>
    </view>

    <TipBar type="info">
      复诊摘要按固定六段整理你已录入的信息，保留来源与未核实项，可预览后自主导出。
    </TipBar>

    <!-- 摘要预览 -->
    <view class="card">
      <text class="card-title">一页交接摘要（预览）</text>
      <view v-if="content">
        <view v-for="section in sections" :key="section.key" class="followup__section">
          <text class="followup__section-title">{{ section.title }}</text>
          <view v-for="(item, i) in section.items" :key="i" class="followup__item">
            <text class="followup__item-text">{{ item.text }}</text>
            <text v-if="item.source" class="followup__item-source">{{ item.source }}</text>
          </view>
          <text v-if="section.items.length === 0" class="followup__empty">尚未确认</text>
        </view>
      </view>
      <text v-else class="followup__empty">尚未建立病程，请先录入信息</text>
    </view>

    <!-- 问题清单 -->
    <view class="card">
      <text class="card-title">复诊问题（{{ questions.length }}）</text>
      <view v-for="(q, i) in questions" :key="i" class="followup__question">
        <text class="followup__question-num">{{ i + 1 }}</text>
        <text class="followup__question-text">{{ q }}</text>
      </view>
      <text v-if="questions.length === 0" class="followup__empty">暂无复诊问题，可在“问与解释”中加入</text>
    </view>

    <AppButton block @click="goSummary">查看完整摘要与导出</AppButton>

    <EmergencyBar @click="showEmergency = true" />

    <!-- 就医提示弹层 -->
    <view v-if="showEmergency" class="mask" @click="showEmergency = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">{{ emergency.title }}</text>
        <view v-for="(item, i) in emergency.redFlags" :key="i" class="dialog__item">
          <text class="dialog__dot">•</text>
          <text class="dialog__text">{{ item }}</text>
        </view>
        <text class="dialog__note">{{ emergency.note }}</text>
        <AppButton block @click="showEmergency = false">我知道了</AppButton>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import EmergencyBar from '@/components/EmergencyBar.vue';
import { listEpisodes, previewSummary, getSafetyTips, type SummaryContent } from '@/api';

const content = ref<SummaryContent | null>(null);
const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

const questions = computed(() => content.value?.复诊问题 ?? []);

const sections = computed(() => {
  if (!content.value) return [];
  return [
    { key: '当前情况', title: '当前情况', items: content.value.当前情况 },
    { key: '报告要点', title: '相关检查原文', items: content.value.报告要点 },
    { key: '医嘱要点', title: '已经接受的专业建议', items: content.value.医嘱要点 },
    { key: '尚未确认', title: '尚未确认', items: content.value.尚未确认 },
    { key: '下一步', title: '下一步', items: content.value.下一步 },
  ];
});

function goSummary() {
  uni.navigateTo({ url: '/pages/summary/index' });
}

async function load() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      content.value = await previewSummary(episodes[0].id);
    }
  } catch {
    // 未登录时不阻塞
  }
  try {
    const tips = await getSafetyTips();
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞
  }
}

onMounted(load);
onShow(load);
</script>

<style scoped>
.followup {
  min-height: 100vh;
  padding: 16px 16px 100px;
}
.followup__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.followup__title {
  font-size: 17px;
  font-weight: 500;
}
.followup__edit {
  font-size: 13px;
  color: var(--primary);
}
.followup__section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.followup__section:last-child {
  border-bottom: none;
}
.followup__section-title {
  font-size: 14px;
  font-weight: 500;
  display: block;
  margin-bottom: 6px;
}
.followup__item {
  margin-bottom: 6px;
}
.followup__item-text {
  font-size: 14px;
  line-height: 1.6;
  display: block;
}
.followup__item-source {
  font-size: 11px;
  color: var(--text-3);
  display: block;
}
.followup__empty {
  font-size: 13px;
  color: var(--text-3);
}
.followup__question {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.followup__question-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.followup__question-text {
  font-size: 14px;
  flex: 1;
  line-height: 1.5;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
  display: block;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 32px;
}
.dialog {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
}
.dialog__title { font-size: 16px; font-weight: 500; margin-bottom: 12px; }
.dialog__item { display: flex; gap: 8px; margin-bottom: 8px; }
.dialog__dot { color: var(--error); }
.dialog__text { font-size: 14px; flex: 1; }
.dialog__note { font-size: 12px; color: var(--text-2); margin: 12px 0 16px; }
</style>
