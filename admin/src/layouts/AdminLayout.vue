<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-logo">腰</span>
        <div class="brand-text">
          <span class="brand-name">腰有据 · 管理后台</span>
          <span class="brand-version">v0.1</span>
        </div>
      </div>
      <nav class="side-nav">
        <router-link to="/dashboard" class="side-item">
          <img src="@/assets/icons/ic_dashboard.png" alt="" /><span>仪表盘</span>
        </router-link>
        <router-link to="/contents" class="side-item">
          <img src="@/assets/icons/ic_contents.png" alt="" /><span>内容库</span>
        </router-link>
        <router-link to="/evidence" class="side-item">
          <img src="@/assets/icons/ic_evidence.png" alt="" /><span>医学证据库</span>
        </router-link>
        <router-link to="/feedback" class="side-item">
          <img src="@/assets/icons/ic_feedback.png" alt="" /><span>举报与反馈</span>
        </router-link>
        <router-link to="/safety" class="side-item">
          <img src="@/assets/icons/ic_safety.png" alt="" /><span>安全与开关</span>
        </router-link>
        <router-link to="/models" class="side-item">
          <img src="@/assets/icons/ic_models.png" alt="" /><span>模型与评测</span>
        </router-link>
        <router-link to="/users" class="side-item">
          <img src="@/assets/icons/ic_users.png" alt="" /><span>用户与权限</span>
        </router-link>
        <router-link to="/audit" class="side-item">
          <img src="@/assets/icons/ic_audit.png" alt="" /><span>审计日志</span>
        </router-link>
        <router-link to="/cases" class="side-item">
          <img src="@/assets/icons/ic_cases.png" alt="" /><span>案例投稿（二期）</span>
        </router-link>
      </nav>
      <div class="sidebar-user">
        <span class="user-avatar">{{ auth.user?.name?.slice(0, 1) || '管' }}</span>
        <div class="user-meta">
          <span class="user-name">{{ auth.user?.name || '管理员' }}</span>
          <span class="user-role">{{ roleName }}</span>
        </div>
        <button class="logout-icon" @click="handleLogout" aria-label="退出登录">
          <img src="@/assets/icons/ic_logout.png" alt="" />
        </button>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <span class="env-badge">生产环境</span>
        </div>
        <div class="topbar-right">
          <div class="search-box">
            <img src="@/assets/icons/ic_search.png" alt="" />
            <input placeholder="搜索内容 / 工单 / 匿名标识" />
          </div>
          <button class="top-icon" aria-label="通知">
            <img src="@/assets/icons/ic_bell.png" alt="" />
          </button>
          <span class="role-badge">角色：{{ roleName }}</span>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const ROLE_NAMES: Record<string, string> = {
  'role-1': '运营编辑',
  'role-2': '临床审核',
  'role-3': '技术',
  'role-4': '合规',
  'role-5': '超级管理',
};

const roleName = computed(() => ROLE_NAMES[auth.user?.roleId || ''] || '管理员');

const PAGE_TITLES: Record<string, string> = {
  dashboard: '仪表盘',
  contents: '内容库',
  'content-detail': '内容详情',
  evidence: '医学证据库',
  feedback: '举报与反馈',
  safety: '安全与开关',
  models: '模型与评测',
  users: '用户与权限',
  audit: '审计日志',
  cases: '案例投稿',
  eval: '评测集',
};

const pageTitle = computed(() => PAGE_TITLES[route.name as string] || '仪表盘');

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
}

/* 深色侧栏 */
.sidebar {
  width: 232px;
  background: #0d383d;
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
}

.brand-logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #ffffff;
  color: #0f6e74;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  flex-shrink: 0;
}

.brand-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.brand-version {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.side-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.side-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
}

.side-item img {
  width: 18px;
  height: 18px;
  opacity: 0.8;
}

.side-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.side-item.router-link-active {
  background: var(--primary);
  color: #fff;
}

.side-item.router-link-active img {
  opacity: 1;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 16px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 13px;
  color: #fff;
}

.user-role {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 2px;
}

.logout-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.logout-icon img {
  width: 18px;
  height: 18px;
  opacity: 0.7;
}

/* 主区域 */
.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-1);
}

.env-badge {
  font-size: 11px;
  color: var(--error);
  background: rgba(217, 59, 59, 0.08);
  border-radius: 4px;
  padding: 3px 8px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 260px;
  height: 36px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
}

.search-box img {
  width: 16px;
  height: 16px;
  opacity: 0.5;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: 13px;
  color: var(--text-1);
}

.top-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.top-icon img {
  width: 20px;
  height: 20px;
  opacity: 0.6;
}

.role-badge {
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-light);
  border-radius: 6px;
  padding: 6px 12px;
}

.content {
  padding: 24px 28px;
}
</style>
