<template>
  <div class="layout">
    <aside class="layout__sidebar">
      <div class="layout__brand">
        <span class="layout__logo">腰</span>
        <span class="layout__brand-name">腰有据 · 后台</span>
      </div>
      <nav class="layout__menu">
        <router-link
          v-for="item in visibleMenu"
          :key="item.to"
          :to="item.to"
          class="layout__menu-item"
          :class="{ 'layout__menu-item--active': isActive(item.to) }"
        >
          {{ item.icon }} {{ item.label }}
        </router-link>
      </nav>
      <div class="layout__sidebar-footer">
        <div class="layout__user">
          <span class="layout__avatar">{{ userInitial }}</span>
          <div>
            <div class="layout__user-name">{{ userName }}</div>
            <div class="layout__user-role">{{ userRole }}</div>
          </div>
        </div>
        <button class="layout__logout" @click="onLogout">退出登录</button>
      </div>
    </aside>
    <div class="layout__content">
      <header class="layout__topbar">
        <span class="layout__env">生产环境</span>
        <div class="layout__topbar-actions">
          <span class="layout__bell">🔔</span>
        </div>
      </header>
      <main class="layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const userName = computed(() => auth.session?.name ?? '未登录');
const userRole = computed(() => auth.session?.roleName ?? '');
const userInitial = computed(() => auth.session?.name?.[0] ?? '管');

interface MenuItem {
  to: string;
  label: string;
  icon: string;
  permission: string;
}

const allMenu: MenuItem[] = [
  { to: '/dashboard', label: '仪表盘', icon: '📊', permission: '*' },
  { to: '/contents', label: '内容库', icon: '📚', permission: 'content:edit' },
  { to: '/evidence', label: '医学证据库', icon: '🔬', permission: 'evidence:review' },
  { to: '/feedback', label: '举报与反馈', icon: '⚑', permission: 'feedback:handle' },
  { to: '/safety', label: '安全与开关', icon: '🛡', permission: 'switch:write' },
  { to: '/models', label: '模型发布', icon: '🤖', permission: 'model:release' },
  { to: '/models/eval', label: '评测集', icon: '📋', permission: 'eval:run' },
  { to: '/users', label: '用户与权限', icon: '👥', permission: '*' },
  { to: '/audit', label: '审计日志', icon: '📜', permission: 'audit:read' },
  { to: '/cases', label: '案例投稿', icon: '📝', permission: 'case:review' },
];

const visibleMenu = computed(() => {
  const perms = auth.session?.permissions ?? [];
  return allMenu.filter((item) => perms.includes('*') || perms.includes(item.permission));
});

function isActive(to: string) {
  return route.path.startsWith(to);
}

function onLogout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.layout__sidebar {
  width: 220px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  position: sticky;
  top: 0;
  height: 100vh;
}
.layout__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 16px;
}
.layout__logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.layout__brand-name {
  font-size: 14px;
  font-weight: 500;
}
.layout__menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.layout__menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
}
.layout__menu-item--active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}
.layout__sidebar-footer {
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.layout__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 8px;
}
.layout__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.layout__user-name {
  font-size: 13px;
  font-weight: 500;
}
.layout__user-role {
  font-size: 11px;
  color: var(--text-3);
}
.layout__logout {
  width: 100%;
  min-height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: none;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}
.layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.layout__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 48px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.layout__env {
  font-size: 11px;
  color: var(--error);
  background: rgba(217, 59, 59, 0.1);
  padding: 1px 8px;
  border-radius: 4px;
}
.layout__bell { font-size: 16px; }
.layout__main {
  padding: 24px;
  flex: 1;
}
</style>
