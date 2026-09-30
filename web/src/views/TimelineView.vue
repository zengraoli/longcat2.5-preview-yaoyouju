<template>
  <AppLayout>
    <div class="timeline-page">
      <div class="timeline-page__header">
        <div>
          <h1 class="timeline-page__title">病程</h1>
          <p class="timeline-page__meta">本次发作 · 起点约 2026-08 中旬（自述，具体日期尚未确认）· 12 条记录 · 1 份报告 · 3 次分析</p>
        </div>
        <div class="timeline-page__actions">
          <button class="btn btn--secondary">▽ 筛选</button>
          <button class="btn btn--primary">＋ 新增事件</button>
        </div>
      </div>

      <!-- 最近 14 天 -->
      <div class="card">
        <div class="card__header">
          <div class="card__title">最近 14 天 · 每天能坐多久（分钟）</div>
          <span class="card__tag">来自你的记录</span>
        </div>
        <div class="chart">
          <div
            v-for="(v, i) in chartData"
            :key="i"
            class="chart__bar"
            :class="{ 'chart__bar--warn': v.warn }"
            :style="{ height: `${v.height}%` }"
          />
        </div>
        <div class="chart__labels">
          <span v-for="d in chartLabels" :key="d">{{ d }}</span>
        </div>
        <p class="chart__disclaimer">图中变化只反映你的记录，缺失日留空；不代表影像变化或病情恶化。</p>
      </div>

      <div class="timeline-page__grid">
        <!-- 左：时间线 -->
        <div class="timeline-page__main">
          <div class="section-title">记录（按事件，保留来源与核实状态）</div>
          <div class="timeline">
            <div v-for="(event, i) in events" :key="i" class="timeline__event">
              <div class="timeline__rail">
                <div class="timeline__dot" :class="`timeline__dot--${event.tone}`" />
                <div v-if="i < events.length - 1" class="timeline__line" />
              </div>
              <div class="timeline__card">
                <div class="timeline__header">
                  <span class="timeline__date">{{ event.date }}</span>
                  <span class="timeline__type" :class="`timeline__type--${event.tone}`">{{ event.type }}</span>
                  <span class="timeline__more">⋯</span>
                </div>
                <p class="timeline__text">{{ event.text }}</p>
                <div class="timeline__tags">
                  <StatusTag v-for="(tag, ti) in event.tags" :key="ti" :label="tag" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：记录今天 -->
        <div class="timeline-page__side">
          <div class="card">
            <div class="card__header">
              <div class="card__title">记录今天</div>
              <span class="card__tag">🕐 约 1 分钟 · 可跳过</span>
            </div>

            <div class="record__question">今天能坐多久？</div>
            <div class="record__chips">
              <button
                v-for="opt in sitOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': sitMinutes === opt }"
                @click="sitMinutes = opt"
              >
                {{ opt }}
              </button>
              <button class="chip chip--skip" @click="sitMinutes = ''">跳过</button>
            </div>

            <div class="record__question">能否完成原本计划的活动？</div>
            <div class="record__chips">
              <button
                v-for="opt in activityOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': activity === opt }"
                @click="activity = opt"
              >
                {{ opt }}
              </button>
              <button class="chip chip--skip" @click="activity = ''">跳过</button>
            </div>

            <div class="record__question">与昨天相比</div>
            <div class="record__chips">
              <button
                v-for="opt in changeOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': change === opt }"
                @click="change = opt"
              >
                {{ opt }}
              </button>
              <button class="chip chip--skip" @click="change = ''">跳过</button>
            </div>

            <div class="record__question">今天有腿部麻木或无力吗？</div>
            <p class="record__desc">不会沿用昨天的答案；不确定请选“尚未确认”。</p>
            <div class="record__chips">
              <button
                v-for="opt in legOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': leg === opt }"
                @click="leg = opt"
              >
                {{ opt }}
              </button>
            </div>

            <div class="record__question">今天做了什么？（可多选）</div>
            <div class="record__chips">
              <button
                v-for="opt in doneOptions"
                :key="opt"
                class="chip"
                :class="{ 'chip--selected': done.includes(opt) }"
                @click="toggleDone(opt)"
              >
                {{ opt }}
              </button>
            </div>

            <div class="record__question">今天最担心什么？</div>
            <textarea
              v-model="worry"
              class="record__textarea"
              placeholder="例如：会不会越来越严重…"
              :maxlength="2000"
            />

            <button class="btn btn--primary btn--block" @click="() => onSave()">保存记录</button>
            <button class="btn btn--text" @click="() => onSave(true)">保存并更新“当前情况”</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { toast } from "@/utils/toast";
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { api } from '@/api/client';

