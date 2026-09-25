<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">腰有据 · 后台</div>
      <nav class="nav">
        <router-link to="/dashboard" class="nav-item">仪表盘</router-link>
        <router-link to="/contents" class="nav-item">内容库</router-link>
        <router-link to="/evidence" class="nav-item">证据库</router-link>
        <router-link to="/feedback" class="nav-item">举报反馈</router-link>
        <router-link to="/safety" class="nav-item">安全事件</router-link>
        <router-link to="/models" class="nav-item">模型发布</router-link>
        <router-link to="/users" class="nav-item">用户权限</router-link>
        <router-link to="/audit" class="nav-item">审计日志</router-link>
        <router-link to="/cases" class="nav-item">案例投稿</router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 32px;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 10px 16px;
  border-radius: 8px;
  color: var(--text-2);
  text-decoration: none;
  font-size: 14px;
}

.nav-item:hover,
.nav-item.router-link-active {
  background: var(--primary-light);
  color: var(--primary);
}

.sidebar-footer {
  margin-top: 16px;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 24px 40px;
  overflow-y: auto;
}
</style>
