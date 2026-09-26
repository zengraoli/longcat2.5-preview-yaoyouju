<template>
  <div class="followup-page">
    <div class="page-head">
      <h1 class="page-title">复诊准备</h1>
      <button class="icon-btn" aria-label="分享" @click="copyText">
        <img src="@/assets/icons/ic_share.png" alt="分享" />
      </button>
    </div>

    <div class="tab-bar">
      <button class="tab" :class="{ active: activeTab === 'summary' }" @click="activeTab = 'summary'">一页交接摘要</button>
      <button class="tab" :class="{ active: activeTab === 'questions' }" @click="activeTab = 'questions'">问题清单 ({{ questions.length }})</button>
      <button class="tab" :class="{ active: activeTab === 'bring' }" @click="activeTab = 'bring'">带什么</button>
    </div>

    <div class="followup-layout" v-if="activeTab === 'summary'">
      <div class="editor-side">
        <div class="card" v-if="loading">加载中...</div>
        <template v-else>
          <section class="summary-card">
            <h2 class="summary-title">复诊交接摘要</h2>
            <p class="summary-meta">生成于 {{ formatDate(generatedAt) }} · 由用户自述与报告原文整理 · 未经医生核实</p>
            <hr class="divider" />

            <div class="section-block">
              <div class="block-head">
                <h3 class="block-title">本次发作起点</h3>
                <button class="link-btn">✏️ 纠正</button>
              </div>
              <p class="block-text">{{ onsetText }}</p>
              <div class="tag-row">
                <span class="tag tag-source">自述</span>
                <span class="tag tag-warn">日期尚未确认</span>
              </div>
            </div>

            <div class="section-block">
              <div class="block-head">
                <h3 class="block-title">主要症状与变化</h3>
                <button class="link-btn">✏️ 纠正</button>
              </div>
              <p class="block-text">{{ chiefText }}</p>
              <div class="tag-row">
                <span class="tag tag-source">自述 · {{ symptomCount }} 条记录</span>
                <span class="tag tag-warn">腿部无力：尚未确认</span>
              </div>
            </div>

            <div class="section-block">
              <div class="block-head">
                <h3 class="block-title">相关检查原文</h3>
                <button class="link-btn">✏️ 纠正</button>
              </div>
              <div class="report-item" v-for="(r, idx) in sections.examinationFindings?.reports || []" :key="idx">
                <p class="block-text">{{ r.date }} 腰椎 MRI：“{{ r.text }}”</p>
              </div>
              <div class="tag-row">
                <span class="tag tag-info">报告原文</span>
                <span class="tag tag-error">与自述侧别不一致</span>
              </div>
            </div>

            <div class="section-block">
              <div class="block-head">
                <h3 class="block-title">已经接受的专业建议</h3>
                <button class="link-btn">✏️ 纠正</button>
              </div>
              <p class="block-text" v-for="(r, idx) in sections.diagnosisAndAssessment?.doctorRecords || []" :key="idx">{{ r.text }}</p>
              <div class="tag-row">
                <span class="tag tag-source">自述转述</span>
                <span class="tag tag-warn">未经核实</span>
              </div>
            </div>

            <div class="section-block">
              <div class="block-head">
                <h3 class="block-title">已采取的行动</h3>
                <button class="link-btn">✏️ 纠正</button>
              </div>
              <p class="block-text">{{ actionsText }}</p>
              <div class="tag-row">
                <span class="tag tag-source">自述</span>
              </div>
            </div>

            <div class="section-block">
              <div class="block-head">
                <h3 class="block-title">最希望解决的问题</h3>
                <button class="link-btn">✏️ 纠正</button>
              </div>
              <p class="block-text">{{ questions.join('；') }}</p>
            </div>

            <div class="shield-note">
              <img src="@/assets/icons/ic_shield.png" alt="" />
              <span>本摘要整理已有信息，保留时间来源与未核实项，不含诊断结论。</span>
            </div>
          </section>

          <div class="actions">
            <button class="btn-primary" @click="exportPdf">导出 PDF</button>
            <button class="btn-secondary" @click="copyText">复制文本</button>
          </div>

          <div class="info-alert">
            <img src="@/assets/icons/ic_info.png" alt="" />
            <span>导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。</span>
          </div>
        </template>
      </div>

      <div class="preview-side">
        <div class="a4-preview">
          <div class="a4-header">
            <span class="a4-logo">腰</span>
            <h3>复诊交接摘要</h3>
            <p class="a4-meta">生成于 {{ formatDate(generatedAt) }} · 由用户自述与报告原文整理 · 未经医生核实</p>
          </div>
          <div class="a4-body">
            <div v-for="block in a4Blocks" :key="block.title" class="a4-section">
              <h4>{{ block.title }}</h4>
              <p v-for="(line, i) in block.lines" :key="i">{{ line }}</p>
            </div>
          </div>
          <div class="a4-footer">
            <p>本摘要由 AI 辅助整理，不构成医疗建议 · 腰有据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 问题清单 -->
    <div class="questions-panel" v-else-if="activeTab === 'questions'">
      <div class="card question-card" v-for="(q, idx) in questions" :key="idx">
        <span class="question-num">{{ idx + 1 }}</span>
        <span class="question-text">{{ q }}</span>
        <span class="drag-handle">⋮⋮</span>
      </div>
    </div>

    <!-- 带什么 -->
    <div class="bring-panel" v-else>
      <div class="card">
        <h3 class="panel-title">就诊时可以带上</h3>
        <ul class="bring-list">
          <li v-for="(item, idx) in bringItems" :key="idx">
            <img src="@/assets/icons/ic_check.png" alt="" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../utils/api';
