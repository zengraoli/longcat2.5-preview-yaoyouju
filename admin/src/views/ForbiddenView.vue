<template>
  <AppLayout>
    <div class="forbidden">
      <div class="forbidden__code">403</div>
      <h1 class="forbidden__title">没有权限访问该页面</h1>
      <p class="forbidden__desc">
        当前角色（{{ auth.session?.roleName ?? '未知' }}）没有该页面的访问权限。如需访问，请联系超级管理员调整角色权限。
      </p>
      <button class="btn btn--primary" @click="goBack">返回仪表盘</button>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

function goBack() {
  router.push({ name: 'dashboard' });
}
</script>

<style scoped>
.forbidden {
  text-align: center;
  padding: 48px 24px;
}
.forbidden__code {
  font-size: 48px;
  font-weight: 600;
  color: var(--error);
  margin-bottom: 12px;
}
.forbidden__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 8px;
}
.forbidden__desc {
  font-size: 14px;
  color: var(--text-2);
  margin: 0 0 24px;
}
.btn {
  min-height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  font-size: 14px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn--primary {
  background: var(--primary);
  color: #fff;
}
</style>
