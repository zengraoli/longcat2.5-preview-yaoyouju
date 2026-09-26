<template>
  <div class="dashboard">
    <div class="page-head">
      <div>
        <h1 class="page-title">当前情况</h1>
        <p class="page-subtitle">{{ episodeSubtitle }}</p>
      </div>
      <div class="page-actions">
        <button class="btn-primary" @click="goTimeline">记录今天</button>
        <button class="btn-secondary" @click="showReportModal = true">录入报告</button>
      </div>
    </div>

    <div class="columns">
      <!-- 左栏：待确认项 -->
      <section class="col">
        <div class="card pending-card">
          <div class="pending-head">
            <img src="@/assets/icons/ic_warn.png" alt="" />
            <span>有 {{ pendingQuestions.length }} 项信息尚未确认</span>
          </div>
          <p class="pending-desc">确认后才会生成新的分析；没有回答的问题会记录为“尚未确认”，不会被当作“没有”。</p>
          <div class="pending-item" v-for="(q, i) in pendingQuestions" :key="i">
            <p class="pending-q">{{ q }}</p>
            <div class="chip-row">
              <button
                v-for="opt in ['是', '否', '尚未确认']"
                :key="opt"
                class="chip"
                :class="{ selected: pendingAnswers[i] === opt }"
                @click="pendingAnswers[i] = opt"
              >
                {{ opt }}
              </button>
            </div>
          </div>
          <button class="btn-primary btn-block" @click="confirmPending">确认并更新当前情况</button>
        </div>
      </section>

      <!-- 中栏：最新一页分析 -->
      <section class="col">
        <div class="card">
          <div class="card-head">
            <span class="card-title">最新一页分析</span>
            <div class="head-tags">
              <span class="tag-version">v{{ analysis?.version }} · {{ formatDate(analysis?.createdAt) }}</span>
              <span class="tag-nodiag">不作诊断</span>
            </div>
          </div>
          <p class="analysis-intro" v-if="analysis">{{ analysisIntro }}</p>

          <div class="analysis-rows" v-if="analysis">
            <div class="analysis-row" v-if="analysis.sections.known.length">
              <span class="row-tag tag-known">已知</span>
              <span class="row-text">{{ analysis.sections.known.join('；') }}</span>
            </div>
            <div class="analysis-row" v-if="analysis.sections.explanation.length">
              <span class="row-tag tag-exp">解释</span>
              <span class="row-text">{{ analysis.sections.explanation.map((e) => e.text).join('；') }}</span>
            </div>
            <div class="analysis-row" v-if="analysis.sections.unknown.length">
              <span class="row-tag tag-unknown">未知</span>
              <span class="row-text">{{ analysis.sections.unknown.join('；') }}</span>
            </div>
            <div class="analysis-row" v-if="analysis.sections.nextSteps.length">
              <span class="row-tag tag-next">下一步</span>
              <span class="row-text">{{ analysis.sections.nextSteps.join('；') }}</span>
            </div>
          </div>

          <div class="analysis-actions" v-if="analysis">
            <button class="btn-primary" @click="goAnalysis">查看完整分析与原文对照</button>
            <button class="btn-secondary" @click="goQa">继续追问</button>
            <button class="btn-secondary" @click="goFollowup">生成复诊摘要</button>
          </div>
        </div>
      </section>

      <!-- 右栏：计划复诊 + 最近记录 -->
      <section class="col">
        <div class="card plan-card" v-if="planDate">
          <div class="plan-head">
            <img src="@/assets/icons/ic_calendar.png" alt="" />
            <span>计划复诊</span>
          </div>
          <p class="plan-date">{{ planDate }}（约 {{ planDays }} 天后）</p>
          <p class="plan-source">来源：按最近记录推算 · 未经核实</p>
          <button class="link-btn" @click="goFollowup">修改日期</button>
        </div>

        <div class="card">
          <div class="card-head">
            <span class="card-title">最近记录</span>
          </div>
          <ul class="record-list">
            <li class="record-item" v-for="rec in recentRecords" :key="rec.id">
              <span class="record-date">{{ formatDate(rec.date) }}</span>
              <span class="record-dot" :style="{ background: rec.color }"></span>
              <span class="record-text">{{ rec.text }}</span>
            </li>
          </ul>
        </div>

        <div class="emergency-bar">
          <img src="@/assets/icons/ic_warn.png" alt="" />
          <span>症状突然变化或出现严重信号？无需登录也可查看就医提示。</span>
        </div>
      </section>
    </div>

    <!-- 底部：推荐 + 快捷入口 -->
    <div class="bottom-row">
      <div class="card recommend-card" v-if="recommend">
        <p class="recommend-reason">为你推荐（{{ recommendReason }}）</p>
        <div class="recommend-body">
          <div class="recommend-thumb">
            <img src="@/assets/icons/ic_play.png" alt="" />
          </div>
          <div class="recommend-info">
            <p class="recommend-title">{{ recommend.title }}</p>
            <p class="recommend-meta">{{ recommend.type }} · 已审核 · 含字幕与文字替代</p>
          </div>
        </div>
      </div>

      <div class="quick-grid">
        <div class="quick-card" @click="goTimeline">
          <img src="@/assets/icons/ic_pen.png" alt="" />
          <span class="quick-title">记录今天</span>
          <span class="quick-desc">约 1 分钟 · 允许跳过</span>
        </div>
        <div class="quick-card" @click="showReportModal = true">
          <img src="@/assets/icons/ic_upload.png" alt="" />
          <span class="quick-title">录入报告</span>
          <span class="quick-desc">粘贴文字 · 原文对照</span>
        </div>
        <div class="quick-card" @click="goQa">
          <img src="@/assets/icons/ic_chat.png" alt="" />
          <span class="quick-title">问与解释</span>
          <span class="quick-desc">基于当前上下文</span>
        </div>
        <div class="quick-card" @click="goFollowup">
          <img src="@/assets/icons/ic_doc.png" alt="" />
          <span class="quick-title">复诊准备</span>
          <span class="quick-desc">{{ pendingQuestions.length }} 个问题待确认</span>
        </div>
      </div>
    </div>

    <!-- 录入报告弹窗 -->
    <div v-if="showReportModal" class="modal-mask" @click.self="showReportModal = false">
      <div class="modal-card">
        <h3 class="modal-title">录入报告与医嘱</h3>
        <p class="modal-subtitle">粘贴报告原文，用于对照解释；可跳过。</p>
        <textarea v-model="reportText" class="modal-textarea" placeholder="请粘贴检查报告或医嘱的文字内容"></textarea>
        <div class="modal-row">
          <label>报告日期</label>
          <input v-model="reportDate" type="date" />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showReportModal = false">取消</button>
          <button class="btn-primary" :disabled="!reportText.trim() || !reportDate" @click="submitReport">保存报告</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../utils/api';
