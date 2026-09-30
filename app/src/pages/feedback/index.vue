<template>
  <view class="feedback">
    <view class="feedback__header">
      <text class="feedback__back" @click="goBack">‹</text>
      <text class="feedback__title">反馈与举报</text>
    </view>

    <!-- 页签 -->
    <view class="feedback__tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="feedback__tab"
        :class="{ 'feedback__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 自动附带 -->
    <view class="feedback__attached">
      <text class="feedback__attached-title">关于哪条内容（自动附带）</text>
      <view class="feedback__attached-row">
        <text class="feedback__attached-label">内容</text>
        <text class="feedback__attached-value">一页分析 {{ analysisVersion || '—' }}</text>
      </view>
      <view class="feedback__attached-row">
        <text class="feedback__attached-label">版本</text>
        <text class="feedback__attached-value">分析 {{ analysisVersion || '—' }} · 模型 {{ analysisModel || '—' }}</text>
      </view>
      <view class="feedback__attached-row">
        <text class="feedback__attached-label">时间</text>
        <text class="feedback__attached-value">{{ analysisTime || '—' }}</text>
      </view>
    </view>

    <!-- 问题类型 -->
    <view class="card">
      <text class="card-title">问题类型（可多选）</text>
      <view class="feedback__chips">
        <AppChip
          v-for="opt in problemTypes"
          :key="opt"
          :state="problems.includes(opt) ? 'selected' : 'unselected'"
          @click="toggleProblem(opt)"
        >
          {{ opt }}
        </AppChip>
      </view>
    </view>

    <!-- 具体描述 -->
    <view class="card">
      <text class="card-title">具体描述</text>
      <textarea
        v-model="description"
        class="feedback__textarea"
        placeholder="例如：报告写的是右侧，但解释里说成了左侧……"
        placeholder-class="feedback__placeholder"
        :maxlength="5000"
      />
      <text class="feedback__add-image">添加截图（可选）</text>
    </view>

    <!-- 单条授权 -->
    <view class="feedback__authorize" @click="authorized = !authorized">
      <view class="feedback__checkbox" :class="{ 'feedback__checkbox--checked': authorized }">
        <Icon name="check" :size="18" v-if="authorized" />
      </view>
      <text class="feedback__authorize-text">
        允许审核人员为处理这条举报查看相关资料（仅限本条分析涉及的报告与记录，可随时撤回）
      </text>
    </view>

    <TipBar type="info">
      你的反馈不会自动进入医学知识库。它会由运营编辑和临床审核人员处理，能定位受影响的版本与用户；处理结果会通知你。
    </TipBar>

    <AppButton block @click="onSubmit">提交举报</AppButton>
    <text class="feedback__cancel" @click="goBack">取消</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Icon from '@/components/Icon.vue';
import AppChip from '@/components/AppChip.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { listEpisodes, getLatestAnalysis, createErrorReport, createHelpFeedback } from '@/api';

const tabs = [
  { key: 'help', label: '帮助类型反馈' },
  { key: 'report', label: '错误举报' },
];
const problemTypes = [
  '事实错误',
  '与我的报告不符',
  '越界（给了不该给的判断）',
  '缺少重要就医提示',
  '看不懂',
  '左右侧/日期混淆',
  '隐私问题',
  '其他',
];

const activeTab = ref('report');
const problems = ref<string[]>([]);
const description = ref('');
const authorized = ref(false);
const analysisId = ref('');
const analysisVersion = ref('');
const analysisModel = ref('');
const analysisTime = ref('');

function toggleProblem(opt: string) {
  const idx = problems.value.indexOf(opt);
  if (idx >= 0) problems.value.splice(idx, 1);
  else problems.value.push(opt);
}

function goBack() {
  uni.navigateBack();
}

async function onSubmit() {
  if (!analysisId.value) {
    uni.showToast({ title: '请先生成一页分析', icon: 'none' });
    return;
  }
  if (activeTab.value === 'help') {
    try {
      await createHelpFeedback(analysisId.value, '都不好', description.value || undefined);
      uni.showToast({ title: '感谢反馈', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 1000);
    } catch (e) {
      uni.showToast({ title: (e as Error).message, icon: 'none' });
    }
    return;
  }
  if (problems.value.length === 0) {
    uni.showToast({ title: '请选择问题类型', icon: 'none' });
    return;
  }
  try {
    await createErrorReport(analysisId.value, description.value || problems.value.join('、'), '中', problems.value, authorized.value);
    uni.showToast({ title: '已提交举报', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

onMounted(async () => {
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const analysis = await getLatestAnalysis(episodes[0].id);
      if (analysis) {
        analysisId.value = analysis.id;
        analysisVersion.value = `v${analysis.version}`;
        analysisModel.value = analysis.modelReleaseId;
        analysisTime.value = analysis.createdAt.slice(0, 10);
      }
    }
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.feedback {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.feedback__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.feedback__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.feedback__title {
  font-size: 17px;
  font-weight: 500;
}
.feedback__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.feedback__tab {
  flex: 1;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 14px;
  color: var(--text-2);
}
.feedback__tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.feedback__attached {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.feedback__attached-title {
  font-size: 14px;
  font-weight: 500;
  display: block;
  margin-bottom: 12px;
}
.feedback__attached-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.feedback__attached-label {
  font-size: 13px;
  color: var(--text-2);
  width: 40px;
  flex-shrink: 0;
}
.feedback__attached-value {
  font-size: 13px;
  flex: 1;
  line-height: 1.5;
}
.feedback__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.feedback__textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.feedback__placeholder {
  color: var(--text-3);
}
.feedback__add-image {
  font-size: 13px;
  color: var(--primary);
}
.feedback__authorize {
  display: flex;
  gap: 10px;
  background: var(--primary-light);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.feedback__checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
  margin-top: 2px;
}
.feedback__checkbox--checked {
  background: var(--primary);
  border-color: var(--primary);
}
.feedback__authorize-text {
  font-size: 12px;
  color: var(--text-2);
  flex: 1;
  line-height: 1.5;
}
.feedback__cancel {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 16px;
  min-height: 44px;
  line-height: 44px;
}
</style>
