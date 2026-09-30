<template>
  <div class="login">
    <div class="login__card">
      <div class="login__brand">
        <span class="login__logo">腰</span>
        <span class="login__brand-name">腰有据 · 后台管理系统</span>
      </div>

      <div class="login__title-row">
        <h1 class="login__title">登录</h1>
        <span class="login__env">生产环境</span>
      </div>
      <p class="login__subtitle">仅限受邀成员；不提供自助注册。登录需账号密码 + 动态验证码（MFA）。</p>

      <form @submit.prevent="onLogin">
        <label class="login__label">账号</label>
        <div class="login__input-wrap">
          <span class="login__input-icon">👁</span>
          <input v-model="name" class="login__input" placeholder="工作邮箱" @keyup.enter="onLogin" />
        </div>

        <label class="login__label">密码</label>
        <div class="login__input-wrap">
          <span class="login__input-icon">🔒</span>
          <input v-model="password" type="password" class="login__input" placeholder="••••••••••" @keyup.enter="onLogin" />
        </div>

        <label class="login__label">动态验证码（TOTP）</label>
        <div class="login__input-wrap">
          <span class="login__input-icon">🛡</span>
          <input v-model="totp" class="login__input" maxlength="6" placeholder="6 位验证码" @keyup.enter="onLogin" />
        </div>

        <button type="submit" class="login__submit" @click="onLogin">登录</button>
      </form>

      <TipBar type="info">
        连续失败 5 次锁定 15 分钟；会话 30 分钟过期；所有登录与敏感操作写入审计日志。
      </TipBar>

      <p class="login__help">忘记密码或未绑定 MFA？请联系超级管理员重置。</p>
    </div>

    <p class="login__footer">后台域名与用户端分离 · 独立证书与会话 · 数据区不可公网访问</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import TipBar from '@/components/TipBar.vue';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/utils/toast';

const router = useRouter();
const auth = useAuthStore();

const name = ref('');
const password = ref('');
const totp = ref('');

async function onLogin() {
  try {
    await auth.login(name.value, password.value, totp.value);
    router.push({ name: 'dashboard' });
  } catch (e) {
    toast((e as Error).message);
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: #0B3B40;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.login__card {
  width: 440px;
  background: var(--surface);
  border-radius: 12px;
  padding: 32px;
}
.login__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.login__logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login__brand-name {
  font-size: 16px;
  font-weight: 500;
}
.login__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.login__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.login__env {
  font-size: 11px;
  color: var(--error);
  background: rgba(217, 59, 59, 0.1);
  padding: 1px 8px;
  border-radius: 4px;
}
.login__subtitle {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 24px;
  line-height: 1.5;
}
.login__label {
  display: block;
  font-size: 13px;
  color: var(--text-1);
  margin: 12px 0 6px;
}
.login__input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
}
.login__input-wrap:focus-within {
  border-color: var(--primary);
}
.login__input-icon {
  font-size: 14px;
  color: var(--text-3);
}
.login__input {
  flex: 1;
  height: 44px;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}
.login__submit {
  width: 100%;
  min-height: 44px;
  margin-top: 20px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.login__help {
  font-size: 12px;
  color: var(--text-3);
  text-align: center;
  margin: 16px 0 0;
}
.login__footer {
  margin-top: 24px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
