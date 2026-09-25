<template>
  <div class="content-page">
    <h2 class="page-title">审核内容库</h2>
    <div class="content-grid">
      <div class="content-card card" v-for="item in items" :key="item.id">
        <div class="card-header">
          <span class="content-type">{{ item.type }}</span>
          <span class="tag tag-ok">已发布</span>
        </div>
        <h3 class="content-title">{{ item.title }}</h3>
        <p class="content-scope">适用: {{ item.applicable_scope || '暂无' }}</p>
        <p class="content-reason">推荐理由: {{ item.recommendReason || '基于您的病情推荐' }}</p>
      </div>
    </div>
    <div class="empty-state card" v-if="items.length === 0">
      <p>暂无内容</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const items = ref<any[]>([]);

onMounted(async () => {
  try {
    items.value = await api.getPublishedContents();
  } catch (e) {
    console.error('Failed to load contents:', e);
  }
});
</script>

<style scoped>
.content-page {
  padding: 24px 40px;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.content-type {
  font-size: 11px;
  color: var(--primary);
  background: var(--primary-light);
  padding: 2px 8px;
  border-radius: 4px;
}

.content-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
}

.content-scope,
.content-reason {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-3);
}
</style>
