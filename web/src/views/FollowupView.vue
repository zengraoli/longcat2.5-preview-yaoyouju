<template>
  <AppLayout>
    <div class="followup-page">
      <div class="followup-page__header">
        <div>
          <h1 class="followup-page__title">复诊准备</h1>
          <p class="followup-page__meta">一页交接摘要由你的记录与报告原文整理，保留来源与未核实项；预览后由你自主导出</p>
        </div>
        <div class="followup-page__actions">
          <button class="btn btn--primary" @click="onExport('PDF')">📄 导出 PDF</button>
          <button class="btn btn--secondary" @click="onExport('PDF')">🖨 打印</button>
          <button class="btn btn--secondary" @click="onExport('文本')">⧉ 复制文本</button>
        </div>
      </div>

      <!-- 页签 -->
      <div class="followup-page__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="followup-page__tab"
          :class="{ 'followup-page__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="followup-page__grid">
        <!-- 左：编辑摘要 -->
        <div class="followup-page__main">
          <p class="followup-page__edit-hint">编辑摘要（每段可纠正，纠正后重新生成）</p>

          <div class="card" v-for="(section, i) in sections" :key="i">
            <div class="card__header">
              <div class="card__title">{{ section.title }}</div>
              <button class="btn btn--text">✎ 纠正</button>
            </div>
            <div class="card__body">{{ section.text }}</div>
            <div class="card__tags">
              <StatusTag v-for="(tag, ti) in section.tags" :key="ti" :label="tag" />
            </div>
          </div>

          <!-- 问题清单排序 -->
          <div class="card">
            <div class="card__title">最希望解决的问题（可拖拽排序）</div>
            <div v-for="(q, i) in questions" :key="i" class="question-item">
              <span class="question-item__drag">⠿</span>
              <span class="question-item__num">{{ i + 1 }}.</span>
              <span class="question-item__text">{{ q }}</span>
              <span class="question-item__remove">✕</span>
            </div>
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
              <p class="print-preview__meta">生成于 2026-09-21 · 由用户自述与报告原文整理 · 未经医生核实</p>
              <div v-for="(section, i) in sections" :key="i" class="print-preview__section">
                <div class="print-preview__section-title">{{ ['一', '二', '三', '四', '五', '六'][i] }}、{{ section.title }}</div>
                <p class="print-preview__text">{{ section.text }}</p>
              </div>
              <p class="print-preview__footer">
                🛡 本摘要整理已有信息，保留时间来源与未核实项，不含诊断结论。腰有据 · 用户自述与报告原文整理 · 未经医生核实
              </p>
            </div>
          </div>

          <TipBar type="info">
            导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。导出文件链接 24 小时内有效。
          </TipBar>
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
import TipBar from '@/components/TipBar.vue';
import { api } from '@/api/client';

const tabs = [
  { key: 'summary', label: '一页交接摘要' },
  { key: 'questions', label: '问题清单 (4)' },
  { key: 'bring', label: '带什么' },
];
const activeTab = ref('summary');

const sections = ref([
  { title: '本次发作起点', text: '约 2026 年 8 月中旬开始腰痛，具体日期不确定（自述）；起初以久坐后酸痛为主。', tags: ['自述', '日期尚未确认'] },
  { title: '主要症状与变化', text: '腰痛持续约 1 个月，最近 1 周加重；主要在左侧；能坐约 30 分钟；夜间痛醒 1 次/晚。腿部无力：尚未确认。无大小便或鞍区异常。', tags: ['自述 · 12 条记录', '腿部无力：尚未确认'] },
  { title: '相关检查原文', text: '2026-08-30 腰椎 MRI：“L5/S1 椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。”', tags: ['报告原文', '与自述侧别不一致'] },
  { title: '已经接受的专业建议', text: '保守治疗，4 周后复查（2026-09-10 就诊时医生口头建议）。', tags: ['自述转述', '未经核实'] },
  { title: '已采取的行动', text: '每日步行约 20 分钟、热敷；避免久坐；未使用药物。', tags: ['自述'] },
]);

const questions = ref([
  '报告的右侧神经根受压与我左侧疼痛是否有关？',
  '保守治疗期间哪些变化要提前复诊？',
  '活动、久坐和睡姿要怎么调整？',
  '手术必要性如何评估？',
]);

function onExport(format: string) {
  toast(`已导出${format}（演示）`);
}

onMounted(async () => {
  try {
    const episodes = await api.get<{ id: string }[]>('/episodes');
    if (episodes.length > 0) {
      await api.get<unknown>(`/followup/summary?episodeId=${episodes[0].id}`);
    }
  } catch {
    // 加载失败不阻塞
  }
});
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
  margin: 0 0 4px;
}
.followup-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.followup-page__actions {
  display: flex;
  gap: 10px;
}
.followup-page__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.followup-page__tab {
  min-height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
}
.followup-page__tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.followup-page__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
.followup-page__edit-hint {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 12px;
}
.followup-page__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  margin-bottom: 12px;
}
.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.question-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 10px;
  margin-bottom: 8px;
}
.question-item__drag { color: var(--text-3); }
.question-item__num { font-size: 14px; color: var(--text-2); }
.question-item__text { font-size: 14px; flex: 1; }
.question-item__remove { color: var(--text-3); }
.print-preview {
  position: sticky;
  top: 80px;
}
.print-preview__label {
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 8px;
}
.print-preview__page {
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(27, 34, 48, 0.08);
  padding: 32px;
  min-height: 600px;
}
.print-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.print-preview__title {
  font-size: 18px;
  font-weight: 500;
}
.print-preview__logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.print-preview__meta {
  font-size: 12px;
  color: var(--text-2);
  margin: 0 0 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.print-preview__section {
  margin-bottom: 16px;
}
.print-preview__section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}
.print-preview__text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}
.print-preview__footer {
  margin-top: 24px;
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
</style>
