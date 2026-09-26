<template>
  <div class="login-page">
    <div class="brand-side">
      <div class="brand-row">
        <span class="brand-logo">腰</span>
        <span class="brand-title">腰有据</span>
      </div>
      <p class="brand-subtitle">腰痛理解与复诊助手</p>
      <p class="brand-desc">
        把检查报告、当前症状、病程变化和最困扰你的问题连接起来，说明“已经知道什么、仍不知道什么、接下来怎么办”。帮助理解和复诊，不代替医生诊断。
      </p>
      <ul class="brand-features">
        <li class="brand-feature">
          <img src="@/assets/icons/ic_doc.png" alt="" />
          <div>
            <span class="bf-title">看懂报告</span>
            <span class="bf-desc">术语解释逐句对应原文；报告未提及的内容不会被写成“已排除”</span>
          </div>
        </li>
        <li class="brand-feature">
          <img src="@/assets/icons/ic_pulse.png" alt="" />
          <div>
            <span class="bf-title">记录病程</span>
            <span class="bf-desc">低负担记录，保留来源、时间与核实状态</span>
          </div>
        </li>
        <li class="brand-feature">
          <img src="@/assets/icons/ic_calendar.png" alt="" />
          <div>
            <span class="bf-title">准备复诊</span>
            <span class="bf-desc">一页交接摘要，预览后由你自主导出</span>
          </div>
        </li>
      </ul>
    </div>

    <div class="form-side">
      <form class="login-card" @submit.prevent="handleLogin">
        <h2 class="form-title">登录 / 注册</h2>
        <p class="form-subtitle">使用手机号验证码登录；首次登录即注册。</p>

        <div class="form-group">
          <label>手机号</label>
          <input v-model="phone" type="text" placeholder="请输入手机号" maxlength="11" />
        </div>

        <div class="form-group">
          <label>验证码</label>
          <div class="code-row">
            <input v-model="code" type="text" placeholder="6 位验证码" maxlength="6" />
            <button type="button" class="code-btn" :disabled="countdown > 0" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary btn-block" :disabled="!canSubmit">登录 / 注册</button>

        <label class="consent-item">
          <input type="checkbox" v-model="consents.health" />
          <span>我已阅读并同意《用户协议》《隐私政策》</span>
        </label>

        <div class="consent-card">
          <input type="checkbox" v-model="consents.share" id="consent-share" />
          <label for="consent-share">
            单独同意：处理我的健康信息（含检查报告、症状记录，属敏感个人信息）。可随时在“账户-数据与授权”撤回。
          </label>
        </div>

        <div class="info-alert">
          <img src="@/assets/icons/ic_info.png" alt="" />
          <span>本产品帮助你理解资料与准备复诊，不代替医生诊断，不提供处方或手术判断。</span>
        </div>

        <div class="emergency-bar">
          <img src="@/assets/icons/ic_warn.png" alt="" />
          <span>出现严重症状？无需登录，立即查看就医提示</span>
        </div>
      </form>
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
const consents = ref({ health: false, share: false });

const canSubmit = computed(() => phone.value.length === 11 && code.value.length === 6 && consents.value.health);

function startCountdown() {
  countdown.value = 60;
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) clearInterval(timer);
  }, 1000);
}

async function sendCode() {
  if (phone.value.length !== 11) return;
  try {
    await api.sendCode(phone.value);
    startCountdown();
  } catch {
    // 演示环境验证码固定为 123456
  }
}

async function handleLogin() {
  try {
    const res = await api.login(phone.value, code.value);
    setToken(res.token);
    await api.grantConsent(['健康信息处理']);
    router.push('/dashboard');
  } catch (e: any) {
    alert(e.message || '登录失败');
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

.brand-side {
  background: var(--primary);
  color: #fff;
  padding: 80px 64px;
  display: flex;
  flex-direction: column;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #fff;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 96px;
  font-size: 16px;
  opacity: 0.9;
}

.brand-desc {
  margin-top: 24px;
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.85;
  max-width: 480px;
}

.brand-features {
  margin-top: 48px;
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand-feature {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.brand-feature img {
  width: 36px;
  height: 36px;
  padding: 7px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  filter: brightness(0) invert(1);
}

.bf-title {
  display: block;
  font-size: 15px;
  font-weight: 500;
}

.bf-desc {
  display: block;
  font-size: 13px;
  opacity: 0.8;
  margin-top: 2px;
}

.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-card {
  width: 440px;
  background: var(--surface);
  border-radius: 12px;
  padding: 32px;
}

.form-title {
  font-size: 20px;
  font-weight: 500;
}

.form-subtitle {
  font-size: 13px;
  color: var(--text-3);
  margin-top: 6px;
  margin-bottom: 24px;
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

.form-group input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: var(--surface);
}

.form-group input:focus {
  border-color: var(--primary);
}

.code-row {
  display: flex;
  gap: 10px;
}

.code-row input {
  flex: 1;
}

.code-btn {
  width: 110px;
  height: 44px;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
}

.code-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.btn-block {
  width: 100%;
  margin-top: 8px;
}

.consent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}

.consent-item input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.consent-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}

.consent-card input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--primary);
  flex-shrink: 0;
}

.info-alert {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 16px;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.6;
}

.info-alert img {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  flex-shrink: 0;
}

.emergency-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 16px;
  background: rgba(217, 59, 59, 0.08);
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
  color: var(--error);
  font-weight: 500;
}

.emergency-bar img {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