import { parseChangeText, buildChiefText } from '../../utils/chief';

const loading = ref(true);
const activeTab = ref<'summary' | 'questions' | 'bring'>('summary');
const preview = ref<any>(null);
const generatedAt = ref('');
const changeRaw = ref<string | null>(null);
const lastLog = ref<any>(null);
const episode = ref<any>({});

const sections = computed(() => preview.value?.sections ?? {});

const chiefText = computed(() => buildChiefText({
  episode: episode.value,
  change: parseChangeText(changeRaw.value),
  lastLog: lastLog.value,
  analysisUnknown: preview.value?.unknown || [],
}));

const onsetText = computed(() => {
  const onset = sections.value.chiefComplaint?.onsetDate;
  return onset ? `${onset} 开始腰痛（具体日期以记录为准）。` : '症状开始时间尚未确认。可在"当前情况-生成分析"中回答后自动记录。';
});

const actionsText = computed(() => {
  const logs = sections.value.symptomsAndChanges?.recentLogs || [];
  if (logs.length === 0) return '已采取的行动尚未记录。可在"病程-记录今天"中补充。';
  return `最近记录：坐姿约 ${logs[0].sitMinutes ?? '尚未确认'} 分钟；${logs[0].topWorry ? '担心：' + logs[0].topWorry : '未记录担心的事'}。`;
});


const symptomCount = computed(() => sections.value.symptomsAndChanges?.recentLogs?.length ?? 0);

const questions = computed(() => {
  const qs: string[] = [];
  const list = sections.value.questionsForDoctor?.questions ?? [];
  qs.push(...list);
  const unknown = preview.value?.unknown ?? [];
  qs.push(...unknown.map((u: string) => u));
  return qs.slice(0, 6);
});

const bringItems = computed(() => {
  const items = ['已录入的检查报告原文（见“相关检查原文”）', '症状开始时间与最近变化记录（见摘要）'];
  const doctor = sections.value.diagnosisAndAssessment?.doctorRecords ?? [];
  if (doctor.length > 0) items.push('正在使用的药物与既有医嘱');
  return items;
});

const a4Blocks = computed(() => {
  const s = sections.value;
  return [
    {
      title: '本次发作起点',
      lines: [`发病日期：${s.chiefComplaint?.onsetDate || '尚未确认'}`],
    },
    {
      title: '主要症状与变化',
      lines: [chiefText.value],
    },
    {
      title: '相关检查原文',
      lines: (s.examinationFindings?.reports || []).map((r: any) => `[${r.date}] ${r.text}`),
    },
    {
      title: '已经接受的专业建议',
      lines: (s.diagnosisAndAssessment?.doctorRecords || []).map((r: any) => `${r.text}（${r.verifyStatus}）`),
    },
    {
      title: '想问医生的问题',
      lines: questions.value.map((q: string, i: number) => `${i + 1}. ${q}`),
    },
  ].filter((b) => b.lines.length > 0);
});

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

