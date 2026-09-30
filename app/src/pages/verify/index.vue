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
    <view class="card" v-if="report">
      <view class="verify__card-title">
        <text class="verify__card-name">报告信息 · {{ report.reportDate || '日期尚未确认' }}</text>
        <view class="verify__card-actions">
          <StatusTag label="报告原文" />
          <text class="verify__edit" @click="onCorrectReport">✎</text>
        </view>
      </view>
      <view v-for="(term, i) in report.terms" :key="i" class="verify__term">
        <text class="verify__term-label">{{ term.label }}</text>
        <text class="verify__term-text">{{ term.text }}</text>
        <text class="verify__term-pos">{{ term.pos }}</text>
      </view>
      <text class="verify__raw">{{ report.rawText }}</text>

      <!-- 侧别冲突 -->
      <view v-if="conflict" class="verify__conflict">
        <text class="verify__conflict-title">⚠ 侧别冲突：{{ conflict }}</text>
        <view class="verify__conflict-actions">
          <AppButton type="soft" @click="resolveConflict('左侧')">我的症状在左侧</AppButton>
          <AppButton type="secondary" @click="resolveConflict('双侧')">都有 / 不确定</AppButton>
        </view>
      </view>
    </view>
    <view class="card" v-else>
      <text class="verify__empty">暂无已录入的报告</text>
    </view>

    <!-- 症状与变化 -->
    <view class="card">
      <view class="verify__card-title">
        <text class="verify__card-name">症状与变化</text>
        <view class="verify__card-actions">
          <StatusTag label="自述" />
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
        </view>
      </view>
      <view v-for="(row, i) in advices" :key="i" class="verify__row">
        <text class="verify__row-label">{{ row.label }}</text>
        <text class="verify__row-text">{{ row.text }}</text>
        <StatusTag :label="row.status" />
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
import { listEpisodes, timeline } from '@/api';

const report = ref<{
  id: string;
  reportDate: string | null;
  rawText: string;
  terms: Array<{ label: string; text: string; pos: string }>;
  verifyStatus: string;
} | null>(null);
const conflict = ref('');
const symptoms = ref<Array<{ label: string; text: string; status: string }>>([]);
const advices = ref<Array<{ label: string; text: string; status: string }>>([]);

function goBack() {
  uni.navigateBack();
}

function onCorrectReport() {
  // 跳转到原文对照页确认报告（避免用事件 ID 调报告接口 404）
  uni.navigateTo({ url: '/pages/report-compare/index' });
}

function resolveConflict(choice: string) {
  conflict.value = '';
  uni.showToast({ title: `已记录：${choice}`, icon: 'success' });
}

async function onGenerate() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) {
      uni.showToast({ title: '请先建立病程', icon: 'none' });
      return;
    }
    // 带上核对页整理的文字做安全预检
    const text = [
      ...symptoms.value.filter((s) => s.text && s.text !== '尚未确认').map((s) => `${s.label}${s.text}`),
      ...advices.value.filter((a) => a.text && a.text !== '尚未确认').map((a) => a.text),
    ].join('，');
    const { createAnalysis } = await import('@/api');
    const result = await createAnalysis(episodes[0].id, text || undefined);
    if (result.safety.redFlags.length > 0) {
      uni.showModal({
        title: '需要及时寻求专业帮助',
        content: result.safety.redFlags.map((r) => r.message).join(''),
        showCancel: false,
        success: () => {
          uni.navigateTo({ url: '/pages/redflag/index' });
        },
      });
      return;
    }
    if (result.status === 'blocked') {
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
    if (episodes.length === 0) return;
    const tl = await timeline(episodes[0].id);
    const reportEvent = [...tl.events].reverse().find((e) => e.eventType === '报告' && e.rawText);
    if (!reportEvent) return;
    // 从时间线事件中提取报告信息（报告原文在事件里）
    const rawText = reportEvent.rawText ?? '';
    const terms: Array<{ label: string; text: string; pos: string }> = [];
    const termDefs: Array<{ name: string; def: string }> = [
      { name: 'L5/S1', def: '第 5 腰椎与第 1 骶椎之间的椎间盘' },
      { name: '硬膜囊受压', def: '突出物与神经外膜结构的位置关系（影像描述）' },
      { name: '神经根受压', def: '神经根受压迫的可能（需结合查体）' },
      { name: '椎间盘突出', def: '椎间盘内容物超出椎体边缘的影像描述' },
    ];
    let pos = 1;
    for (const t of termDefs) {
      if (rawText.includes(t.name)) {
        terms.push({ label: t.name, text: t.def, pos: `原文第${pos}处` });
        pos += 1;
      }
    }
    report.value = {
      id: reportEvent.id,
      reportDate: reportEvent.occurredAt.slice(0, 10),
      rawText,
      terms,
      verifyStatus: reportEvent.verifyStatus,
    };
  } catch {
    // 加载失败不阻塞
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
  width: 72px;
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
.verify__raw {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  display: block;
  background: var(--bg);
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
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
.verify__empty {
  font-size: 14px;
  color: var(--text-3);
  text-align: center;
  display: block;
  padding: 12px 0;
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
