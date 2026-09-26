<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <span class="brand-logo">腰</span>
        <span class="brand-name">腰有据 · 后台管理系统</span>
      </div>

      <div class="login-head">
        <h1 class="login-title">登录</h1>
        <span class="env-badge">生产环境</span>
      </div>
      <p class="login-desc">仅限受邀成员；不提供自助注册。登录需账号密码 + 动态验证码（MFA）。</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>账号</label>
          <div class="input-wrap">
            <span class="input-icon">👤</span>
            <input v-model="username" type="text" placeholder="工作邮箱" autocomplete="username" />
          </div>
        </div>
        <div class="form-group">
          <label>密码</label>
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" />
          </div>
        </div>
        <div class="form-group">
          <label>动态验证码（TOTP）</label>
          <div class="input-wrap">
            <span class="input-icon">🛡</span>
            <input v-model="totp" type="text" placeholder="6 位验证码" maxlength="6" />
          </div>
        </div>
        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="info-alert">
        <span class="alert-icon">ⓘ</span>
        <span>连续失败 5 次锁定 30 分钟；会话 30 分钟无操作过期；所有登录与敏感操作写入审计日志。</span>
      </div>

      <p class="login-footer-hint">忘记密码或未绑定 MFA？请联系超级管理员重置。</p>
    </div>

    <p class="login-security-note">后台域名与用户端分离 · 独立证书与会话 · 数据区不可公网访问</p>
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
    alert(e.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #0d383d;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.login-card {
  width: 440px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 44px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.brand-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-1);
}

.login-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.login-title {
  font-size: 22px;
  font-weight: 600;
}

.env-badge {
  font-size: 11px;
  color: var(--error);
  background: rgba(217, 59, 59, 0.08);
  border-radius: 4px;
  padding: 3px 8px;
}

.login-desc {
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.6;
  margin: 10px 0 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 6px;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  height: 46px;
}

.input-wrap:focus-within {
  border-color: var(--primary);
}

.input-icon {
  font-size: 13px;
  opacity: 0.55;
}

.input-wrap input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text-1);
  background: none;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn-block {
  width: 100%;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.info-alert {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #e7f0fe;
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.6;
  margin-top: 20px;
}

.alert-icon {
  color: var(--info);
  flex-shrink: 0;
}

.login-footer-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 16px;
}

.login-security-note {
  margin-top: 32px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
}
</style>
