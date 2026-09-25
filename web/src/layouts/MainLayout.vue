<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="logo">腰有据</div>
      <nav class="nav">
        <router-link to="/dashboard" class="nav-item">工作台</router-link>
        <router-link to="/qa" class="nav-item">问与解释</router-link>
        <router-link to="/timeline" class="nav-item">病程</router-link>
        <router-link to="/followup" class="nav-item">复诊准备</router-link>
        <router-link to="/content" class="nav-item">内容库</router-link>
        <router-link to="/account" class="nav-item">账户</router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="emergency-btn" @click="showEmergency">紧急求助</button>
      </div>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">


function showEmergency() {
  alert('如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。');
}
</script>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 200px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.logo {
  font-size: 20px;
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
  padding: 12px 16px;
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

.emergency-btn {
  width: 100%;
  padding: 12px;
  background: rgba(217, 59, 59, 0.1);
  color: var(--error);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 24px 40px;
  overflow-y: auto;
}
</style>
