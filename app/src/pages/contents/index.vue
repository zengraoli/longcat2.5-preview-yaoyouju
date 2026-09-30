<template>
  <view class="contents">
    <view class="contents__header">
      <text class="contents__back" @click="goBack">‹</text>
      <text class="contents__title">审核内容库</text>
      <text class="contents__search">🔍</text>
    </view>

    <!-- 筛选 -->
    <scroll-view scroll-x class="contents__filters">
      <view
        v-for="f in filters"
        :key="f"
        class="contents__filter"
        :class="{ 'contents__filter--active': activeFilter === f }"
        @click="activeFilter = f"
      >
        {{ f }}
      </view>
    </scroll-view>

    <TipBar type="info">
      这里的内容都经过临床审定，附字幕与文字替代。示意图不是你的真实病变，不能据此判断本人病因。
    </TipBar>

    <!-- 为你推荐 -->
    <text class="contents__section-title">为你推荐（原因：你的报告提到 L5/S1、硬膜囊受压）</text>
    <view
      v-for="item in recommended"
      :key="item.id"
      class="contents__card"
      @click="goDetail(item)"
    >
      <view class="contents__thumb">
        <text class="contents__thumb-icon">{{ item.type === '视频' ? '▶' : '🖼' }}</text>
      </view>
      <view class="contents__body">
        <text class="contents__item-title">{{ item.title }}</text>
        <text class="contents__item-meta">{{ item.type === '视频' ? '视频' : '图文' }} · {{ item.type === '视频' ? '2:10' : '3分钟阅读' }}</text>
        <view class="contents__tags">
          <StatusTag label="已审核 v2" />
          <text class="contents__scope">适用：{{ item.applicableScope }}</text>
        </view>
      </view>
    </view>

    <!-- 全部内容 -->
    <text class="contents__section-title">全部内容（{{ all.length }}）</text>
    <view
      v-for="item in all"
      :key="item.id"
      class="contents__card"
      @click="goDetail(item)"
    >
      <view class="contents__thumb">
        <text class="contents__thumb-icon">{{ item.type === '视频' ? '▶' : '🖼' }}</text>
      </view>
      <view class="contents__body">
        <text class="contents__item-title">{{ item.title }}</text>
        <text class="contents__item-meta">{{ item.type === '视频' ? '视频' : '图文' }}</text>
        <view class="contents__tags">
          <StatusTag label="已审核" />
          <text class="contents__scope">适用：{{ item.applicableScope || '所有用户' }}</text>
        </view>
      </view>
    </view>

    <TipBar type="warn">
      本库不包含实时生成的个性化查体或训练处方；康复动作内容待专业设计与审定后再加入。
    </TipBar>

  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { listPublishedContents, type ContentItem } from '@/api';

const filters = ['全部', '报告术语', '节段位置', '医生会观察什么', '信息来源怎么看', '生活影响'];
const activeFilter = ref('全部');
const recommended = ref<ContentItem[]>([]);
const all = ref<ContentItem[]>([]);


function goBack() {
  uni.navigateBack();
}

function goDetail(item: ContentItem) {
  uni.navigateTo({ url: `/pages/content-detail/index?id=${item.id}` });
}

onMounted(async () => {
  try {
    const items = await listPublishedContents();
    recommended.value = items.slice(0, 2);
    all.value = items.slice(2);
  } catch {
    // 加载失败不阻塞
  }
});
</script>

<style scoped>
.contents {
  min-height: 100vh;
  padding: 16px 16px 100px;
}
.contents__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.contents__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.contents__title {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
}
.contents__search { font-size: 18px; }
.contents__filters {
  white-space: nowrap;
  margin-bottom: 16px;
}
.contents__filter {
  display: inline-block;
  min-height: 36px;
  padding: 0 16px;
  line-height: 36px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-2);
  margin-right: 8px;
}
.contents__filter--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.contents__section-title {
  font-size: 14px;
  color: var(--text-2);
  display: block;
  margin: 16px 0 12px;
}
.contents__card {
  display: flex;
  gap: 12px;
  background: var(--surface);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.contents__card--offline {
  opacity: 0.5;
}
.contents__thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.contents__thumb-icon { color: var(--primary); font-size: 20px; }
.contents__body { flex: 1; }
.contents__item-title {
  font-size: 15px;
  font-weight: 500;
  display: block;
}
.contents__item-meta {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
}
.contents__tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.contents__scope {
  font-size: 11px;
  color: var(--text-3);
}
</style>
