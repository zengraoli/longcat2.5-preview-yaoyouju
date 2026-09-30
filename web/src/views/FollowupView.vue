<template>
  <AppLayout>
    <div class="followup-page">
      <div class="followup-page__header">
        <div>
          <h1 class="followup-page__title">复诊准备</h1>
          <p class="followup-page__meta">一页交接摘要由你的记录与报告原文整理，保留来源与未核实项；预览后由你自主导出</p>
        </div>
        <div class="followup-page__actions">
          <button class="btn btn--primary" @click="onExport('PDF')">导出 PDF</button>
          <button class="btn btn--secondary" @click="onPrint">打印</button>
          <button class="btn btn--secondary" @click="onExport('文本')">⧉ 复制文本</button>
        </div>
      </div>

      <div class="followup-page__grid">
        <!-- 左：编辑摘要 -->
        <div class="followup-page__main">
          <p class="followup-page__edit-hint">编辑摘要（每段可纠正，纠正后重新生成）</p>

          <div class="card" v-for="section in sections" :key="section.key">
            <div class="card__header">
              <div class="card__title">{{ section.title }}</div>
              <button class="btn btn--text" @click="onCorrect(section.key)">纠正</button>
            </div>
            <!-- 纠正弹层 -->
            <div v-if="correcting === section.key" class="correct-editor">
              <textarea v-model="correctText" class="correct-editor__textarea" :maxlength="2000" />
              <div class="correct-editor__actions">
                <button class="btn btn--primary btn--sm" @click="onSaveCorrect">保存</button>
                <button class="btn btn--secondary btn--sm" @click="correcting = ''">取消</button>
              </div>
            </div>
            <div v-for="(item, i) in section.items" :key="i" class="card__body">
              {{ item.text }}
            </div>
            <div v-if="section.items.length === 0" class="card__body card__body--empty">尚未确认</div>
            <div class="card__tags">
              <StatusTag v-for="(tag, ti) in section.tags" :key="ti" :label="tag" />
            </div>
          </div>

          <!-- 问题清单 -->
          <div class="card">
            <div class="card__title">最希望解决的问题（{{ questions.length }}）</div>
            <div v-for="(q, i) in questions" :key="i" class="question-item">
              <span class="question-item__num">{{ i + 1 }}.</span>
              <span class="question-item__text">{{ q }}</span>
            </div>
            <p v-if="questions.length === 0" class="card__body card__body--empty">暂无复诊问题，可在“问与解释”中加入</p>
          </div>
        </div>

        <!-- 右：A4 打印预览 -->
        <div class="followup-page__side">
          <div class="print-preview">
            <div class="print-preview__label">打印预览 · A4</div>
            <div class="print-preview__page">
              <div class="print-preview__header">
                <span class="print-preview__title">复诊交接摘要</span>
                <span class="print-preview__logo">腰</span>
              </div>
              <p class="print-preview__meta">生成于 {{ today }} · 由用户自述与报告原文整理 · 未经医生核实</p>
              <div v-for="(section, i) in sections" :key="i" class="print-preview__section">
                <div class="print-preview__section-title">{{ ['一', '二', '三', '四', '五', '六'][i] }}、{{ section.title }}</div>
                <p class="print-preview__text">
                  <span v-for="(item, ii) in section.items" :key="ii">{{ item.text }}<br /></span>
                  <span v-if="section.items.length === 0">尚未确认</span>
                </p>
              </div>
              <p class="print-preview__footer">
                未经医生核实 · 不含诊断结论 · 本摘要仅整理你已录入的信息，供复诊时参考。
              </p>
            </div>
          </div>

          <TipBar type="info">
            导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。
          </TipBar>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { beijingDate } from '@/utils/time';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, previewSummary, exportSummary, saveSummary } from '@/api';
import type { SummaryContent } from '@/api/types';
import { escapeHtml } from '@/utils/html';

const content = ref<SummaryContent | null>(null);
const summaryId = ref('');
const correcting = ref('');
const correctText = ref('');

