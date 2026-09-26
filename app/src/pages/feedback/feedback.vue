<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">反馈与举报</text>
      </view>
    </view>

    <view class="tabs">
      <view class="tab" :class="{ active: mode === 'feedback' }" @click="mode = 'feedback'">帮助类型反馈</view>
      <view class="tab" :class="{ active: mode === 'report' }" @click="mode = 'report'">错误举报</view>
    </view>

    <view class="auto-info">
      <view class="auto-row">
        <image src="/static/icons/ic_doc.png" class="auto-icon" />
        <text class="auto-title">关于哪条内容（自动附带）</text>
      </view>
      <view class="kv-row">
        <text class="kv-label">内容</text>
        <text class="kv-value">一页分析 v{{ analysisVersion }} · ②-2 “硬膜囊受压”解释</text>
      </view>
      <view class="kv-row">
        <text class="kv-label">版本</text>
        <text class="kv-value">分析 v{{ analysisVersion }} · 模型 M-2609 · 科普 #07 v1 · 检索策略 R-4</text>
      </view>
      <view class="kv-row">
        <text class="kv-label">时间</text>
        <text class="kv-value">{{ now }}</text>
      </view>
    </view>

    <block v-if="mode === 'report'">
      <view class="card">
        <text class="card-title">问题类型（可多选）</text>
        <view class="chip-group">
          <view
            v-for="c in errorCategories"
            :key="c"
            class="chip"
            :class="{ selected: selectedCategories.includes(c) }"
            @click="toggleCategory(c)"
          >{{ c }}</view>
        </view>
      </view>
    </block>

    <view class="card">
      <text class="card-title">{{ mode === 'report' ? '具体描述' : '你想反馈什么？' }}</text>
      <textarea
        class="text-area"
        v-model="description"
        :placeholder="mode === 'report' ? '例如：报告写的是右侧，但解释里说成了左侧……' : '例如：看懂了 / 知道下一步 / 都不好，问题没解决'"
        placeholder-class="placeholder"
        :maxlength="2000"
      />
      <view class="add-screenshot" v-if="mode === 'report'">
        <image src="/static/icons/ic_image.png" class="shot-icon" />
        <text class="shot-text">添加截图（可选）</text>
      </view>
    </view>

    <view class="consent-card" v-if="mode === 'report'">
      <view class="checkbox" :class="{ checked: grantView }" @click="grantView = !grantView">
        <text v-if="grantView" class="check-icon">✓</text>
      </view>
      <text class="consent-text">允许审核人员为处理这条举报查看相关资料（仅限本条分析涉及的报告与记录，可随时撤回）</text>
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">你的反馈不会自动进入医学知识库。它会由运营编辑和临床审核人员处理，能定位受影响的版本与用户；处理结果会通知你。</text>
    </view>

    <view class="footer">
      <button class="primary-btn" @click="submit">{{ mode === 'report' ? '提交举报' : '提交反馈' }}</button>
      <text class="cancel-text" @click="goBack">取消</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../api/request';

const mode = ref<'feedback' | 'report'>('report');
const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
const analysisVersion = ref(3);
const description = ref('');
const grantView = ref(true);

const errorCategories = ['事实错误', '与我的报告不符', '越界（给了不该给的判断）', '缺少重要就医提示', '看不懂', '左右侧/日期混淆', '隐私问题', '其他'];
const selectedCategories = ref<string[]>(['与我的报告不符', '左右侧/日期混淆']);

function toggleCategory(c: string) {
  const idx = selectedCategories.value.indexOf(c);
  if (idx >= 0) selectedCategories.value.splice(idx, 1);
  else selectedCategories.value.push(c);
}

function goBack() {
  uni.navigateBack();
}

async function submit() {
  try {
    const data: any = {
      isErrorReport: mode.value === 'report',
      errorDescription: description.value,
    };
    // 自动附带当前分析 ID（设计：关于哪条内容自动附带版本）
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (episodeId) {
      const latest = await api.getLatestAnalysis(episodeId);
      if (latest.status === 'ok') data.analysisId = latest.analysisId;
    }
    if (mode.value === 'report') {
      data.errorCategory = selectedCategories.value.join('、');
      data.severity = 'medium';
    } else {
      data.helpType = description.value || '其他';
    }
    await api.createFeedback(data);
    uni.showToast({ title: '提交成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
}

onMounted(async () => {
  try {
    const episodes = await api.getEpisodes();
    const episodeId = episodes[0]?.id;
    if (episodeId) {
      const latest = await api.getLatestAnalysis(episodeId);
      if (latest.status === 'ok') analysisVersion.value = latest.version;
    }
  } catch (e) {
    console.error('Failed to load analysis version:', e);
  }
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 48rpx;
}

.header {
  padding: 32rpx 0 24rpx;
}

.back-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.back-icon {
  width: 36rpx;
  height: 36rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-1);
}

.tabs {
  display: flex;
  gap: 8rpx;
  background: var(--surface);
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 26rpx;
  color: var(--text-2);
  border-radius: 12rpx;
}

.tab.active {
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(27, 34, 48, 0.08);
  color: var(--text-1);
  font-weight: 500;
}

.auto-info {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.auto-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.auto-icon {
  width: 36rpx;
  height: 36rpx;
}

.auto-title {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
}

.kv-row {
  display: flex;
  gap: 20rpx;
  padding: 10rpx 0;
}

.kv-label {
  font-size: 22rpx;
  color: var(--text-3);
  width: 72rpx;
  flex-shrink: 0;
}

.kv-value {
  font-size: 24rpx;
  color: var(--text-1);
  flex: 1;
  line-height: 1.5;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 24rpx;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  padding: 14rpx 28rpx;
  background: var(--bg);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.chip.selected {
  background: var(--primary);
  color: #fff;
}

.text-area {
  width: 100%;
  height: 200rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-1);
  box-sizing: border-box;
  margin-bottom: 16rpx;
}

.add-screenshot {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.shot-icon {
  width: 32rpx;
  height: 32rpx;
}

.shot-text {
  font-size: 24rpx;
  color: var(--primary);
}

.consent-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: var(--primary-light);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid var(--border);
  border-radius: 8rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  margin-top: 4rpx;
}

.checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
}

.check-icon {
  color: #fff;
  font-size: 24rpx;
}

.consent-text {
  font-size: 24rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
}

.alert-icon {
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.alert-text {
  font-size: 24rpx;
  color: var(--text-1);
  line-height: 1.6;
  flex: 1;
}

.footer {
  padding: 24rpx 0;
}

.cancel-text {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: var(--primary);
  margin-top: 32rpx;
}
</style>
