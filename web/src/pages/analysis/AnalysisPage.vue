<template>
  <div class="analysis-page">
    <div v-if="loading" class="state-card">正在加载分析结果...</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>

    <div v-else-if="analysis" class="analysis-layout">
      <div class="analysis-left">
        <div class="page-meta">
          <span class="tag-nodiag">不作诊断</span>
          <span class="meta-text">基于 {{ formatDate(analysis.createdAt) }} 的信息 · 分析版本 v{{ analysis.version }}</span>
        </div>
        <p class="analysis-intro">{{ analysisIntro }}</p>

        <section class="card">
          <h2 class="section-title"><span class="step-num">1</span>当前确认的信息与来源</h2>
          <ul class="source-list">
            <li v-for="(item, idx) in analysis.sections.known" :key="idx">
              <span class="bullet"></span>
              <span>{{ item }}</span>
              <span class="source-tag">来源：报告原文 · 可查看</span>
            </li>
            <li v-for="(exp, idx) in analysis.sections.explanation" :key="'e' + idx">
              <span class="bullet"></span>
              <span>{{ exp.text }}</span>
              <span class="source-tag self-tag">自述 · 已确认</span>
            </li>
          </ul>
        </section>

        <section class="card">
          <h2 class="section-title"><span class="step-num">2</span>这些信息能支持什么解释</h2>
          <div class="exp-item" v-for="(exp, idx) in analysis.sections.explanation" :key="idx">
            <p class="exp-text">{{ exp.text }}</p>
            <span class="source-tag">来源：{{ exp.source }}</span>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title"><span class="step-num">3</span>仍缺哪些信息、哪些不能据此判断</h2>
          <ul class="source-list">
            <li v-for="(item, idx) in analysis.sections.unknown" :key="idx">
              <span class="bullet"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <p class="note">不能据此判断这次疼痛的原因、严重程度，或是否需要手术。</p>
        </section>

        <section class="card">
          <h2 class="section-title"><span class="step-num">4</span>建议向医生确认的问题与下一步</h2>
          <ul class="next-list">
            <li v-for="(item, idx) in analysis.sections.nextSteps" :key="idx">
              <span class="next-box"></span>
              <span>{{ item }}</span>
            </li>
          </ul>
          <button class="btn-secondary btn-block">加入复诊问题清单</button>
        </section>

        <section class="card">
          <h2 class="section-title"><span class="step-num">5</span>可选科普视频与本次记录</h2>
          <div class="video-placeholder">
            <img src="@/assets/icons/ic_play.png" alt="" />
            <span>腰椎节段位置：L5/S1 在哪里 · 已审核 v2</span>
          </div>
          <div class="meta-actions">
            <button class="btn-secondary">保存到病程</button>
            <button class="btn-primary" @click="goFollowup">生成复诊摘要</button>
          </div>
        </section>

        <section class="card feedback-card">
          <h2 class="section-title">这次分析对你有帮助吗？</h2>
          <div class="chip-row">
            <button class="chip">看懂了</button>
            <button class="chip">知道下一步</button>
            <button class="chip">都不好，问题没解决</button>
          </div>
          <button class="report-error-btn" @click="reportError">报告错误（会记录分析版本与影响范围）</button>
        </section>

        <p class="foot-note">本说明“已经知道什么、仍不知道什么、接下来怎么办”，帮助你理解和复诊，不代替医生诊断。</p>
      </div>

      <div class="analysis-right">
        <h2 class="section-title">报告原文</h2>
        <div class="card raw-card">
          <div class="raw-head">
            <img src="@/assets/icons/ic_doc.png" alt="" />
            <span>报告原文 · {{ formatDate(rawDate) }}</span>
            <span class="source-tag">未修改</span>
          </div>
          <p class="raw-text">{{ rawText || '暂无原文' }}</p>
        </div>
        <div class="card not-mentioned-card">
          <p class="not-mentioned-title">报告未提及 ≠ 已排除</p>
          <p class="not-mentioned-text">报告中没有描述的内容不会被写成“已排除”，而会标为“报告未确认”。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../../utils/api';
import type { Analysis } from '../../types';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const analysis = ref<Analysis | null>(null);
const rawText = ref('');
const rawDate = ref('');

