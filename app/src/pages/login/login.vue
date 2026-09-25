<template>
  <view class="login-page">
    <view class="emergency-entry" @click="goEmergency">
      <text class="emergency-text">紧急求助</text>
    </view>

    <view class="hero">
      <text class="app-title">腰有据</text>
      <text class="app-subtitle">腰痛理解与复诊助手</text>
      <text class="app-desc">帮助你理解检查报告、整理病程、准备复诊</text>
    </view>

    <view class="form-card">
      <view class="form-group">
        <text class="label">手机号</text>
        <input
          v-model="phone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-group">
        <text class="label">验证码</text>
        <view class="code-row">
          <input
            v-model="code"
            class="input code-input"
            type="number"
            maxlength="6"
            placeholder="请输入验证码"
            placeholder-class="placeholder"
          />
          <button class="code-btn" :disabled="countdown > 0" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
      </view>

      <view class="consent-section">
        <view class="consent-item" @click="toggleConsent('健康信息处理')">
          <view class="checkbox" :class="{ checked: consents['健康信息处理'] }">
            <text v-if="consents['健康信息处理']" class="check-icon">✓</text>
          </view>
          <text class="consent-text">我同意腰有据处理我的敏感健康信息，用于提供分析和推荐服务</text>
        </view>
        <view class="consent-item" @click="toggleConsent('分享')">
          <view class="checkbox" :class="{ checked: consents['分享'] }">
            <text v-if="consents['分享']" class="check-icon">✓</text>
          </view>
          <text class="consent-text">我同意将去标识化的健康信息用于产品改进</text>
        </view>
        <view class="consent-item" @click="toggleConsent('产品改进')">
          <view class="checkbox" :class="{ checked: consents['产品改进'] }">
            <text v-if="consents['产品改进']" class="check-icon">✓</text>
          </view>
          <text class="consent-text">我同意参与产品改进调研</text>
        </view>
      </view>

      <button class="primary-btn" :disabled="!canSubmit" @click="handleLogin">
        登录 / 注册
      </button>

      <text class="disclaimer">本产品不作诊断，不提供用药或手术建议</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { api, setToken } from '../../api/request';

const phone = ref('');
const code = ref('');
const countdown = ref(0);
const consents = ref<Record<string, boolean>>({
  '健康信息处理': false,
  '分享': false,
  '产品改进': false,
});

const canSubmit = computed(() => {
  return phone.value.length === 11 && code.value.length === 6 && consents.value['健康信息处理'];
});

function toggleConsent(key: string) {
  consents.value[key] = !consents.value[key];
}

function goEmergency() {
  uni.showModal({
    title: '紧急就医提示',
    content: '如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。',
    showCancel: false,
    confirmText: '我知道了',
  });
}

function startCountdown() {
  countdown.value = 60;
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) clearInterval(timer);
  }, 1000);
}

async function sendCode() {
  if (phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  try {
    await api.sendCode(phone.value);
    uni.showToast({ title: '验证码已发送', icon: 'success' });
    startCountdown();
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
}

async function handleLogin() {
  try {
    const res = await api.login(phone.value, code.value);
    setToken(res.token);
    const scopes = Object.keys(consents.value).filter(k => consents.value[k]);
    await api.grantConsent(scopes);
    uni.switchTab({ url: '/pages/index/index' });
  } catch (e: any) {
    uni.showToast({ title: e.message, icon: 'none' });
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 0 32rpx;
  padding-top: 48rpx;
}

.emergency-entry {
  position: absolute;
  top: 48rpx;
  right: 32rpx;
  padding: 12rpx 24rpx;
  background: rgba(217, 59, 59, 0.1);
  border-radius: 20rpx;
}

.emergency-text {
  font-size: 22rpx;
  color: var(--error);
  font-weight: 500;
}

.hero {
  padding: 80rpx 0 48rpx;
  text-align: center;
}

.app-title {
  font-size: 56rpx;
  font-weight: 700;
  color: var(--primary);
  display: block;
}

.app-subtitle {
  font-size: 28rpx;
  color: var(--text-2);
  margin-top: 12rpx;
  display: block;
}

.app-desc {
  font-size: 24rpx;
  color: var(--text-3);
  margin-top: 16rpx;
  display: block;
}

.form-card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
}

.form-group {
  margin-bottom: 32rpx;
}

.label {
  font-size: 26rpx;
  color: var(--text-2);
  margin-bottom: 12rpx;
  display: block;
}

.input {
  width: 100%;
  height: 88rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: var(--text-1);
  box-sizing: border-box;
}

.placeholder {
  color: var(--text-3);
}

.code-row {
  display: flex;
  gap: 16rpx;
}

.code-input {
  flex: 1;
}

.code-btn {
  width: 200rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 24rpx;
  border-radius: 16rpx;
  border: none;
  padding: 0;

  &[disabled] {
    opacity: 0.5;
  }
}

.consent-section {
  margin: 40rpx 0;
}

.consent-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid var(--border);
  border-radius: 8rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4rpx;

  &.checked {
    background: var(--primary);
    border-color: var(--primary);
  }
}

.check-icon {
  color: #fff;
  font-size: 22rpx;
}

.consent-text {
  font-size: 22rpx;
  color: var(--text-2);
  flex: 1;
  line-height: 1.5;
}

.primary-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: var(--primary);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 20rpx;
  border: none;

  &[disabled] {
    opacity: 0.5;
  }
}

.disclaimer {
  display: block;
  text-align: center;
  font-size: 20rpx;
  color: var(--text-3);
  margin-top: 24rpx;
}
</style>
