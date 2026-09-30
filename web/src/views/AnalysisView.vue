<template>
  <AppLayout>
    <div class="analysis-page">
      <div class="analysis-page__header">
        <div>
          <h1 class="analysis-page__title">一页分析</h1>
          <p class="analysis-page__meta">基于 {{ today }} 的信息 · 分析版本 v{{ analysis?.version ?? '-' }} · 模型 {{ analysis?.modelReleaseId ?? '-' }}</p>
        </div>
        <div class="analysis-page__actions">
          <button class="btn btn--secondary">📄 导出</button>
          <button class="btn btn--secondary">⬆ 分享</button>
          <button class="btn btn--secondary">⚑ 报告错误</button>
        </div>
      </div>

      <div class="analysis-page__tags">
        <StatusTag label="不作诊断" />
        <StatusTag label="每条解释带来源" />
        <StatusTag label="缺失即未知" />
      </div>

      <p class="analysis-page__intro">
        你上传的报告中提到了 L5/S1；你描述目前腰痛持续约 1 个月且最近加重。报告日期已确认，症状开始日期和是否出现腿部无力还需要确认。下面先解释报告术语，再整理复诊时需要确认的问题。
      </p>

      <div class="analysis-page__grid">
        <div class="analysis-page__main">
          <div class="card">
            <div class="section-title">
              <span class="section-num">1</span>
              <span>当前确认的信息与来源</span>
            </div>
            <div v-for="(item, i) in analysis?.sections.已知 ?? []" :key="i" class="analysis-item">
              <span class="analysis-item__dot">•</span>
              <span class="analysis-item__text">{{ item.text }}</span>
              <span class="analysis-item__source">报告原文 · 第 3 行</span>
            </div>
            <div v-if="!analysis || analysis.sections.已知.length === 0" class="analysis-empty">
              已确认的信息为空，请先录入报告或记录今天。
            </div>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--info">2</span>
              <span>这些信息能支持什么解释</span>
            </div>
            <div v-for="(item, i) in analysis?.sections.解释 ?? []" :key="i" class="analysis-item">
              <span class="analysis-item__dot">•</span>
              <span class="analysis-item__text">{{ item.text }}</span>
              <span class="analysis-item__source analysis-item__source--ok">来源：{{ evidenceTitle(item.source) }}</span>
            </div>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--warn">3</span>
              <span>仍缺哪些信息、哪些不能据此判断</span>
            </div>
            <div v-for="(item, i) in analysis?.sections.未知 ?? []" :key="i" class="analysis-item">
              <span class="analysis-item__dot">•</span>
              <span class="analysis-item__text">{{ item.text }}</span>
            </div>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--ok">4</span>
              <span>建议向医生确认的问题与下一步</span>
            </div>
            <div v-for="(item, i) in analysis?.sections.下一步 ?? []" :key="i" class="analysis-question">
              <span class="analysis-question__icon">■</span>
              <span class="analysis-question__text">{{ item.text }}</span>
            </div>
            <button class="btn btn--soft">加入复诊问题清单（已选 {{ analysis?.sections.下一步.length ?? 0 }} 条）</button>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--neutral">5</span>
              <span>可选科普视频与本次记录</span>
            </div>
            <div v-for="video in analysis?.sections.视频 ?? []" :key="video.contentId" class="analysis-video">
              <div class="analysis-video__thumb">▶</div>
              <div class="analysis-video__body">
                <div class="analysis-video__title">{{ video.title }}</div>
                <div class="analysis-video__meta">
                  <StatusTag label="已审核 v2" />
                  <span>2:10 · 字幕 · 文字替代</span>
                </div>
              </div>
              <button class="btn btn--secondary btn--sm">播放</button>
            </div>
            <div class="card__actions">
              <button class="btn btn--secondary">保存到病程</button>
              <button class="btn btn--primary">生成复诊摘要</button>
            </div>
          </div>

          <div class="card">
            <div class="card__title">这次分析对你有帮助吗？</div>
            <div class="analysis-feedback">
              <button
                v-for="opt in ['看懂了', '知道下一步', '都不好，问题没解决']"
                :key="opt"
                class="chip"
                @click="onFeedback(opt)"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>

        <div class="analysis-page__side">
          <div class="card">
            <div class="report__header">
              <span class="report__title">📄 报告原文{{ reportDate ? ' · ' + reportDate : '' }}</span>
              <StatusTag label="未修改" />
            </div>
            <p class="report__raw">{{ rawText || '暂无报告原文' }}</p>
            <div class="report__legend">
              <span class="report__legend-item">
                <span class="report__legend-dot report__legend-dot--ok" />当前选中解释引用的原文（点击左侧任一解释可切换高亮）
              </span>
              <span class="report__legend-item">
                <span class="report__legend-dot report__legend-dot--warn" />与你描述的侧别不一致，需向医生确认
              </span>
            </div>
          </div>

          <div class="card card--warn">
            <div class="card__title card__title--warn">报告未提及</div>
            <p class="card__text">
              报告中没有描述的内容不会被写成“已排除”，而会标为“报告未提及”。
            </p>
          </div>

          <div class="card">
            <div class="card__title">本段涉及的术语</div>
            <div v-for="(term, i) in terms" :key="i" class="term">
              <span class="term__name">{{ term.name }}</span>
              <span class="term__def">{{ term.def }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, getLatestAnalysis, createHelpFeedback, timeline } from '@/api';