const sitOptions = ['<15分钟', '15-30', '30-60', '>60分钟'];
const activityOptions = ['能', '部分', '不能'];
const changeOptions = ['加重', '差不多', '减轻'];
const legOptions = ['有', '没有', '尚未确认'];
const doneOptions = ['步行', '热敷', '按医嘱用药', '休息', '康复练习', '工作/久坐', '其他'];

const sitMinutes = ref('');
const activity = ref('');
const change = ref('');
const leg = ref('');
const done = ref<string[]>([]);
const worry = ref('');

const chartData = ref(
  Array.from({ length: 14 }, (_, i) => ({
    height: 30 + Math.round(Math.abs(Math.sin(i * 1.7)) * 60),
    warn: i >= 11,
  })),
);
const chartLabels = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

const events = ref([
  { date: '2026-09-21 · 今天', type: '症状记录', tone: 'ok', text: '与上周相比加重；能坐约 30 分钟；夜间痛醒 1 次；今天最担心“会不会越来越严重”。', tags: ['自述', '腿部无力：尚未确认'] },
  { date: '2026-09-18', type: '一页分析 v2', tone: 'info', text: '生成于模型 M-2609；使用报告 2026-08-30 与 9 条症状记录。', tags: ['系统生成', '可查看当时版本'] },
  { date: '2026-09-10', type: '医生建议', tone: 'warn', text: '医生建议保守治疗，4 周后复查。', tags: ['自述转述', '未经核实'] },
  { date: '2026-08-30', type: '检查报告', tone: 'info', text: '腰椎 MRI：L5/S1 椎间盘向后突出，相应硬膜囊受压…', tags: ['报告原文', '已录入'] },
  { date: '约 2026-08-15', type: '症状开始', tone: 'warn', text: '腰痛开始，起初以久坐后酸痛为主。', tags: ['自述', '日期尚未确认'] },
]);

function toggleDone(opt: string) {
  const idx = done.value.indexOf(opt);
  if (idx >= 0) done.value.splice(idx, 1);
  else done.value.push(opt);
}

function onSave(updateCurrent = false) {
  toast(updateCurrent ? '已保存并更新当前情况（演示）' : '已保存记录（演示）');
}

onMounted(async () => {
  try {
    const episodes = await api.get<{ id: string }[]>('/episodes');
    if (episodes.length > 0) {
      await api.get<unknown>(`/episodes/${episodes[0].id}/timeline`);
    }
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.timeline-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.timeline-page__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.timeline-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.timeline-page__actions {
  display: flex;
  gap: 10px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
}
.card__tag {
  font-size: 12px;
  color: var(--text-3);
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 120px;
  margin-bottom: 8px;
}
.chart__bar {
  flex: 1;
  background: var(--primary);
  border-radius: 4px 4px 0 0;
  min-height: 8px;
}
.chart__bar--warn {
  background: var(--warn);
}
.chart__labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 12px;
}
.chart__disclaimer {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 0;
}
.timeline-page__grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}
.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px;
}
.timeline__event {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.timeline__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}
.timeline__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.timeline__dot--ok { border-color: var(--ok); background: var(--ok); }
.timeline__dot--info { border-color: var(--info); background: var(--info); }
.timeline__dot--warn { border-color: var(--warn); background: var(--warn); }
.timeline__line {
  flex: 1;
  width: 2px;
  background: var(--border);
  margin: 4px 0;
}
.timeline__card {
  flex: 1;
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
}
.timeline__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.timeline__date {
  font-size: 13px;
  color: var(--text-2);
  flex: 1;
}
.timeline__type {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
}
.timeline__type--ok { color: var(--ok); background: rgba(30, 158, 90, 0.1); }
.timeline__type--info { color: var(--info); background: rgba(47, 111, 216, 0.1); }
.timeline__type--warn { color: var(--warn); background: rgba(199, 119, 0, 0.1); }
.timeline__more { color: var(--text-3); }
.timeline__text {
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 8px;
}
.timeline__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.record__question {
  font-size: 14px;
  font-weight: 500;
  margin: 16px 0 8px;
}
.record__question:first-child {
  margin-top: 0;
}
.record__desc {
  font-size: 12px;
  color: var(--text-2);
  margin: -4px 0 8px;
  line-height: 1.5;
}
.record__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.record__textarea {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
  outline: none;
  font-family: inherit;
}
.record__textarea:focus {
  border-color: var(--primary);
}
.chip {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 13px;
  cursor: pointer;
}
.chip--selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.chip--skip {
  background: transparent;
  border-color: transparent;
  color: var(--text-3);
}
.btn {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn--primary { background: var(--primary); color: #fff; }
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
.btn--block { width: 100%; margin-top: 16px; }
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  margin-top: 8px;
  width: 100%;
}
</style>
