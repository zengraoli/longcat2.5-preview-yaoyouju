<template>
  <div class="followup-layout">
    <div class="editor-side">
      <h2 class="page-title">复诊摘要预览</h2>
      <div v-if="loading" class="card">加载中...</div>
      <template v-else>
        <section class="card" v-for="(section, key) in sections" :key="key">
          <h3 class="section-title">{{ section.title }}</h3>
          <template v-if="key === 'chiefComplaint'">
            <p>发病日期: {{ section.onsetDate || '尚未确认' }}</p>
            <p v-for="(item, idx) in section.selfReported" :key="idx">- {{ item }}</p>
          </template>
          <template v-else-if="key === 'examinationFindings'">
            <div v-for="(r, idx) in section.reports" :key="idx" class="report-item">
              <span class="report-date">[{{ r.date }}]</span>
              <span>{{ r.text }}</span>
              <span class="tag tag-warn">{{ r.verifyStatus }}</span>
            </div>
          </template>
          <template v-else-if="key === 'diagnosisAndAssessment'">
            <div v-for="(r, idx) in section.doctorRecords" :key="idx" class="report-item">
              <span>{{ r.text }}</span>
              <span class="tag" :class="r.verifyStatus === '已确认' ? 'tag-ok' : 'tag-warn'">{{ r.verifyStatus }}</span>
            </div>
            <p>分析已知: {{ section.latestAnalysis }}</p>
          </template>
          <template v-else-if="key === 'symptomsAndChanges'">
            <div v-for="(log, idx) in section.recentLogs" :key="idx" class="log-item">
              <p>坐{{ log.sitMinutes }}分钟, 担心: {{ log.topWorry }}, 腿部: {{ log.legChange }}</p>
            </div>
          </template>
          <template v-else-if="key === 'concerns'">
            <p v-for="(item, idx) in section.topWorries" :key="idx">- {{ item }}</p>
          </template>
          <template v-else-if="key === 'questionsForDoctor'">
            <ol>
              <li v-for="(q, idx) in section.questions" :key="idx">{{ q }}</li>
            </ol>
          </template>
        </section>
      </template>
    </div>

    <div class="preview-side">
      <h2 class="page-title">打印预览</h2>
      <div class="a4-preview">
        <div class="a4-header">
          <h3>复诊摘要</h3>
          <p class="watermark">腰有据 · 仅供参考</p>
        </div>
        <div class="a4-body" v-if="previewData">
          <div v-for="(section, key) in previewData.sections" :key="key" class="a4-section">
            <h4>{{ section.title }}</h4>
            <p v-if="section.onsetDate">发病日期: {{ section.onsetDate }}</p>
            <p v-for="(item, idx) in section.selfReported || []" :key="'sr'+idx">- {{ item }}</p>
            <p v-for="(r, idx) in section.reports || []" :key="'rp'+idx">[{{ r.date }}] {{ r.text }}</p>
            <p v-for="(q, idx) in section.questions || []" :key="'q'+idx">- {{ q }}</p>
          </div>
        </div>
        <div class="a4-footer">
          <p>生成时间: {{ today }}</p>
          <p>本摘要由 AI 辅助生成，不构成医疗建议</p>
        </div>
      </div>
      <div class="actions">
        <button class="btn-secondary" @click="copyText">复制文本</button>
        <button class="btn-primary" @click="printPdf">打印 / 导出 PDF</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const loading = ref(true);
const sections = ref<Record<string, any>>({});
const previewData = ref<any>(null);
const today = new Date().toISOString().slice(0, 10);

function copyText() {
  let text = '=== 复诊摘要 ===\n\n';
  for (const s of Object.values(sections.value)) {
    const section = s as any;
    text += `【${section.title}】\n`;
    if (section.selfReported) section.selfReported.forEach((t: string) => { text += `- ${t}\n`; });
    if (section.onsetDate) text += `发病日期: ${section.onsetDate}\n`;
    if (section.reports) section.reports.forEach((r: any) => { text += `[${r.date}] ${r.text}\n`; });
    if (section.topWorries) section.topWorries.forEach((t: string) => { text += `- ${t}\n`; });
    if (section.questions) section.questions.forEach((q: string) => { text += `- ${q}\n`; });
    text += '\n';
  }
  navigator.clipboard.writeText(text).then(() => alert('已复制'));
}

function printPdf() {
  window.print();
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) {
      const data = await api.previewFollowup(episodes[0].id);
      sections.value = data.sections || {};
      previewData.value = data;
    }
  } catch (e) {
    console.error('Failed to load followup:', e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.followup-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px 40px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.report-item {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.report-date {
  color: var(--text-3);
  font-size: 11px;
}

.log-item {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 4px;
}

.a4-preview {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 40px;
  min-height: 500px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.a4-header {
  text-align: center;
  border-bottom: 2px solid var(--primary);
  padding-bottom: 16px;
  margin-bottom: 24px;
  position: relative;
}

.a4-header h3 {
  font-size: 18px;
}

.watermark {
  font-size: 10px;
  color: var(--text-3);
}

.a4-section {
  margin-bottom: 20px;
}

.a4-section h4 {
  font-size: 14px;
  color: var(--primary);
  margin-bottom: 8px;
}

.a4-section p {
  font-size: 12px;
  color: var(--text-1);
  margin-bottom: 4px;
}

.a4-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 10px;
  color: var(--text-3);
  text-align: center;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

@media print {
  .editor-side, .actions { display: none; }
  .preview-side { width: 100%; }
  .a4-preview { border: none; box-shadow: none; }
}
</style>