const analysisIntro = computed(() => {
  const a = analysis.value;
  if (!a) return '';
  return `你上传的报告中提到了 ${a.sections.known.join('、') || '尚未确认'}；你描述目前的情况见下。报告日期已确认，症状开始日期和是否出现腿部无力还需要确认。下面先解释报告术语，再整理复诊时需要确认的问题。`;
});

function formatDate(iso?: string) {
  return iso ? iso.slice(0, 10) : '';
}

function goFollowup() {
  router.push('/followup');
}

function reportError() {
  alert('请通过“账户-反馈与举报”提交，会自动附带分析版本与影响范围。');
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    if (!episodes || episodes.length === 0) {
      error.value = '暂无病程数据';
      return;
    }
    const episodeId = episodes[0].id;

    if (route.params.id === 'latest') {
      const latest = await api.getLatestAnalysis(episodeId);
      if (latest.status === 'none') {
        error.value = '尚未生成分析';
        return;
      }
      analysis.value = latest as unknown as Analysis;
    } else {
      const task = await api.createAnalysis({ episodeId });
      if (task.safetyMessage) {
        error.value = task.safetyMessage;
        return;
      }
      analysis.value = await api.getAnalysis(task.taskId);
    }

    const reports = await api.getReportsByEpisode(episodeId);
    if (reports && reports.length > 0) {
      rawText.value = reports[0].raw_text || '';
      rawDate.value = reports[0].report_date;
    }
  } catch (e: any) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.analysis-page {
  padding: 0;
}

.state-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  color: var(--text-2);
}

.state-card.error {
  color: var(--error);
}

.analysis-layout {
  display: grid;
  grid-template-columns: 720px 1fr;
  gap: 24px;
  align-items: start;
}

.page-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.tag-nodiag {
  font-size: 12px;
  color: var(--error);
  background: rgba(217, 59, 59, 0.08);
  border-radius: 4px;
  padding: 3px 8px;
}

.meta-text {
  font-size: 12px;
  color: var(--text-3);
}

.analysis-intro {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.7;
  margin-bottom: 20px;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.source-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.source-list li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-3);
  flex-shrink: 0;
  align-self: center;
}

.source-tag {
  margin-left: auto;
  font-size: 12px;
  color: var(--info);
  background: #E7F0FE;
  border-radius: 4px;
  padding: 2px 8px;
  flex-shrink: 0;
}

.self-tag {
  color: var(--warn);
  background: rgba(199, 119, 0, 0.1);
}

.exp-item {
  margin-bottom: 14px;
}

.exp-text {
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 6px;
}

.note {
  font-size: 13px;
  color: var(--warn);
  margin-top: 12px;
}

.next-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.next-list li {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}

.next-box {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: var(--primary);
  flex-shrink: 0;
}

.video-placeholder {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg);
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 14px;
}

.video-placeholder img {
  width: 28px;
  height: 28px;
  background: var(--primary);
  border-radius: 6px;
  padding: 5px;
  filter: brightness(0) invert(1);
}

.meta-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  flex: 1;
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

.btn-primary {
  flex: 1;
  background: var(--primary);
  color: #fff;
  border: none;
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

.chip-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.chip {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  padding: 8px 18px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}

.report-error-btn {
  background: none;
  border: none;
  color: var(--text-3);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.foot-note {
  font-size: 13px;
  color: var(--info);
  background: #E7F0FE;
  border-radius: 10px;
  padding: 14px 16px;
  line-height: 1.6;
}

.analysis-right {
  position: sticky;
  top: 24px;
}

.raw-card {
  padding: 0;
  overflow: hidden;
}

.raw-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  font-weight: 500;
}

.raw-head img {
  width: 18px;
  height: 18px;
}

.raw-head .source-tag {
  margin-left: auto;
  color: var(--text-3);
  background: var(--bg);
}

.raw-text {
  padding: 20px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-1);
  white-space: pre-wrap;
}

.not-mentioned-card {
  background: #FDF6E3;
}

.not-mentioned-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--warn);
  margin-bottom: 6px;
}

.not-mentioned-text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}
</style>