async function exportPdf() {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      await api.exportFollowup(episodes[0].id, 'pdf');
    }
    window.print();
  } catch (e: any) {
    alert(e.message || '导出失败');
  }
}

async function copyText() {
  const text = a4Blocks.value.map((b) => `【${b.title}】\n${b.lines.join('\n')}`).join('\n\n');
  try {
    await navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  } catch {
    alert('复制失败，请手动选择文本');
  }
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      preview.value = await api.previewFollowup(episodes[0].id);
      generatedAt.value = preview.value.generatedAt || new Date().toISOString();
      const latest = await api.getLatestAnalysis(episodes[0].id);
      if (latest.status === 'ok') preview.value.unknown = latest.sections.unknown;
      const events = await api.getTimeline(episodes[0].id);
      const changeEvent = (events || []).find((e: any) => e.event_type === '变化确认');
      changeRaw.value = changeEvent?.raw_text || null;
      const logEvent = (events || []).filter((e: any) => e.event_type === '症状').sort((a: any, b: any) => (b.occurred_at || '').localeCompare(a.occurred_at || ''))[0];
      lastLog.value = logEvent ? { sitMinutes: logEvent.sit_minutes ?? null, topWorry: logEvent.top_worry ?? null, legChange: logEvent.leg_change ?? null } : null;
      episode.value = episodes[0] || {};
    }
  } catch (e) {
    console.error('Failed to load followup preview:', e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.followup-page {
  padding: 0;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn img {
  width: 22px;
  height: 22px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border-radius: 12px;
  padding: 6px;
  margin-bottom: 20px;
  width: fit-content;
}

.tab {
  border: none;
  background: var(--surface);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
}

.tab.active {
  background: #fff;
  box-shadow: 0 1px 3px rgba(27, 34, 48, 0.1);
  color: var(--text-1);
  font-weight: 500;
}

.followup-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 24px;
  align-items: start;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}

.summary-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 20px;
}

.summary-title {
  font-size: 20px;
  font-weight: 600;
}

.summary-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 16px 0 20px;
}

.section-block {
  margin-bottom: 22px;
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.block-title {
  font-size: 15px;
  font-weight: 500;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
}

.block-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-1);
  margin-bottom: 8px;
}

.tag-row {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 3px 8px;
}

.tag-source { background: var(--bg); color: var(--text-2); }
.tag-warn { background: rgba(199, 119, 0, 0.1); color: var(--warn); }
.tag-ok { background: #E5F6EE; color: var(--ok); }
.tag-error { background: rgba(217, 59, 59, 0.08); color: var(--error); }
.tag-info { background: #E7F0FE; color: var(--info); }

.shield-note {
  display: flex;
  gap: 10px;
  align-items: center;
  background: var(--primary-light);
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13px;
  color: var(--primary);
  margin-top: 8px;
}

.shield-note img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.info-alert {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #E7F0FE;
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}

.info-alert img {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* A4 预览 */
.preview-side {
  position: sticky;
  top: 24px;
}

.a4-preview {
  background: var(--surface);
  border-radius: 4px;
  border: 1px solid var(--border);
  padding: 32px;
  font-size: 12px;
}

.a4-header {
  text-align: center;
  border-bottom: 2px solid var(--primary);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.a4-logo {
  display: inline-flex;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 6px;
}

.a4-header h3 {
  font-size: 16px;
}

.a4-meta {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 4px;
}

.a4-section {
  margin-bottom: 14px;
}

.a4-section h4 {
  font-size: 13px;
  margin-bottom: 4px;
  color: var(--primary);
}

.a4-section p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-2);
}

.a4-footer {
  border-top: 1px solid var(--border);
  padding-top: 10px;
  text-align: center;
  font-size: 10px;
  color: var(--text-3);
}

/* 问题清单 */
.questions-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 720px;
}

.question-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
}

.question-num {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.question-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
}

.drag-handle {
  color: var(--text-3);
  cursor: grab;
}

/* 带什么 */
.bring-panel {
  max-width: 720px;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.bring-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bring-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.bring-list img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>