import type { Episode, Analysis, CareEvent, ContentItem } from '../../types';

const router = useRouter();

const episodes = ref<Episode[]>([]);
const analysis = ref<Analysis | null>(null);
const records = ref<{ id: string; date: string; text: string; color: string }[]>([]);
const recommend = ref<ContentItem | null>(null);
const recommendReason = ref('');
const pendingAnswers = ref<Record<number, string>>({});

const showReportModal = ref(false);
const reportText = ref('');
const reportDate = ref('');

const DOT_COLORS: Record<string, string> = {
  报告原文: '#2F6FD8',
  自述: '#1E9E5A',
  医生记录: '#C77700',
};

const pendingQuestions = computed(() => analysis.value?.sections.unknown ?? []);

const episodeSubtitle = computed(() => {
  const ep = episodes.value[0];
  if (!ep) return '暂无病程数据';
  const onset = ep.onset_date;
  const start = onset ? onset.slice(0, 7) : '起点尚未确认';
  const last = records.value[0]?.date ?? '暂无';
  return `本次发作 · 起点约 ${start}（${ep.onset_certainty}） · 上次记录：${last}`;
});

const analysisIntro = computed(() => {
  const a = analysis.value;
  if (!a) return '';
  return `你上传的报告中提到了 ${a.sections.known.join('、') || '尚未确认'}；你描述目前的情况与最近变化见下。报告日期已确认，症状开始日期和是否出现腿部无力还需要确认。下面先解释报告术语，再整理复诊时需要确认的问题。`;
});

const planDate = computed(() => {
  const latest = records.value[0]?.date;
  if (!latest) return '';
  const d = new Date(latest);
  d.setDate(d.getDate() + 28);
  return d.toISOString().slice(0, 10);
});

const planDays = computed(() => {
  const latest = records.value[0]?.date;
  if (!latest) return 0;
  return Math.max(0, Math.round((new Date(planDate.value).getTime() - new Date(latest).getTime()) / 86400000));
});

const recentRecords = computed(() => {
  return records.value.slice(0, 5).map((r) => ({ ...r }));
});

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

function mapRecord(ev: CareEvent) {
  const label =
    ev.event_type === '报告' ? '检查报告已录入' :
    ev.event_type === '症状' ? `症状记录 · ${ev.raw_text?.slice(0, 24) ?? ''}` :
    ev.event_type === '分析' ? '一页分析已生成' :
    ev.event_type === '医嘱' ? ev.raw_text?.slice(0, 24) ?? '医生建议' :
    ev.raw_text?.slice(0, 24) || ev.event_type;
  return {
    id: ev.id,
    date: ev.occurred_at,
    text: label,
    color: DOT_COLORS[ev.source_type] || '#0F6E74',
  };
}

