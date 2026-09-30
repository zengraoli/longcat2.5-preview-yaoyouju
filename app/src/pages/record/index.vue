<template>
  <view class="record">
    <view class="record__header">
      <text class="record__back" @click="goBack">‹</text>
      <text class="record__title">记录今天</text>
      <text class="record__duration">约 1 分钟</text>
    </view>

    <view class="record__info">
      <text class="record__info-icon">🕐</text>
      <text class="record__info-text">
        {{ today }} · 每个问题都可以跳过，跳过会记为“尚未确认”
      </text>
    </view>

    <!-- 能坐多久 -->
    <view class="card">
      <text class="record__question">今天能坐多久？</text>
      <view class="record__chips">
        <AppChip
          v-for="opt in sitOptions"
          :key="opt"
          :state="sitMinutes === opt ? 'selected' : 'unselected'"
          @click="sitMinutes = opt"
        >
          {{ opt }}
        </AppChip>
        <AppChip state="skip" @click="sitMinutes = ''">跳过</AppChip>
      </view>
    </view>

    <!-- 计划活动 -->
    <view class="card">
      <text class="record__question">能否完成原本计划的活动？</text>
      <view class="record__chips">
        <AppChip
          v-for="opt in activityOptions"
          :key="opt"
          :state="activity === opt ? 'selected' : 'unselected'"
          @click="activity = opt"
        >
          {{ opt }}
        </AppChip>
        <AppChip state="skip" @click="activity = ''">跳过</AppChip>
      </view>
    </view>

    <!-- 睡眠影响 -->
    <view class="card">
      <text class="record__question">睡眠受影响程度</text>
      <view class="record__chips">
        <AppChip
          v-for="opt in sleepOptions"
          :key="opt.value"
          :state="sleep === opt.value ? 'selected' : 'unselected'"
          @click="sleep = opt.value"
        >
          {{ opt.value }} {{ opt.label }}
        </AppChip>
      </view>
    </view>

    <!-- 与昨天相比 -->
    <view class="card">
      <text class="record__question">与昨天相比</text>
      <view class="record__chips">
        <AppChip
          v-for="opt in changeOptions"
          :key="opt"
          :state="change === opt ? 'selected' : 'unselected'"
          @click="change = opt"
        >
          {{ opt }}
        </AppChip>
        <AppChip state="skip" @click="change = ''">跳过</AppChip>
      </view>
    </view>

    <!-- 腿部麻木或无力 -->
    <view class="card">
      <text class="record__question">今天有腿部麻木或无力吗？</text>
      <text class="record__question-desc">不会沿用昨天的答案——如果你今天不确定，请选“尚未确认”。</text>
      <view class="record__chips">
        <AppChip
          v-for="opt in legOptions"
          :key="opt"
          :state="leg === opt ? 'selected' : 'unselected'"
          @click="leg = opt"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <!-- 今天做了什么 -->
    <view class="card">
      <text class="record__question">今天做了什么？（可多选）</text>
      <view class="record__chips">
        <AppChip
          v-for="opt in doneOptions"
          :key="opt"
          :state="done.includes(opt) ? 'selected' : 'unselected'"
          @click="toggleDone(opt)"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <!-- 最担心什么 -->
    <view class="card">
      <text class="record__question">今天最担心什么？</text>
      <textarea
        v-model="worry"
        class="record__textarea"
        placeholder="例如：会不会越来越严重 / 要不要换医院…"
        placeholder-class="record__placeholder"
        :maxlength="2000"
      />
    </view>

    <TipBar type="info">
      记录只用于整理你的病程和复诊摘要；变化图不会把某一次疼痛上升解读为影像恶化。
    </TipBar>

    <AppButton block @click="onSave">保存记录</AppButton>
    <text class="record__save-update" @click="onSave(true)">保存并更新“当前情况”（症状有新变化时）</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, addSymptomLog, createEpisode, checkSafety } from '@/api';

const today = new Date().toISOString().slice(0, 10);
const sitOptions = ['<15分钟', '15-30', '30-60', '>60分钟'];
const activityOptions = ['能', '部分', '不能'];
const sleepOptions = [
  { value: 0, label: '没影响' },
  { value: 1, label: '偶尔醒' },
  { value: 2, label: '常醒' },
  { value: 3, label: '几乎没睡' },
];
const changeOptions = ['加重', '差不多', '减轻'];
const legOptions = ['有', '没有', '尚未确认'];
const doneOptions = ['步行', '热敷', '按医嘱用药', '休息', '康复练习', '工作/久坐', '其他'];

const sitMinutes = ref('');
const activity = ref('');
const sleep = ref<number | null>(null);
const change = ref('');
const leg = ref('');
const done = ref<string[]>([]);
const worry = ref('');

function toggleDone(opt: string) {
  const idx = done.value.indexOf(opt);
  if (idx >= 0) done.value.splice(idx, 1);
  else done.value.push(opt);
}

function goBack() {
  uni.navigateBack();
}

/** 把“能坐多久”的选项映射为分钟数（取区间中值，>60 记为 90） */
function sitMinutesToNumber(opt: string): number | undefined {
  if (!opt) return undefined;
  if (opt === '<15分钟') return 10;
  if (opt === '15-30') return 22;
  if (opt === '30-60') return 45;
  if (opt === '>60分钟') return 90;
  const n = parseInt(opt, 10);
  return Number.isNaN(n) ? undefined : n;
}

async function onSave(updateCurrent = false) {
  // 红旗预检：最担心什么 / 腿部症状等字段含红旗内容时优先提示就医
  const worryText = worry.value.trim();
  if (worryText) {
    try {
      const safety = await checkSafety(worryText, 'record');
      if (!safety.passed && safety.redFlags.length > 0) {
        uni.showModal({
          title: '需要及时寻求专业帮助',
          content: safety.redFlags.map((r) => r.message).join(''),
          showCancel: false,
          success: () => {
            uni.navigateTo({ url: '/pages/redflag/index' });
          },
        });
        return;
      }
    } catch {
      // 预检失败不阻断保存
    }
  }
  try {
    let episodes = await listEpisodes();
    if (episodes.length === 0) {
      // 自动创建病程，不阻断记录
      const ep = await createEpisode('腰痛', undefined, '尚未确认');
      episodes = [{ id: ep.id, title: '腰痛', onsetDate: null, onsetCertainty: '尚未确认', status: 'active' }];
    }
    await addSymptomLog(episodes[0].id, {
      occurredAt: new Date().toISOString(),
      sitMinutes: sitMinutesToNumber(sitMinutes.value),
      plannedActivityDone: activity.value || undefined,
      sleepImpact: sleep.value ?? undefined,
      topWorry: worry.value || undefined,
      legChange: leg.value || undefined,
      changeVsYesterday: change.value || undefined,
      activitiesDone: done.value.join('、') || undefined,
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    if (updateCurrent) {
      setTimeout(() => uni.navigateBack(), 1000);
    }
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}
</script>

<style scoped>
.record {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.record__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.record__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.record__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.record__duration {
  font-size: 12px;
  color: var(--text-3);
}
.record__info {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.record__info-icon { flex-shrink: 0; }
.record__info-text {
  font-size: 12px;
  color: var(--text-2);
  flex: 1;
  line-height: 1.5;
}
.record__question {
  font-size: 15px;
  font-weight: 500;
  display: block;
  margin-bottom: 12px;
}
.record__question-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: -8px;
  margin-bottom: 12px;
  line-height: 1.5;
}
.record__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.record__textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
}
.record__placeholder {
  color: var(--text-3);
}
.record__save-update {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 16px;
  min-height: 44px;
  line-height: 44px;
}
</style>
