<template>
  <view class="page">
    <view class="header">
      <text class="page-title">审核内容库</text>
      <text class="page-subtitle">经过医学审核的健康教育内容</text>
    </view>

    <view class="filter-row">
      <view
        v-for="f in filters"
        :key="f.key"
        class="filter-chip"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        {{ f.label }}
      </view>
    </view>

    <view class="content-grid">
      <view class="content-card" v-for="item in filteredItems" :key="item.id">
        <view class="card-badge">
          <text class="badge-icon">{{ item.type === '视频' ? '▶' : '📄' }}</text>
        </view>
        <view class="card-body">
          <text class="card-title">{{ item.title }}</text>
          <text class="card-scope">适用: {{ item.applicable_scope || '暂无' }}</text>
          <view class="card-footer">
            <StatusTag type="ok" label="已发布" />
            <text class="card-reason">{{ item.recommendReason || '' }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="filteredItems.length === 0">
      <text class="empty-text">暂无内容</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import StatusTag from '../../components/StatusTag.vue';
import { api } from '../../api/request';

const items = ref<any[]>([]);
const activeFilter = ref('all');

const filters = [
  { key: 'all', label: '全部' },
  { key: '视频', label: '视频' },
  { key: '图文组件', label: '图文' },
];

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return items.value;
  return items.value.filter(i => i.type === activeFilter.value);
});

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
  padding: 32rpx;
}

.header {
  margin-bottom: 24rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-1);
  display: block;
}

.page-subtitle {
  font-size: 24rpx;
  color: var(--text-2);
  margin-top: 12rpx;
  display: block;
}

.filter-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.filter-chip {
  padding: 12rpx 28rpx;
  background: var(--surface);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;

  &.active {
    background: var(--primary-light);
    color: var(--primary);
    border-color: var(--primary);
  }
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.content-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 28rpx;
  display: flex;
  align-items: flex-start;
}

.card-badge {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.badge-icon {
  font-size: 32rpx;
}

.card-body {
  flex: 1;
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-1);
  display: block;
}

.card-scope {
  font-size: 22rpx;
  color: var(--text-2);
  margin-top: 8rpx;
  display: block;
}

.card-footer {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  gap: 12rpx;
}

.card-reason {
  font-size: 20rpx;
  color: var(--text-3);
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 26rpx;
  color: var(--text-3);
}
</style>
