<template>
  <div class="login-page">
    <div class="login-container">
      <div class="brand-side">
        <h1 class="brand-title">腰有据</h1>
        <p class="brand-subtitle">腰痛理解与复诊助手</p>
        <ul class="brand-features">
          <li>理解检查报告</li>
          <li>整理病程变化</li>
          <li>准备复诊摘要</li>
        </ul>
      </div>

      <div class="login-side">
        <form class="login-form" @submit.prevent="handleLogin">
          <h2 class="form-title">登录 / 注册</h2>

          <div class="form-group">
            <label>手机号</label>
            <input v-model="phone" type="text" placeholder="请输入 11 位手机号" maxlength="11" />
          </div>

          <div class="form-group">
            <label>验证码</label>
            <div class="code-row">
              <input v-model="code" type="text" placeholder="请输入验证码" maxlength="6" />
              <button type="button" class="code-btn" :disabled="countdown > 0" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>

          <div class="consent-section">
            <label class="consent-item">
              <input type="checkbox" v-model="consents.health" />
              <span>我同意腰有据处理我的敏感健康信息</span>
            </label>
            <label class="consent-item">
              <input type="checkbox" v-model="consents.share" />
              <span>我同意将去标识化信息用于产品改进</span>
            </label>
            <label class="consent-item">
              <input type="checkbox" v-model="consents.improve" />
              <span>我同意参与产品改进调研</span>
            </label>
          </div>

          <button type="submit" class="btn-primary" :disabled="!canSubmit">登录 / 注册</button>

          <p class="disclaimer">本产品不作诊断，不提供用药或手术建议</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api, setToken } from '../../utils/api';

const router = useRouter();
const phone = ref('');
const code = ref('');
const countdown = ref(0);
const consents = ref({ health: false, share: false, improve: false });

const canSubmit = computed(() => phone.value.length === 11 && code.value.length === 6 && consents.value.health);

async function sendCode() {
  try {
    await api.sendCode(phone.value);
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
  } catch (e: any) {
    alert(e.message);
  }
}

async function handleLogin() {
  try {
    const res = await api.login(phone.value, code.value);
    setToken(res.token);
    const scopes = Object.entries(consents.value).filter(([, v]) => v).map(([k]) => {
      const map: Record<string, string> = { health: '健康信息处理', share: '分享', improve: '产品改进' };
      return map[k];
    });
    await api.grantConsent(scopes);
    router.push('/dashboard');
  } catch (e: any) {
    alert(e.message);
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

.login-container {
  display: flex;
  width: 960px;
  background: var(--surface);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.brand-side {
  flex: 1;
  background: var(--primary);
  color: #fff;
  padding: 60px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.brand-features {
  list-style: none;
  padding: 0;
}

.brand-features li {
  padding: 8px 0;
  font-size: 14px;
}

.brand-features li::before {
  content: '✓';
  margin-right: 8px;
  font-weight: 700;
}

.login-side {
  width: 440px;
  padding: 60px 48px;
}

.form-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 32px;
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

.code-row {
  display: flex;
  gap: 12px;
}

.code-row input {
  flex: 1;
}

.code-btn {
  width: 120px;
  height: 44px;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
}

.consent-section {
  margin: 24px 0;
}

.consent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
}

.disclaimer {
  text-align: center;
  font-size: 11px;
  color: var(--text-3);
  margin-top: 16px;
}
</style>
