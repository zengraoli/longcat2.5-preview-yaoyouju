<template>
  <view class="page">
    <view class="header">
      <view class="back-row">
        <image src="/static/icons/ic_chevron_left.png" class="back-icon" @click="goBack" />
        <text class="page-title">审核内容库</text>
      </view>
      <image src="/static/icons/ic_search.png" class="action-icon" />
    </view>

    <view class="chip-bar">
      <view
        v-for="f in filters"
        :key="f"
        class="chip"
        :class="{ selected: activeFilter === f }"
        @click="activeFilter = f"
      >{{ f }}</view>
    </view>

    <view class="info-alert">
      <image src="/static/icons/ic_info.png" class="alert-icon" />
      <text class="alert-text">这里的内容都经过临床审定，附字幕与文字替代。示意图不是你的真实病变，不能据此判断本人病因。</text>
    </view>

    <view class="section-label">为你推荐（原因：你的报告提到 L5/S1、硬膜囊受压）</view>
    <view class="card recommend-card" v-if="recommend" @click="openVideo(recommend)">
      <view class="rec-thumb">
        <image src="/static/icons/ic_play.png" class="play-icon" />
      </view>
      <view class="rec-info">
        <text class="rec-title">{{ recommend.title }}</text>
        <view class="tag-row">
          <text class="src-tag tag-ok">已审核 v2</text>
          <text class="src-tag tag-time">2:10</text>
          <text class="src-tag tag-scope">适用：报告术语</text>
        </view>
      </view>
    </view>

    <view class="section-label">全部内容（{{ items.length }} / 12）</view>
    <view class="content-list">
      <view
        class="card content-item"
        :class="{ dimmed: item.current_status === '已撤回或已下线' }"
        v-for="item in filteredItems"
        :key="item.id"
        @click="openVideo(item)"
      >
        <view class="item-thumb">
          <image src="/static/icons/ic_play.png" class="thumb-icon" v-if="item.type === '视频'" />
          <image src="/static/icons/ic_image.png" class="thumb-icon" v-else />
        </view>
        <view class="item-info">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-meta">{{ item.type === '视频' ? '视频 · ' + (item.duration || '2:10') + ' · 字幕' : '图文 · 3 分钟阅读' }}</text>
          <view class="tag-row">
            <text class="src-tag" :class="statusClass(item.current_status)">{{ statusLabel(item.current_status) }}</text>
            <text class="src-tag tag-scope">{{ scopeLabel(item.applicable_scope) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="warn-alert">
      <image src="/static/icons/ic_warn.png" class="alert-icon" />
      <text class="alert-text">本库不包含实时生成的个性化查体或训练处方；康复动作内容待专业设计与审定后再加入。</text>
    </view>

    <MainTabBar active-tab="index" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MainTabBar from '../../components/MainTabBar.vue';
import StatusTag from '../../components/StatusTag.vue';
import { api } from '../../api/request';

const items = ref<any[]>([]);
const activeFilter = ref('全部');

const filters = ['全部', '报告术语', '节段位置', '医生会观察什么', '信息来源怎么看', '生活影响'];

const recommend = computed(() => items.value[0] || null);

const filteredItems = computed(() => items.value);

function statusLabel(s: string) {
  return s === '已发布' ? '已审核 v' + 1 : s === '已审定' ? '已审定' : s;
}
function statusClass(s: string) {
  return s === '已发布' ? 'tag-ok' : s === '更正中' ? 'tag-error' : 'tag-warn';
}
function scopeLabel(s?: string | null) {
  if (!s) return '适用：报告术语';
  if (s.includes('L5/S1') || s.includes('节段')) return '适用：节段位置';
  if (s.includes('信息来源')) return '适用：信息来源';
  if (s.includes('生活') || s.includes('日常')) return '适用：生活影响';
  if (s.includes('复诊')) return '适用：医生会观察什么';
  return '适用：报告术语';
}

function goBack() {
  uni.navigateBack();
}

function openVideo(item: any) {
  uni.navigateTo({ url: `/pages/video/video?id=${item.id}&title=${encodeURIComponent(item.title)}` });
}

onMounted(async () => {
  try {
    items.value = await api.getPublishedContents();
  } catch (e) {
    console.error('Failed to load contents:', e);
  }
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx 160rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.action-icon {
  width: 36rpx;
  height: 36rpx;
}

.chip-bar {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  margin-bottom: 24rpx;
}

.chip {
  padding: 14rpx 32rpx;
  background: var(--surface);
  border-radius: 24rpx;
  font-size: 24rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.chip.selected {
  background: var(--primary);
  color: #fff;
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
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

.section-label {
  font-size: 26rpx;
  color: var(--text-1);
  display: block;
  margin-bottom: 16rpx;
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.recommend-card {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.rec-thumb {
  width: 110rpx;
  height: 84rpx;
  border-radius: 12rpx;
  background: #DDE5EA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.play-icon {
  width: 40rpx;
  height: 40rpx;
  background: var(--primary);
  border-radius: 8rpx;
  padding: 6rpx;
}

.rec-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 10rpx;
}

.tag-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.src-tag {
  font-size: 20rpx;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.tag-ok {
  background: rgba(30, 158, 90, 0.1);
  color: var(--ok);
}

.tag-warn {
  background: rgba(199, 119, 0, 0.1);
  color: var(--warn);
}

.tag-error {
  background: rgba(217, 59, 59, 0.08);
  color: var(--error);
}

.tag-time {
  background: var(--bg);
  color: var(--text-3);
}

.tag-scope {
  background: var(--bg);
  color: var(--text-2);
}

.content-item {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 28rpx;
}

.content-item.dimmed {
  opacity: 0.45;
}

.item-thumb {
  width: 88rpx;
  height: 64rpx;
  border-radius: 12rpx;
  background: #DDE5EA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thumb-icon {
  width: 32rpx;
  height: 32rpx;
  background: var(--primary);
  border-radius: 6rpx;
  padding: 4rpx;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  margin-bottom: 6rpx;
}

.item-meta {
  font-size: 22rpx;
  color: var(--text-3);
  display: block;
  margin-bottom: 10rpx;
}

.warn-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(199, 119, 0, 0.08);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-top: 24rpx;
}

.warn-alert .alert-text {
  color: var(--warn);
}
</style>
