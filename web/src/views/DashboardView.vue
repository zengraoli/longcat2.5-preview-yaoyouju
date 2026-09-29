<template>
  <AppLayout>
    <div class="dashboard">
      <div class="dashboard__header">
        <div>
          <h1 class="dashboard__title">当前情况</h1>
          <p class="dashboard__subtitle">本次发作 · 第 5 周 · 上次记录：昨天 · 起点约 2026-08 中旬（尚未确认）</p>
        </div>
        <div class="dashboard__header-actions">
          <button class="btn btn--primary" @click="goRecord">✎ 记录今天</button>
          <button class="btn btn--secondary" @click="goReport">⬆ 录入报告</button>
        </div>
      </div>

      <div class="dashboard__grid">
        <!-- 左栏：待确认项 -->
        <div class="dashboard__col">
          <div class="card card--pending">
            <div class="card__pending-title">
              <span>⚠</span>
              <span>有 {{ pending.length }} 项信息尚未确认</span>
            </div>
            <p class="card__pending-desc">
              确认后才会生成新的分析；没有回答的问题会记录为“尚未确认”，不会被当作“没有”。
            </p>
            <div v-for="(item, i) in pending" :key="i" class="pending-item">
              <p class="pending-item__question">{{ i + 1 }}. {{ item.question }}</p>
              <div class="pending-item__options">
                <button
                  v-for="opt in item.options"
                  :key="opt"
                  class="chip"
                  :class="{ 'chip--selected': item.value === opt }"
                  @click="item.value = opt"
                >
                  {{ opt }}
                </button>
              </div>
            </div>
            <button class="btn btn--primary btn--block" @click="onConfirm">确认并更新当前情况</button>
          </div>

          <!-- 为你推荐 -->
          <div class="card">
            <p class="card__section-title">为你推荐（原因：报告提到 L5/S1）</p>
            <div class="recommend">
              <div class="recommend__thumb">▶</div>
              <div class="recommend__body">
                <div class="recommend__title">腰椎节段位置：L5/S1 在哪里</div>
                <div class="recommend__meta">
                  <StatusTag label="已审核 v2" />
                  <span>2:10 · 字幕</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中栏：最新分析 -->
        <div class="dashboard__col">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">最新一页分析</h2>
              <div class="card__header-tags">
                <span class="card__version">v3 · 2026-09-21</span>
                <StatusTag label="不作诊断" />
              </div>
            </div>
            <p class="analysis__intro">
              你上传的报告中提到了 L5/S1；你描述目前腰痛持续约 1 个月且最近加重。报告日期已确认，症状开始日期和是否出现腿部无力还需要确认。
            </p>
            <div v-for="(item, i) in sections.known" :key="`k${i}`" class="analysis__item">
              <StatusTag label="已知" />
              <span class="analysis__text">{{ item.text }}</span>
            </div>
            <div v-for="(item, i) in sections.explained" :key="`e${i}`" class="analysis__item">
              <StatusTag label="解释" />
              <span class="analysis__text">{{ item.text }}</span>
            </div>
            <div v-for="(item, i) in sections.unknown" :key="`u${i}`" class="analysis__item">
              <StatusTag label="未知" />
              <span class="analysis__text">{{ item.text }}</span>
            </div>
            <div v-for="(item, i) in sections.next" :key="`n${i}`" class="analysis__item">
              <StatusTag label="下一步" />
              <span class="analysis__text">{{ item.text }}</span>
            </div>
            <div class="card__actions">
              <button class="btn btn--primary" @click="goAnalysis">查看完整分析与原文对照</button>
              <button class="btn btn--secondary" @click="goQa">继续追问</button>
              <button class="btn btn--secondary" @click="goFollowup">生成复诊摘要</button>
            </div>
          </div>

          <!-- 快捷入口 -->
          <div class="dashboard__quick">
            <div class="quick-card" @click="goRecord">
              <span class="quick-card__icon">✎</span>
              <div class="quick-card__title">记录今天</div>
              <div class="quick-card__desc">约 1 分钟 · 允许跳过</div>
            </div>
            <div class="quick-card" @click="goReport">
              <span class="quick-card__icon">↑</span>
              <div class="quick-card__title">录入报告</div>
              <div class="quick-card__desc">粘贴文字 · 原文对照</div>
            </div>
            <div class="quick-card" @click="goQa">
              <span class="quick-card__icon">💬</span>
              <div class="quick-card__title">问与解释</div>
              <div class="quick-card__desc">基于当前上下文</div>
            </div>
            <div class="quick-card" @click="goFollowup">
              <span class="quick-card__icon">📋</span>
              <div class="quick-card__title">复诊准备</div>
              <div class="quick-card__desc">4 个问题待确认</div>
            </div>
          </div>
        </div>

        <!-- 右栏 -->
        <div class="dashboard__col">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">📅 计划复诊</h2>
            </div>
            <div class="followup__date">2026-10-08（约 17 天后）</div>
            <p class="followup__source">来源：你录入的医嘱“4 周后复查” · 未经核实</p>
            <button class="btn btn--text" @click="goFollowup">修改日期</button>
          </div>

          <div class="card">
            <h2 class="card__title">最近记录</h2>
            <div v-for="(item, i) in recentRecords" :key="i" class="recent-item">
              <div class="recent-item__date">{{ item.date }}</div>
              <div class="recent-item__body">
                <span class="recent-item__dot" :class="`recent-item__dot--${item.tone}`" />
                <span class="recent-item__text">{{ item.text }}</span>
              </div>
            </div>
          </div>

          <TipBar type="error">
            症状突然变化或出现严重信号？无需登录也可查看就医提示。
          </TipBar>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { api } from '@/api/client';
