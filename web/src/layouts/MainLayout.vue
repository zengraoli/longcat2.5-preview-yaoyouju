<template>
  <div class="main-layout">
    <header class="topbar">
      <div class="brand">
        <span class="brand-logo">腰</span>
        <span class="brand-name">腰有据</span>
      </div>
      <nav class="topnav">
        <router-link to="/dashboard" class="topnav-item">当前情况</router-link>
        <router-link to="/qa" class="topnav-item">问与解释</router-link>
        <router-link to="/timeline" class="topnav-item">病程</router-link>
        <router-link to="/followup" class="topnav-item">复诊准备</router-link>
        <router-link to="/content" class="topnav-item">审核内容库</router-link>
      </nav>
      <div class="topbar-right">
        <button class="emergency-btn" @click="showEmergency = true">紧急就医提示</button>
        <button class="icon-btn" aria-label="通知">
          <img src="@/assets/icons/ic_bell.png" alt="通知" />
        </button>
        <router-link to="/account" class="avatar" aria-label="我的账户">U</router-link>
      </div>
    </header>
    <main class="content">
      <router-view />
    </main>

    <div v-if="showEmergency" class="emergency-modal-mask" @click.self="showEmergency = false">
      <div class="emergency-modal">
        <div class="emergency-modal-head">
          <img src="@/assets/icons/ic_warn.png" alt="" class="emergency-modal-icon" />
          <span>紧急就医提示</span>
        </div>
        <p class="emergency-modal-body">
          如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。
        </p>
        <div class="emergency-modal-actions">
          <button class="btn-primary" @click="showEmergency = false">我知道了</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const showEmergency = ref(false);
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: var(--bg);
}

.topbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 40px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  gap: 40px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
}

.topnav {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
}

.topnav-item {
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
  padding: 4px 2px;
  border-bottom: 2px solid transparent;
}

.topnav-item.router-link-active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 500;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emergency-btn {
  background: rgba(217, 59, 59, 0.1);
  color: var(--error);
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn img {
  width: 22px;
  height: 22px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.content {
  padding: 24px 40px;
}

.emergency-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(27, 34, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.emergency-modal {
  width: 420px;
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
}

.emergency-modal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
  color: var(--error);
  margin-bottom: 12px;
}

.emergency-modal-icon {
  width: 24px;
  height: 24px;
}

.emergency-modal-body {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.6;
  margin-bottom: 20px;
}
</style>
