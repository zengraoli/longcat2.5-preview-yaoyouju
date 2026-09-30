<template>
  <div class="layout">
    <aside class="layout__sidebar">
      <div class="layout__brand">
        <span class="layout__logo">腰</span>
        <span class="layout__brand-name">腰有据 · 管理后台</span>
      </div>
      <nav class="layout__menu">
        <router-link
          v-for="item in visibleMenu"
          :key="item.to"
          :to="item.to"
          class="layout__menu-item"
          :class="{ 'layout__menu-item--active': isActive(item.to) }"
        >
          <Icon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
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
          <span class="layout__role">角色：{{ userRole }}</span>
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
import Icon from '@/components/Icon.vue';

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
  { to: '/dashboard', label: '仪表盘', icon: 'dashboard', permission: '' },
  { to: '/contents', label: '内容库', icon: 'contents', permission: 'content:read' },
  { to: '/evidence', label: '医学证据库', icon: 'evidence', permission: 'evidence:create' },
  { to: '/feedback', label: '举报与反馈', icon: 'feedback', permission: 'feedback:triage' },
  { to: '/safety', label: '安全与开关', icon: 'safety', permission: '' },
  { to: '/models', label: '模型发布', icon: 'models', permission: 'model:read' },
  { to: '/models/eval', label: '评测集', icon: 'eval', permission: 'eval:read' },
  { to: '/users', label: '用户与权限', icon: 'users', permission: 'member:read' },
  { to: '/audit', label: '审计日志', icon: 'audit', permission: 'audit:read' },
  { to: '/cases', label: '案例投稿', icon: 'cases', permission: 'case:review' },
];

const visibleMenu = computed(() => {
  const perms = auth.session?.permissions ?? [];
  return allMenu.filter((item) => {
    // 仪表盘、安全与开关：所有后台角色可见（安全事件对所有角色可读）
    if (!item.permission) return true;
    // 内容库：编辑或审定角色都可见
    if (item.permission === 'content:read') {
      return perms.includes('content:read') || perms.includes('content:edit') || perms.includes('content:review');
    }
    // 证据库：录入或核实角色可见
    if (item.permission === 'evidence:create') {
      return perms.includes('evidence:create') || perms.includes('evidence:review');
    }
    // 举报：初筛或复核角色可见
    if (item.permission === 'feedback:triage') {
      return perms.includes('feedback:triage') || perms.includes('feedback:review');
    }
    // 模型发布：发布或读取角色可见
    if (item.permission === 'model:read') {
      return perms.includes('model:read') || perms.includes('model:release');
    }
    // 评测集：运行或读取角色可见
    if (item.permission === 'eval:read') {
      return perms.includes('eval:read') || perms.includes('eval:run');
    }
    return perms.includes(item.permission);
  });
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
  background: #0B3B40;
  color: #fff;
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
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
}
.layout__menu-item--active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
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
  color: #fff;
}
.layout__user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}
.layout__logout {
  width: 100%;
  min-height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: none;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
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
.layout__role {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 10px;
  border-radius: 4px;
}
.layout__bell { font-size: 16px; }
.layout__main {
  padding: 24px;
  flex: 1;
}
</style>