import type { AnalysisResult } from '@/api/types';

const router = useRouter();

const pending = ref([
  { question: '今天有腿部麻木或无力吗？', options: ['有', '没有', '尚未确认'], value: '' },
  { question: '报告写“右侧”，你的描述是“左侧”，以你的症状为准？', options: ['左侧', '右侧', '都有 / 不确定'], value: '' },
  { question: '与上次相比，症状有变化？', options: ['加重', '差不多', '减轻', '尚未确认'], value: '' },
]);

interface Sections {
  known: Array<{ text: string; source: string | null }>;
  explained: Array<{ text: string; source: string | null }>;
  unknown: Array<{ text: string; source: string | null }>;
  next: Array<{ text: string; source: string | null }>;
}

const analysis = ref<AnalysisResult>({
  id: '',
  episodeId: '',
  version: 3,
  modelReleaseId: 'release-1',
  sections: {
    已知: [{ text: '报告（2026-08-30）提到 L5/S1 椎间盘向后突出、硬膜囊受压；腰痛约 1 个月，最近一周加重，主要在左侧。', source: '报告' }],
    解释: [{ text: '影像上的突出与疼痛不是一一对应的关系；“硬膜囊受压”是影像描述，不等于严重程度。', source: 'doc-science-1' }],
    未知: [{ text: '症状开始日期、是否腿部无力、报告“右侧”与你描述“左侧”是否一致。', source: null }],
    下一步: [{ text: '把 4 个问题带去复诊；每天记录能坐时长与夜间痛醒次数。', source: null }],
    视频: [],
  },
  retrievalSnapshot: { evidenceDocs: [], modelRelease: 'release-1', contentLibVersion: 'content-c1', rulesetVersion: 'RF-v1' },
  safetyFlag: '通过',
  createdAt: '',
  citations: [],
});

const sections = ref<Sections>({
  known: [],
  explained: [],
  unknown: [],
  next: [],
});

const recentRecords = ref([
  { date: '昨天', tone: 'ok', text: '症状记录 · 加重 · 能坐约 30 分钟' },
  { date: '09-18', tone: 'info', text: '一页分析 v2 生成' },
  { date: '09-10', tone: 'warn', text: '医生建议：保守治疗 4 周后复查（未核实）' },
  { date: '08-30', tone: 'info', text: 'MRI 报告已录入' },
]);

function goRecord() {
  router.push({ name: 'timeline' });
}
function goReport() {
  router.push({ name: 'timeline' });
}
function goAnalysis() {
  router.push({ name: 'analysis' });
}
function goQa() {
  router.push({ name: 'qa' });
}
function goFollowup() {
  router.push({ name: 'followup' });
}

function onConfirm() {
  alert('已确认并更新当前情况（演示）');
}

onMounted(async () => {
  try {
    const episodes = await api.get<{ id: string }[]>('/episodes');
    if (episodes.length > 0) {
      const latest = await api.get<AnalysisResult | null>(`/analyses/episodes/${episodes[0].id}/latest`);
      if (latest) {
        analysis.value = latest;
        sections.value = {
          known: latest.sections.已知,
          explained: latest.sections.解释,
          unknown: latest.sections.未知,
          next: latest.sections.下一步,
        };
      }
    }
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.dashboard__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.dashboard__subtitle {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.dashboard__header-actions {
  display: flex;
  gap: 10px;
}
.dashboard__grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 16px;
  align-items: start;
}
.dashboard__col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.card--pending {
  background: rgba(199, 119, 0, 0.06);
}
.card__pending-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
  color: var(--warn);
  margin-bottom: 8px;
}
.card__pending-desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 0 0 16px;
}
.pending-item {
  margin-bottom: 16px;
}
.pending-item__question {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px;
}
.pending-item__options {
  display: flex;
  gap: 8px;
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
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px;
}
.card__header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card__version {
  font-size: 12px;
  color: var(--text-3);
}
.card__section-title {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 12px;
}
.card__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.analysis__intro {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-1);
  margin: 0 0 16px;
}
.analysis__item {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: flex-start;
}
.analysis__text {
  font-size: 14px;
  flex: 1;
  line-height: 1.5;
}
.recommend {
  display: flex;
  gap: 12px;
}
.recommend__thumb {
  width: 72px;
  height: 54px;
  border-radius: 8px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-size: 18px;
  flex-shrink: 0;
}
.recommend__title {
  font-size: 14px;
  font-weight: 500;
}
.recommend__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}
.dashboard__quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.quick-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
}
.quick-card__icon {
  font-size: 20px;
  color: var(--primary);
}
.quick-card__title {
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
}
.quick-card__desc {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.followup__date {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 4px;
}
.followup__source {
  font-size: 12px;
  color: var(--text-2);
  margin: 0 0 8px;
}
.recent-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.recent-item__date {
  font-size: 12px;
  color: var(--text-3);
  width: 48px;
  flex-shrink: 0;
}
.recent-item__body {
  display: flex;
  gap: 8px;
  flex: 1;
}
.recent-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
.recent-item__dot--ok { background: var(--ok); }
.recent-item__dot--info { background: var(--info); }
.recent-item__dot--warn { background: var(--warn); }
.recent-item__text {
  font-size: 13px;
  line-height: 1.5;
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
.btn--primary {
  background: var(--primary);
  color: #fff;
}
.btn--secondary {
  background: var(--surface);
  color: var(--primary);
  border: 1px solid var(--primary);
}
.btn--block {
  width: 100%;
}
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
}
</style>