function goTimeline() { router.push('/timeline'); }
function goAnalysis() { router.push('/analysis/latest'); }
function goQa() { router.push('/qa'); }
function goFollowup() { router.push('/followup'); }

function confirmPending() {
  const answered = Object.keys(pendingAnswers.value).length;
  alert(answered > 0 ? `已更新 ${answered} 项确认，将用于生成新的分析。` : '请先选择各项的确认结果。');
  pendingAnswers.value = {};
}

async function submitReport() {
  try {
    const episodeId = episodes.value[0]?.id;
    if (!episodeId) return;
    const ev = await api.createCareEvent({
      episodeId,
      eventType: '报告',
      occurredAt: new Date(reportDate.value).toISOString(),
      sourceType: '报告原文',
      rawText: reportText.value,
    });
    await api.createReport({
      careEventId: ev.id,
      reportDate: reportDate.value,
      rawText: reportText.value,
      sourceType: '报告原文',
    });
    showReportModal.value = false;
    reportText.value = '';
    await loadData();
    alert('报告已保存，可在“病程”中核对。');
  } catch (e: any) {
    alert(e.message || '保存失败');
  }
}

async function loadData() {
  try {
    episodes.value = await api.getEpisodes();
    const episodeId = episodes.value[0]?.id;
    if (episodeId) {
      const latest = await api.getLatestAnalysis(episodeId);
      if (latest.status === 'ok') analysis.value = latest as unknown as Analysis;
      const events = await api.getCareEvents(episodeId);
      records.value = (events || []).map(mapRecord);
    }
    recommend.value = (await api.getPublishedContents())[0] || null;
    recommendReason.value = '原因：你的报告提到 L5/S1、硬膜囊受压';
  } catch (e) {
    console.error('Failed to load dashboard:', e);
  }
}

onMounted(loadData);
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-3);
  margin-top: 4px;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  background: var(--surface);
  color: var(--primary);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-block {
  width: 100%;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
}

.head-tags {
  display: flex;
  gap: 8px;
}

.tag-version {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  border-radius: 4px;
  padding: 3px 8px;
}

.tag-nodiag {
  font-size: 12px;
  color: var(--error);
  background: rgba(217, 59, 59, 0.08);
  border-radius: 4px;
  padding: 3px 8px;
}

.analysis-intro {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 16px;
}

.analysis-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.analysis-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.row-tag {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  padding: 2px 8px;
  margin-top: 1px;
}

.tag-known { background: var(--primary); color: #fff; }
.tag-exp { background: #E7F0FE; color: var(--info); }
.tag-unknown { background: rgba(199, 119, 0, 0.1); color: var(--warn); }
.tag-next { background: #E5F6EE; color: var(--ok); }

.row-text {
  font-size: 14px;
  color: var(--text-1);
  line-height: 1.6;
}

.analysis-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 待确认 */
.pending-card {
  background: #FDF6E3;
}

.pending-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
  color: var(--warn);
}

.pending-head img {
  width: 22px;
  height: 22px;
}

.pending-desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin: 10px 0 16px;
}

.pending-item {
  margin-bottom: 14px;
}

.pending-q {
  font-size: 14px;
  color: var(--text-1);
  margin-bottom: 8px;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  padding: 6px 16px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}

.chip.selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

/* 计划复诊 */
.plan-card {
  text-align: left;
}

.plan-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.plan-head img {
  width: 22px;
  height: 22px;
}

.plan-date {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary);
}

.plan-source {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 8px 0 0;
}

/* 最近记录 */
.record-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 13px;
}

.record-date {
  color: var(--text-3);
  flex-shrink: 0;
  width: 40px;
}

.record-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  align-self: center;
}

.record-text {
  color: var(--text-1);
}

.emergency-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  background: rgba(217, 59, 59, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 13px;
  color: var(--error);
  font-weight: 500;
}

.emergency-bar img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 底部 */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.recommend-reason {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 12px;
}

.recommend-body {
  display: flex;
  gap: 16px;
  align-items: center;
}

.recommend-thumb {
  width: 72px;
  height: 56px;
  border-radius: 8px;
  background: #DDE5EA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recommend-thumb img {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
  background: var(--primary);
  border-radius: 6px;
  padding: 4px;
}

.recommend-title {
  font-size: 15px;
  font-weight: 500;
}

.recommend-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.quick-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-card:hover {
  outline: 1px solid var(--primary);
}

.quick-card img {
  width: 24px;
  height: 24px;
  margin-bottom: 8px;
}

.quick-title {
  font-size: 15px;
  font-weight: 500;
}

.quick-desc {
  font-size: 12px;
  color: var(--text-3);
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(27, 34, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  width: 520px;
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
}

.modal-title {
  font-size: 17px;
  font-weight: 500;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--text-3);
  margin: 6px 0 16px;
}

.modal-textarea {
  width: 100%;
  height: 140px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 12px;
}

.modal-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-2);
}

.modal-row input {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
