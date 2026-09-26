<template>
  <div class="analysis-page">
    <div v-if="loading" class="state-card">正在加载分析结果...</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>

    <div v-else-if="analysis" class="analysis-layout">
      <div class="analysis-left">
        <section class="card">
          <h2 class="section-title">已知</h2>
          <ul class="known-list">
            <li v-for="(item, idx) in analysis.sections.known" :key="idx">{{ item }}</li>
          </ul>
        </section>

        <section class="card">
          <h2 class="section-title">解释</h2>
          <div class="exp-item" v-for="(exp, idx) in analysis.sections.explanation" :key="idx" @click="highlightSource(exp.source)">
            <p class="exp-text">{{ exp.text }}</p>
            <span class="source-link">来源: {{ exp.source }}</span>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">未知</h2>
          <ul class="unknown-list">
            <li v-for="(item, idx) in analysis.sections.unknown" :key="idx">{{ item }}</li>
          </ul>
          <p class="note">报告未提及不等于已排除</p>
        </section>

        <section class="card">
          <h2 class="section-title">下一步建议</h2>
          <ol class="next-list">
            <li v-for="(item, idx) in analysis.sections.nextSteps" :key="idx">{{ item }}</li>
          </ol>
        </section>

        <div class="meta-info">
          <span>版本 v{{ analysis.version }}</span>
          <span>{{ formatTime(analysis.createdAt) }}</span>
          <span class="disclaimer">本分析由 AI 辅助生成，不构成医疗诊断</span>
        </div>
      </div>

      <div class="analysis-right">
        <h2 class="section-title">报告原文</h2>
        <div class="card raw-card">
          <p class="raw-text">{{ rawText || '暂无原文' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../../utils/api';
import type { Analysis } from '../../types';

const route = useRoute();
const loading = ref(true);
const error = ref('');
const analysis = ref<Analysis | null>(null);
const rawText = ref('');

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

function highlightSource(source: string) {
  console.log('highlight source:', source);
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
      // 工作台“查看详情”：直接取最近一页分析，不重复创建任务
      const latest = await api.getLatestAnalysis(episodeId);
      if (latest.status === 'none') {
        error.value = '尚未生成分析';
        return;
      }
      analysis.value = latest;
    } else {
      const task = await api.createAnalysis({ episodeId });
      if (task.safetyMessage) {
        error.value = task.safetyMessage;
        return;
      }
      analysis.value = await api.getAnalysis(task.taskId);
    }

    const events = await api.getCareEvents(episodeId);
    if (events && events.length > 0) {
      rawText.value = events[0].raw_text || '';
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
  padding: 24px 40px;
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
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.card {
  margin-bottom: 20px;
}

.known-list li,
.next-list li {
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-1);
  list-style: none;
}

.known-list li::before {
  content: '•';
  color: var(--ok);
  margin-right: 8px;
}

.exp-item {
  padding: 16px;
  background: var(--bg);
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
}

.exp-text {
  font-size: 14px;
  color: var(--text-1);
  line-height: 1.6;
}

.source-link {
  font-size: 11px;
  color: var(--info);
  margin-top: 8px;
  display: inline-block;
}

.unknown-list li {
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-2);
  list-style: none;
}

.unknown-list li::before {
  content: '?';
  color: var(--warn);
  margin-right: 8px;
}

.note {
  font-size: 12px;
  color: var(--warn);
  margin-top: 8px;
}

.next-list {
  padding-left: 20px;
}

.meta-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 16px;
}

.disclaimer {
  color: var(--warn);
}

.raw-card {
  max-height: 600px;
  overflow-y: auto;
}

.raw-text {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.8;
}
</style>
