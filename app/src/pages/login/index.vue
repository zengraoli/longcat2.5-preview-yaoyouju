<template>
  <view class="login">
    <view class="login__hero">
      <view class="login__logo">腰</view>
      <text class="login__title">腰有据</text>
      <text class="login__subtitle">腰痛理解与复诊助手</text>
    </view>

    <view class="login__features">
      <view class="login__feature">
        <text class="login__feature-title">看懂报告</text>
        <text class="login__feature-desc">术语解释＋原文对照</text>
      </view>
      <view class="login__feature">
        <text class="login__feature-title">记录病程</text>
        <text class="login__feature-desc">低负担，保留来源</text>
      </view>
      <view class="login__feature">
        <text class="login__feature-title">准备复诊</text>
        <text class="login__feature-desc">一页摘要，可导出</text>
      </view>
    </view>

    <view class="login__form">
      <text class="login__label">手机号</text>
      <input
        v-model="phone"
        class="login__input"
        type="number"
        maxlength="11"
        placeholder="请输入手机号"
        placeholder-class="login__placeholder"
      />

      <text class="login__label">验证码</text>
      <view class="login__code-row">
        <input
          v-model="code"
          class="login__input login__input--code"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="6位验证码"
          placeholder-class="login__placeholder"
          @input="onCodeInput"
        />
        <text class="login__code-btn" :class="{ 'login__code-btn--disabled': countdown > 0 }" @click="onSendCode">
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </text>
      </view>

      <AppButton block @click="onLogin">登录 / 注册</AppButton>

      <view class="login__agree" @click="agreed = !agreed">
        <view class="login__checkbox" :class="{ 'login__checkbox--checked': agreed }">
          <Icon name="check" :size="18" v-if="agreed" />
        </view>
        <text class="login__agree-text">我已阅读并同意《用户协议》《隐私政策》</text>
      </view>

      <view class="login__consent">
        <view class="login__consent-row" @click="consented = !consented">
          <view class="login__checkbox" :class="{ 'login__checkbox--checked': consented }">
            <Icon name="check" :size="18" v-if="consented" />
          </view>
          <text class="login__consent-text">
            单独同意：处理我的健康信息（含检查报告、症状记录，属敏感个人信息）。可随时在“我的-数据与授权”撤回。
          </text>
        </view>
      </view>

      <TipBar type="info">
        本产品帮助你理解资料与准备复诊，不代替医生诊断，不提供处方或手术判断。
      </TipBar>

      <EmergencyBar @click="showEmergency = true" />
    </view>

    <!-- 就医提示弹层（无需登录） -->
    <view v-if="showEmergency" class="mask" @click="showEmergency = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">{{ emergency.title }}</text>
        <view v-for="(item, i) in emergency.redFlags" :key="i" class="dialog__item">
          <text class="dialog__dot">•</text>
          <text class="dialog__text">{{ item }}</text>
        </view>
        <text class="dialog__note">{{ emergency.note }}</text>
        <AppButton block @click="showEmergency = false">我知道了</AppButton>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Icon from '@/components/Icon.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import EmergencyBar from '@/components/EmergencyBar.vue';
import { sendSmsCode, login, getSafetyTips, setAuthToken } from '@/api';

const phone = ref('');
const code = ref('');
const agreed = ref(false);
const consented = ref(false);
const countdown = ref(0);
const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

/** 验证码只保留数字，避免快速输入时丢字符 */
function onCodeInput() {
  code.value = code.value.replace(/\D/g, '').slice(0, 6);
}

async function onSendCode() {
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  try {
    await sendSmsCode(phone.value);
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
    uni.showToast({ title: '验证码已发送（演示固定 123456）', icon: 'none' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

async function onLogin() {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
    return;
  }
  if (!consented.value) {
    uni.showToast({ title: '请单独同意处理健康信息', icon: 'none' });
    return;
  }
  try {
    const result = await login(phone.value, code.value, consented.value ? ['健康信息处理'] : []);
    setAuthToken(result.token);
    uni.switchTab({ url: '/pages/home/index' });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

// 预取就医提示（无需登录）
getSafetyTips()
  .then((tips) => {
    emergency.value = tips;
  })
  .catch(() => {
    // 预取失败不阻塞登录
  });
</script>

<style scoped>
.login {
  min-height: 100vh;
  padding: 0 16px 32px;
  background: var(--bg);
}
.login__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0 24px;
}
.login__logo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--primary);
  color: #fff;
  font-size: 32px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login__title {
  font-size: 24px;
  font-weight: 500;
  margin-top: 16px;
}
.login__subtitle {
  font-size: 14px;
  color: var(--text-2);
  margin-top: 4px;
}
.login__features {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}
.login__feature {
  flex: 1;
  background: var(--surface);
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
}
.login__feature-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--primary);
}
.login__feature-desc {
  display: block;
  font-size: 11px;
  color: var(--text-2);
  margin-top: 2px;
}
.login__form {
  display: flex;
  flex-direction: column;
}
.login__label {
  font-size: 14px;
  color: var(--text-1);
  margin: 12px 0 6px;
}
.login__input {
  height: 48px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
}
.login__placeholder {
  color: var(--text-3);
}
.login__code-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.login__input--code {
  flex: 1;
}
.login__code-btn {
  font-size: 13px;
  color: var(--primary);
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.login__code-btn--disabled {
  color: var(--text-3);
}
.login__agree {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
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
  color: var(--text-1);
}
.login__consent {
  background: var(--surface);
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
}
.login__consent-row {
  display: flex;
  gap: 8px;
}
.login__consent-text {
  font-size: 12px;
  color: var(--text-2);
  flex: 1;
  line-height: 1.5;
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
  padding: 20px;
  width: 100%;
}
.dialog__title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
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
</style>
