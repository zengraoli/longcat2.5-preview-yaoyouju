<template>
  <div class="login">
    <!-- 左侧价值说明 -->
    <div class="login__brand">
      <div class="login__brand-header">
        <div class="login__logo">腰</div>
        <span class="login__brand-name">腰有据</span>
      </div>
      <p class="login__tagline">腰痛理解与复诊助手</p>
      <p class="login__desc">
        把检查报告、当前症状、病程变化和最困扰你的问题连接起来，说明“已经知道什么、仍不知道什么、接下来怎么办”。帮助你理解和复诊，不代替医生诊断。
      </p>
      <div class="login__features">
        <div class="login__feature">
          <span class="login__feature-icon">📄</span>
          <div>
            <div class="login__feature-title">看懂报告</div>
            <div class="login__feature-desc">术语解释逐句对应原文；报告未提及的内容不会被写成“已排除”</div>
          </div>
        </div>
        <div class="login__feature">
          <span class="login__feature-icon">📈</span>
          <div>
            <div class="login__feature-title">记录病程</div>
            <div class="login__feature-desc">低负担记录，保留来源、时间与核实状态</div>
          </div>
        </div>
        <div class="login__feature">
          <span class="login__feature-icon">📋</span>
          <div>
            <div class="login__feature-title">准备复诊</div>
            <div class="login__feature-desc">一页交接摘要，预览后由你自主导出</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录卡 -->
    <div class="login__main">
      <div class="login__card">
        <h1 class="login__title">登录 / 注册</h1>
        <p class="login__subtitle">使用手机号验证码登录；首次登录即注册。</p>

        <label class="login__label">手机号</label>
        <input
          v-model="phone"
          class="login__input"
          type="tel"
          maxlength="11"
          placeholder="请输入手机号"
        />

        <label class="login__label">验证码</label>
        <div class="login__code-row">
          <input
            v-model="code"
            class="login__input login__input--code"
            type="text"
            maxlength="6"
            placeholder="6 位验证码"
          />
          <button
            class="login__code-btn"
            :disabled="countdown > 0"
            @click="onSendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>

        <button class="login__submit" @click="onLogin">登录 / 注册</button>

        <div class="login__agree" @click="agreed = !agreed">
          <div class="login__checkbox" :class="{ 'login__checkbox--checked': agreed }">
            <span v-if="agreed">✓</span>
          </div>
          <span class="login__agree-text">我已阅读并同意《用户协议》《隐私政策》</span>
        </div>

        <div class="login__consent">
          <div class="login__consent-row" @click="consented = !consented">
            <div class="login__checkbox" :class="{ 'login__checkbox--checked': consented }">
              <span v-if="consented">✓</span>
            </div>
            <span class="login__consent-text">
              单独同意：处理我的健康信息（含检查报告、症状记录，属敏感个人信息）。可随时在“账户与数据”撤回。
            </span>
          </div>
        </div>

        <TipBar type="info">
          本产品帮助你理解资料与准备复诊，不代替医生诊断，不提供处方或手术判断。
        </TipBar>

        <div class="login__emergency" @click="showEmergency = true">
          ⚠ 出现严重症状？无需登录，立即查看就医提示
        </div>
      </div>
    </div>

    <!-- 就医提示弹层 -->
    <div v-if="showEmergency" class="mask" @click="showEmergency = false">
      <div class="dialog" @click.stop>
        <h3 class="dialog__title">{{ emergency.title }}</h3>
        <div v-for="(item, i) in emergency.redFlags" :key="i" class="dialog__item">
          <span class="dialog__dot">•</span>
          <span class="dialog__text">{{ item }}</span>
        </div>
        <p class="dialog__note">{{ emergency.note }}</p>
        <button class="dialog__btn" @click="showEmergency = false">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TipBar from '@/components/TipBar.vue';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';

const router = useRouter();
const auth = useAuthStore();

const phone = ref('');
const code = ref('');
const agreed = ref(false);
const consented = ref(false);
const countdown = ref(0);
const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

async function onSendCode() {
  if (!/^1\d{10}$/.test(phone.value)) {
    alert('请输入正确的手机号');
    return;
  }
  try {
    await auth.sendSmsCode(phone.value);
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
    alert('验证码已发送（演示固定 123456）');
  } catch (e) {
    alert((e as Error).message);
  }
}

async function onLogin() {
  if (!agreed.value) {
    alert('请先阅读并同意用户协议');
    return;
  }
  if (!consented.value) {
    alert('请单独同意处理健康信息');
    return;
  }
  try {
    await auth.login(phone.value, code.value);
    router.push({ name: 'dashboard' });
  } catch (e) {
    alert((e as Error).message);
  }
}

onMounted(async () => {
  try {
    const tips = await api.get<{ title: string; redFlags: string[]; note: string }>('/safety/tips');
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞登录
  }
});
</script>

<style scoped>
.login {
  display: flex;
  min-height: 100vh;
}
.login__brand {
  flex: 1;
  background: var(--primary);
  color: #fff;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.login__brand-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.login__logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fff;
  color: var(--primary);
  font-size: 24px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login__brand-name {
  font-size: 20px;
  font-weight: 500;
}
.login__tagline {
  font-size: 14px;
  opacity: 0.85;
  margin: 0 0 24px;
}
.login__desc {
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.9;
  margin: 0 0 32px;
  max-width: 440px;
}
.login__features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.login__feature {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.login__feature-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.login__feature-title {
  font-size: 15px;
  font-weight: 500;
}
.login__feature-desc {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
  line-height: 1.5;
}
.login__main {
  width: 560px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}
.login__card {
  width: 440px;
  background: var(--surface);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(27, 34, 48, 0.06);
}
.login__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.login__subtitle {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 24px;
}
.login__label {
  display: block;
  font-size: 13px;
  color: var(--text-1);
  margin: 12px 0 6px;
}
.login__input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
}
.login__input:focus {
  border-color: var(--primary);
}
.login__code-row {
  display: flex;
  gap: 10px;
}
.login__input--code {
  flex: 1;
}
.login__code-btn {
  min-height: 44px;
  padding: 0 16px;
  border: none;
  background: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.login__code-btn:disabled {
  color: var(--text-3);
  cursor: default;
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
.login__agree {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  cursor: pointer;
}
.login__checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
}
.login__checkbox--checked {
  background: var(--primary);
  border-color: var(--primary);
}
.login__agree-text {
  font-size: 13px;
}
.login__consent {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
}
.login__consent-row {
  display: flex;
  gap: 8px;
  cursor: pointer;
}
.login__consent-text {
  font-size: 12px;
  color: var(--text-2);
  flex: 1;
  line-height: 1.5;
}
.login__emergency {
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(217, 59, 59, 0.08);
  color: var(--error);
  font-size: 13px;
  cursor: pointer;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 32px;
}
.dialog {
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
  width: 400px;
}
.dialog__title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px;
}
.dialog__item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.dialog__dot { color: var(--error); }
.dialog__text { font-size: 14px; flex: 1; }
.dialog__note {
  font-size: 12px;
  color: var(--text-2);
  margin: 12px 0 16px;
}
.dialog__btn {
  width: 100%;
  min-height: 44px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