import type { AnalysisResult } from '@/api/types';

const router = useRouter();
const today = new Date().toISOString().slice(0, 10);
const analysis = ref<AnalysisResult | null>(null);
const rawText = ref('');
const reportDate = ref('');

const terms = ref<Array<{ name: string; def: string }>>([]);

const introText = computed(() => {
  if (!analysis.value) return '';
  const parts: string[] = [];
  if (analysis.value.sections.已知.length > 0) parts.push(`已确认 ${analysis.value.sections.已知.length} 条信息`);
  if (analysis.value.sections.未知.length > 0) parts.push(`有 ${analysis.value.sections.未知.length} 项尚未确认`);
  if (parts.length === 0) return '下面按“已知 / 解释 / 未知 / 下一步”整理。';
  return `下面按“已知 / 解释 / 未知 / 下一步”整理：${parts.join('，')}。`;
});

function evidenceTitle(source: string | null) {
  if (!source) return '系统生成';
  const citation = analysis.value?.citations.find((c) => c.evidenceDocId === source);
  if (citation?.evidenceDocTitle) return citation.evidenceDocTitle;
  return `审核科普 #${source.slice(-2)}`;
}

function onFeedback(opt: string) {
  if (!analysis.value) return;
  createHelpFeedback(analysis.value.id, opt);
  toast('感谢反馈');
}

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const latest = await getLatestAnalysis(episodes[0].id);
      if (latest) analysis.value = latest;
      // 加载报告原文（用于原文对照）
      const tl = await timeline(episodes[0].id);
      const reportEvent = [...tl.events].reverse().find((e) => e.eventType === '报告' && e.rawText);
      if (reportEvent) {
        rawText.value = reportEvent.rawText ?? '';
        reportDate.value = reportEvent.occurredAt.slice(0, 10);
        const termDefs: Array<{ name: string; def: string }> = [
          { name: 'L5/S1', def: '第 5 腰椎与第 1 骶椎之间的椎间盘' },
          { name: '硬膜囊', def: '包裹脊髓和神经根的膜性结构在影像上的名称。' },
          { name: '神经根', def: '从脊髓分出、经椎间孔走行的神经起始段。' },
          { name: '椎间盘突出', def: '椎间盘内容物超出椎体边缘的影像描述，程度与症状不一定对应。' },
          { name: '椎间盘膨出', def: '椎间盘外层完整、整体超出椎体边缘的影像描述。' },
        ];
        terms.value = termDefs.filter((t) => rawText.value.includes(t.name));
      }
    }
  } catch {
    // 未登录时不阻塞
  }
});
</script>

<style scoped>
.analysis-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}
.analysis-page__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.analysis-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 4px 0 0;
}
.analysis-page__actions {
  display: flex;
  gap: 10px;
}
.analysis-page__tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.analysis-page__intro {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px;
}
.analysis-page__grid {
  display: grid;
  grid-template-columns: 720px 1fr;
  gap: 20px;
  align-items: start;
}
.analysis-page__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.analysis-page__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.card--warn {
  background: rgba(199, 119, 0, 0.06);
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
.card__header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card__version {
  font-size: 12px;
  color: var(--text-3);
}
.card__text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin: 0;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}
.section-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.section-num--info { background: var(--info); }
.section-num--warn { background: var(--warn); }
.section-num--ok { background: var(--ok); }
.section-num--neutral { background: var(--text-3); }
.analysis-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}
.analysis-item__dot { color: var(--text-2); }
.analysis-item__text {
  font-size: 14px;
  flex: 1;
  line-height: 1.5;
}
.analysis-item__source {
  font-size: 11px;
  color: var(--text-3);
  flex-shrink: 0;
}
.analysis-item__source--ok { color: var(--ok); }
.analysis-empty {
  font-size: 14px;
  color: var(--text-3);
}
.analysis-question {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.analysis-question__icon { color: var(--primary); font-size: 12px; }
.analysis-question__text { font-size: 14px; flex: 1; line-height: 1.5; }
.analysis-video {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.analysis-video__thumb {
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
.analysis-video__body { flex: 1; }
.analysis-video__title { font-size: 14px; font-weight: 500; }
.analysis-video__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}
.card__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.analysis-feedback {
  display: flex;
  gap: 10px;
}
.report__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.report__title {
  font-size: 15px;
  font-weight: 500;
}
.report__raw {
  font-size: 14px;
  line-height: 1.8;
  margin: 0 0 12px;
}
.report__raw mark {
  background: rgba(199, 119, 0, 0.15);
  color: var(--warn);
  padding: 0 2px;
  border-radius: 2px;
}
.report__legend {
  border-top: 1px solid var(--border);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.report__legend-item {
  font-size: 12px;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 6px;
}
.report__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.report__legend-dot--ok { background: var(--ok); }
.report__legend-dot--warn { background: var(--warn); }
.term {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.term__name {
  font-size: 14px;
  color: var(--primary);
  width: 72px;
  flex-shrink: 0;
}
.term__def {
  font-size: 14px;
  flex: 1;
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
.btn--soft { background: var(--primary-light); color: var(--primary); }
.btn--sm { min-height: 32px; padding: 0 12px; font-size: 13px; }
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
@media (max-width: 1100px) {
  .analysis-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
