<template>
  <div class="login-page">
    <div class="login-box">
      <h1 class="login-title">腰有据 · 后台管理</h1>
      <p class="env-badge">演示环境</p>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>账号</label>
          <input v-model="username" type="text" placeholder="请输入账号" autocomplete="username" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <div class="form-group">
          <label>TOTP 验证码</label>
          <input v-model="totp" type="text" placeholder="6 位 TOTP 验证码" maxlength="6" />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p class="login-hint">演示 TOTP 固定码：123456</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, setToken } from '../../utils/api';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const username = ref('');
const password = ref('');
const totp = ref('');
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    const res = await api.adminLogin({
      username: username.value,
      password: password.value,
      totp: totp.value,
    });
    setToken(res.sessionToken);
    auth.setSession(res.sessionToken, { adminUserId: res.adminUserId, roleId: res.roleId, name: username.value });
    router.push('/dashboard');
  } catch (e: any) {
    alert(e.message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.login-box {
  width: 400px;
  background: var(--surface);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.login-title {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
}

.env-badge {
  display: inline-block;
  font-size: 11px;
  color: var(--warn);
  background: rgba(199,119,0,0.1);
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 auto 24px;
  display: table;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 16px;
  font-size: 14px;
}

.login-hint {
  text-align: center;
  font-size: 11px;
  color: var(--text-3);
  margin-top: 16px;
}
</style>
