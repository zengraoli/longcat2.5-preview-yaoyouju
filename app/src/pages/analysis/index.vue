<template>
  <view class="analysis">
    <view class="analysis__header">
      <text class="analysis__back" @click="goBack">‹</text>
      <text class="analysis__title">一页分析</text>
      <text class="analysis__more">⋯</text>
    </view>

    <!-- 排队中 -->
    <view v-if="status === '排队' || status === '处理中'" class="card">
      <text class="analysis__waiting">分析生成中，请稍候…</text>
      <text class="analysis__waiting-desc">任务正在排队或由 Worker 处理，完成后自动展示。</text>
    </view>

    <!-- 失败回退 -->
    <view v-else-if="status === '失败'" class="card">
      <TipBar type="error">
        {{ reason }}。你仍然可以查看已审核资料与复诊摘要。
      </TipBar>
      <view class="analysis__actions">
        <AppButton type="soft" block @click="goContents">查看已审核资料</AppButton>
        <AppButton type="secondary" block @click="goFallback">查看服务不可用说明</AppButton>
      </view>
    </view>

    <template v-else-if="result">
      <view class="analysis__meta">
        <StatusTag label="不作诊断" />
        <text class="analysis__meta-text">基于 {{ today }} 的信息</text>
      </view>
      <text class="analysis__version">分析版本 v{{ result.version }} · 模型 {{ result.modelReleaseId }}</text>

      <text class="analysis__intro">{{ introText }}</text>

      <!-- ① 当前确认的信息与来源 -->
      <view class="card">
        <view class="analysis__section-title">
          <text class="analysis__section-num">1</text>
          <text class="analysis__section-name">当前确认的信息与来源</text>
        </view>
        <view v-for="(item, i) in result.sections.已知" :key="i" class="analysis__item">
          <text class="analysis__item-dot">•</text>
          <text class="analysis__item-text">{{ item.text }}</text>
          <text class="analysis__item-source">
            {{ sourceLabel(item.source) }}<text v-if="item.mark" class="analysis__item-mark">{{ item.mark }}</text>
          </text>
        </view>
      </view>

      <!-- ② 这些信息能支持什么解释 -->
      <view class="card">
        <view class="analysis__section-title">
          <text class="analysis__section-num analysis__section-num--info">2</text>
          <text class="analysis__section-name">这些信息能支持什么解释</text>
        </view>
        <view v-for="(item, i) in result.sections.解释" :key="i" class="analysis__item">
          <text class="analysis__item-dot">•</text>
          <text class="analysis__item-text">{{ item.text }}</text>
          <text class="analysis__item-source analysis__item-source--ok">来源：{{ evidenceTitle(item.source) }}</text>
        </view>
      </view>

      <!-- ③ 仍缺哪些信息 -->
      <view class="card">
        <view class="analysis__section-title">
          <text class="analysis__section-num analysis__section-num--warn">3</text>
          <text class="analysis__section-name">仍缺哪些信息、哪些不能据此判断</text>
        </view>
        <view v-for="(item, i) in result.sections.未知" :key="i" class="analysis__item">
          <text class="analysis__item-dot">•</text>
          <text class="analysis__item-text">{{ item.text }}</text>
        </view>
      </view>

      <!-- ④ 建议向医生确认的问题与下一步 -->
      <view class="card">
        <view class="analysis__section-title">
          <text class="analysis__section-num analysis__section-num--ok">4</text>
          <text class="analysis__section-name">建议向医生确认的问题与下一步</text>
        </view>
        <view v-for="(item, i) in result.sections.下一步" :key="i" class="analysis__question">
          <text class="analysis__question-icon">■</text>
          <text class="analysis__question-text">{{ item.text }}</text>
        </view>
        <AppButton type="soft" block @click="goFollowup">加入复诊问题清单（已选 {{ result.sections.下一步.length }} 条）</AppButton>
      </view>

      <!-- ⑤ 可选科普视频 -->
      <view class="card">
        <view class="analysis__section-title">
          <text class="analysis__section-num analysis__section-num--neutral">5</text>
          <text class="analysis__section-name">可选科普视频与本次记录</text>
        </view>
        <view v-for="video in result.sections.视频" :key="video.contentId" class="analysis__video" @click="goContentDetail(video)">
          <view class="analysis__video-thumb">
            <text class="analysis__video-play">▶</text>
          </view>
          <view class="analysis__video-body">
            <text class="analysis__video-title">{{ video.title }}</text>
            <view class="analysis__video-meta">
              <StatusTag label="已审核" />
              <text class="analysis__video-duration">{{ video.reason }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="analysis__actions">
        <AppButton type="secondary" block @click="goTimeline">保存到病程</AppButton>
        <AppButton type="secondary" block @click="goCompare">原文对照</AppButton>
        <AppButton block @click="goSummary">生成复诊摘要</AppButton>
      </view>

      <!-- 反馈 -->
      <view class="card">
        <text class="card-title">这次分析对你有帮助吗？</text>
        <view class="analysis__feedback">
          <AppChip v-for="opt in feedbackOptions" :key="opt" @click="onFeedback(opt)">
            {{ opt }}
          </AppChip>
        </view>
        <text class="analysis__report-error" @click="onReportError">⚑ 报告错误（会记录分析版本与影响范围）</text>
        <text class="analysis__report-error" @click="goFeedback">前往“反馈与举报”页</text>
      </view>

      <TipBar type="info">
        本页说明“已经知道什么、仍不知道什么、接下来怎么办”，帮助你理解和复诊，不代替医生诊断。
      </TipBar>
    </template>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import AppButton from '@/components/AppButton.vue';
import AppChip from '@/components/AppChip.vue';
import TipBar from '@/components/TipBar.vue';
import { getAnalysis, createHelpFeedback, createErrorReport, listEpisodes, addEvent, listQaSessions, createQaSession, addFollowupQuestion, type AnalysisResult } from '@/api';

const pages = getCurrentPages();
const currentPage = pages[pages.length - 1] as { options?: Record<string, string> };
const taskId = currentPage?.options?.id ?? '';
const today = new Date().toISOString().slice(0, 10);
const status = ref('');
const reason = ref('');
const result = ref<AnalysisResult | null>(null);
const feedbackOptions = ['看懂了', '知道下一步', '都不好，问题没解决'];


let pollTimer: number | null = null;

function sourceLabel(source: string | null) {
  if (source === '报告') return '报告原文 · 可回看';
  if (source === '医嘱') return '自述 · 未经核实';
  if (source === '症状') return '自述 · ' + today;
  return source ?? '';
}

function evidenceTitle(source: string | null) {
  if (!source) return '系统生成';
  const citation = result.value?.citations.find((c) => c.evidenceDocId === source);
  if (citation?.evidenceDocTitle) return citation.evidenceDocTitle;
  return `审核科普 #${source.slice(-2)}`;
}

/** 根据分析实际数据生成引言，不写死示例内容 */
const introText = computed(() => {
  if (!result.value) return '';
  const parts: string[] = [];
  const known = result.value.sections.已知;
  if (known.length > 0) {
    parts.push(`已确认 ${known.length} 条信息`);
  }
  const unknown = result.value.sections.未知;
  if (unknown.length > 0) {
    parts.push(`有 ${unknown.length} 项尚未确认`);
  }
  if (parts.length === 0) return '下面按“已知 / 解释 / 未知 / 下一步”整理。';
  return `下面按“已知 / 解释 / 未知 / 下一步”整理：${parts.join('，')}。`;
});

function goBack() {
  uni.navigateBack();
}
async function goTimeline() {
  // 保存到病程：记录本次分析生成事件，再跳转时间线
  if (result.value) {
    try {
      const episodes = await listEpisodes();
      if (episodes.length > 0) {
        await addEvent(episodes[0].id, {
          eventType: '行动',
          occurredAt: new Date().toISOString(),
          sourceType: '自述',
          rawText: `已生成一页分析 v${result.value.version}（模型 ${result.value.modelReleaseId}）`,
          verifyStatus: '已确认',
        });
        uni.showToast({ title: '已保存到病程', icon: 'success' });
      }
    } catch (e) {
      uni.showToast({ title: (e as Error).message, icon: 'none' });
    }
  }
  uni.switchTab({ url: '/pages/timeline/index' });
}
function goSummary() {
  uni.navigateTo({ url: '/pages/summary/index' });
}
async function goFollowup() {
  // 加入复诊问题清单：把“下一步”条目写入问与解释的复诊问题，再跳转复诊准备
  if (result.value) {
    try {
      const episodes = await listEpisodes();
      if (episodes.length > 0) {
        const sessions = await listQaSessions();
        const session =
          sessions.find((s) => s.analysisId === result.value!.id) ?? sessions[0];
        const sessionId = session
          ? session.id
          : (await createQaSession(result.value.id, '分析补充问题')).id;
        const questions = result.value.sections.下一步.map((s) => s.text);
        for (const q of questions) {
          await addFollowupQuestion(sessionId, q);
        }
        uni.showToast({ title: `已加入 ${questions.length} 条复诊问题`, icon: 'success' });
      }
    } catch (e) {
      uni.showToast({ title: (e as Error).message, icon: 'none' });
    }
  }
  uni.switchTab({ url: '/pages/followup/index' });
}
function goContents() {
  uni.navigateTo({ url: '/pages/contents/index' });
}
function goCompare() {
  uni.navigateTo({ url: '/pages/report-compare/index' });
}
function goContentDetail(video: { contentId: string }) {
  uni.navigateTo({ url: `/pages/content-detail/index?id=${video.contentId}` });
}
function goFeedback() {
  uni.navigateTo({ url: '/pages/feedback/index' });
}
function goFallback() {
  uni.navigateTo({ url: '/pages/fallback/index' });
}

async function onFeedback(opt: string) {
  if (!result.value) return;
  try {
    await createHelpFeedback(result.value.id, opt);
    uni.showToast({ title: '感谢反馈', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

async function onReportError() {
  if (!result.value) return;
  try {
    await createErrorReport(result.value.id, '用户报告错误', '中');
    uni.showToast({ title: '已提交举报', icon: 'success' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

async function poll() {
  if (!taskId) return;
  try {
    const res = await getAnalysis(taskId);
    status.value = res.status;
    if (res.status === '完成' && res.analysis) {
      result.value = res.analysis;
      if (pollTimer) clearInterval(pollTimer);
    } else if (res.status === '失败') {
      reason.value = res.reason ?? '分析生成失败';
      if (pollTimer) clearInterval(pollTimer);
    }
  } catch {
    // 轮询失败不阻塞
  }
}

onMounted(() => {
  poll();
  pollTimer = setInterval(poll, 2000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.analysis {
  min-height: 100vh;
  padding: 16px 16px 100px;
}
.analysis__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.analysis__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.analysis__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.analysis__more { color: var(--text-2); font-size: 20px; }
.analysis__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.analysis__meta-text {
  font-size: 12px;
  color: var(--text-2);
}
.analysis__version {
  font-size: 12px;
  color: var(--text-3);
  display: block;
  margin-bottom: 12px;
}
.analysis__intro {
  font-size: 14px;
  color: var(--text-1);
  line-height: 1.6;
  display: block;
  margin-bottom: 16px;
}
.analysis__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.analysis__section-num {
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
.analysis__section-num--info { background: var(--info); }
.analysis__section-num--warn { background: var(--warn); }
.analysis__section-num--ok { background: var(--ok); }
.analysis__section-num--neutral { background: var(--text-3); }
.analysis__section-name {
  font-size: 15px;
  font-weight: 500;
}
.analysis__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}
.analysis__item-dot { color: var(--text-2); }
.analysis__item-text { font-size: 14px; flex: 1; line-height: 1.5; }
.analysis__item-source {
  font-size: 11px;
  color: var(--text-3);
  flex-shrink: 0;
}
.analysis__item-source--ok { color: var(--ok); }
.analysis__item-mark { color: var(--warn); margin-left: 4px; }
.analysis__question {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.analysis__question-icon { color: var(--primary); font-size: 12px; }
.analysis__question-text { font-size: 14px; flex: 1; line-height: 1.5; }
.analysis__video {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.analysis__video-thumb {
  width: 88px;
  height: 66px;
  border-radius: 8px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}
.analysis__video-play { color: var(--primary); font-size: 20px; }
.analysis__video-body { flex: 1; }
.analysis__video-title { font-size: 14px; font-weight: 500; display: block; }
.analysis__video-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.analysis__video-duration { font-size: 12px; color: var(--text-3); }
.analysis__actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.analysis__feedback {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.analysis__report-error {
  font-size: 13px;
  color: var(--text-2);
}
.analysis__waiting {
  font-size: 15px;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}
.analysis__waiting-desc {
  font-size: 13px;
  color: var(--text-2);
}
</style>