const today = beijingDate();

const questions = computed(() => content.value?.复诊问题 ?? []);

const sections = computed(() => {
  if (!content.value) return [];
  return [
    { key: '当前情况', title: '本次发作起点与当前情况', items: content.value.当前情况, tags: ['自述'] },
    { key: '报告要点', title: '相关检查原文', items: content.value.报告要点, tags: ['报告原文'] },
    { key: '医嘱要点', title: '已经接受的专业建议', items: content.value.医嘱要点, tags: ['医生记录'] },
    { key: '尚未确认', title: '尚未确认', items: content.value.尚未确认, tags: ['未经核实'] },
    { key: '下一步', title: '下一步', items: content.value.下一步, tags: [] },
  ];
});

async function load() {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      content.value = await previewSummary(episodes[0].id);
    }
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onExport(format: '文本' | 'PDF' | '图片') {
  try {
    const episodes = await listEpisodes();
    if (episodes.length === 0) {
      toast('请先建立病程');
      return;
    }
    if (!content.value) {
      toast('请先生成摘要');
      return;
    }
    const saved = await saveSummary(episodes[0].id, content.value);
    summaryId.value = saved.id;
    const result = await exportSummary(saved.id, format);
    if (format === '文本') {
      try {
        await navigator.clipboard.writeText(result.text);
        toast('已复制文本');
      } catch {
        toast('复制失败，请手动选择文本');
      }
    } else {
      // PDF 通过浏览器打印生成
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<html><head><title>复诊交接摘要</title></head><body><pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(result.text)}</pre></body></html>`);
        win.document.close();
        win.print();
      } else {
        toast('请允许弹出窗口以打印 PDF');
      }
    }
  } catch (e) {
    toast((e as Error).message);
  }
}

function onPrint() {
  window.print();
}

function onCorrect(key: string) {
  correcting.value = key;
  const section = content.value?.[key as keyof SummaryContent];
  if (Array.isArray(section) && section.length > 0 && typeof section[0] === 'object') {
    correctText.value = (section[0] as { text: string }).text;
  } else {
    correctText.value = '';
  }
}

async function onSaveCorrect() {
  if (!content.value || !correcting.value) return;
  const key = correcting.value as keyof SummaryContent;
  const section = content.value[key];
  if (Array.isArray(section) && section.length > 0 && typeof section[0] === 'object') {
    (section[0] as { text: string }).text = correctText.value;
  }
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      await saveSummary(episodes[0].id, content.value);
    }
    correcting.value = '';
    toast('已保存纠正');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

/** 转义 HTML，避免摘要文本在打印弹窗中造成 XSS */

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;max-width:80%;text-align:center;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

onMounted(load);
</script>

<style scoped>
.followup-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.followup-page__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.followup-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 4px 0 0;
}
.followup-page__actions {
  display: flex;
  gap: 10px;
}
.followup-page__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
.followup-page__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.followup-page__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.followup-page__edit-hint {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 12px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
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
}
.card__body {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}
.card__body--empty {
  color: var(--text-3);
  font-size: 13px;
}
.card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.correct-editor {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.correct-editor__textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}
.correct-editor__actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.question-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}
.question-item__num {
  color: var(--primary);
  font-weight: 500;
}
.question-item__text {
  flex: 1;
}
.print-preview__label {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 8px;
}
.print-preview__page {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 24px;
  font-size: 12px;
}
.print-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.print-preview__title {
  font-size: 16px;
  font-weight: 500;
}
.print-preview__logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.print-preview__meta {
  font-size: 11px;
  color: var(--text-3);
  margin: 0 0 16px;
}
.print-preview__section {
  margin-bottom: 12px;
}
.print-preview__section-title {
  font-weight: 500;
  margin-bottom: 4px;
}
.print-preview__text {
  color: var(--text-2);
  line-height: 1.6;
  margin: 0;
}
.print-preview__footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-3);
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
.btn--primary { background: var(--primary); color: #fff; }
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
@media (max-width: 1100px) {
  .followup-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
