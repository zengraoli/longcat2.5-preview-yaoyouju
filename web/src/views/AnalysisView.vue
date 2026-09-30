<template>
  <AppLayout>
    <div class="analysis-page">
      <div class="analysis-page__header">
        <div>
          <h1 class="analysis-page__title">一页分析</h1>
          <p class="analysis-page__meta">基于 2026-09-21 的信息 · 分析版本 v3 · 模型 M-2609 · 内容库 2026-09</p>
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
        <!-- 左：五段分析 -->
        <div class="analysis-page__main">
          <div class="card">
            <div class="section-title">
              <span class="section-num">1</span>
              <span>当前确认的信息与来源</span>
            </div>
            <div v-for="(item, i) in sections.known" :key="i" class="analysis-item">
              <span class="analysis-item__dot">•</span>
              <span class="analysis-item__text">{{ item.text }}</span>
              <span class="analysis-item__source">报告原文 · 第 3 行</span>
            </div>
            <div v-for="(item, i) in sections.known2" :key="`k2${i}`" class="analysis-item">
              <span class="analysis-item__dot">•</span>
              <span class="analysis-item__text">{{ item.text }}</span>
              <span class="analysis-item__source">自述 · 2026-09-21</span>
            </div>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--info">2</span>
              <span>这些信息能支持什么解释</span>
            </div>
            <div v-for="(item, i) in sections.explained" :key="i" class="analysis-item">
              <span class="analysis-item__dot">•</span>
              <span class="analysis-item__text">{{ item.text }}</span>
              <span class="analysis-item__source analysis-item__source--ok">审核科普 #12</span>
            </div>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--warn">3</span>
              <span>仍缺哪些信息、哪些不能据此判断</span>
            </div>
            <div v-for="(item, i) in sections.unknown" :key="i" class="analysis-item">
              <span class="analysis-item__dot">•</span>
              <span class="analysis-item__text">{{ item.text }}</span>
            </div>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--ok">4</span>
              <span>建议向医生确认的问题与下一步</span>
            </div>
            <div v-for="(item, i) in sections.next" :key="i" class="analysis-question">
              <span class="analysis-question__icon">■</span>
              <span class="analysis-question__text">{{ item.text }}</span>
            </div>
            <button class="btn btn--soft">加入复诊问题清单（已选 3 条）</button>
          </div>

          <div class="card">
            <div class="section-title">
              <span class="section-num section-num--neutral">5</span>
              <span>可选科普视频与本次记录</span>
            </div>
            <div class="analysis-video">
              <div class="analysis-video__thumb">▶</div>
              <div class="analysis-video__body">
                <div class="analysis-video__title">腰椎节段位置：L5/S1 在哪里</div>
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
                v-for="opt in feedbackOptions"
                :key="opt"
                class="chip"
                @click="onFeedback(opt)"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>

        <!-- 右：原文对照 -->
        <div class="analysis-page__side">
          <div class="card">
            <div class="report__header">
              <span class="report__title">📄 报告原文 · 2026-08-30 · 腰椎MRI</span>
              <StatusTag label="未修改" />
            </div>
            <p class="report__raw">
              检查所见：腰椎生理曲度存在，各椎体形态、信号未见明显异常。<br />
              L4/5椎间盘轻度膨出。<br />
              <mark>L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。</mark><br />
              椎管未见明显狭窄。<br />
              印象：L5/S1椎间盘突出；L4/5椎间盘膨出。
            </p>
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
              神经根水肿 · 椎管狭窄程度 · 马尾相关描述。这些内容报告中没有描述，不会被写成“已排除”。
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
import { toast } from "@/utils/toast";
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { api } from '@/api/client';
import type { AnalysisResult } from '@/api/types';

const feedbackOptions = ['看懂了', '知道下一步', '都不好，问题没解决'];

interface SectionItem {
  text: string;
  source: string | null;
}

const sections = ref<{
  known: SectionItem[];
  known2: SectionItem[];
  explained: SectionItem[];
  unknown: SectionItem[];
  next: SectionItem[];
}>({
  known: [
    { text: '报告（2026-08-30，MRI）提到：L5/S1 椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。', source: '报告' },
  ],
  known2: [
    { text: '你描述：腰痛约 1 个月，最近一周加重，主要在左侧；没有大小便或鞍区异常。', source: '自述' },
  ],
  explained: [
    { text: '“L5/S1”指第 5 腰椎与第 1 骶椎之间的椎间盘，是腰椎最下方、承重最大的节段之一。', source: 'doc-science-1' },
    { text: '“硬膜囊受压”描述影像上突出物与神经外膜结构的位置关系，是影像描述，不等于症状严重程度。', source: 'doc-science-1' },
    { text: '影像上的突出与疼痛之间不是一一对应的关系；很多无症状的人影像上也有类似表现。', source: 'doc-research-2' },
  ],
  unknown: [
    { text: '症状开始日期尚未确认；是否出现腿部无力尚未确认。', source: null },
    { text: '报告写“右侧神经根”，你描述疼痛在左侧——需要在复诊时向医生确认。', source: null },
    { text: '不能据此判断这次疼痛的原因、严重程度，或是否需要手术。', source: null },
  ],
  next: [
    { text: '报告里的右侧神经根受压，和我左侧的疼痛有关系吗？', source: null },
    { text: '保守治疗期间，哪些变化出现时需要提前复诊？', source: null },
    { text: '目前的活动、久坐和睡姿有什么需要调整的？', source: null },
  ],
});

const terms = ref([
  { name: '硬膜囊', def: '包裹脊髓和神经根的膜性结构在影像上的名称。' },
  { name: '神经根', def: '从脊髓分出、经椎间孔走行的神经起始段。' },
  { name: '椎间盘突出', def: '椎间盘内容物超出椎体边缘的影像描述，程度与症状不一定对应。' },
]);

function onFeedback(opt: string) {
  toast(`感谢反馈：${opt}（演示）`);
}

onMounted(async () => {
  try {
    const episodes = await api.get<{ id: string }[]>('/episodes');
    if (episodes.length > 0) {
      const latest = await api.get<AnalysisResult | null>(`/analyses/episodes/${episodes[0].id}/latest`);
      if (latest) {
        sections.value = {
          known: latest.sections.已知,
          known2: [],
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
.analysis-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}
.analysis-page__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.analysis-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
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
.card__title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px;
}
.card__title--warn {
  color: var(--warn);
  font-size: 14px;
}
.card__text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
  margin: 0;
}
.card__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
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
.chip {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 13px;
  cursor: pointer;
}
</style>
