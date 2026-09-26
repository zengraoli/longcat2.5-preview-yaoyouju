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
        <view class="consent-item" @click="agreement = !agreement">
          <view class="checkbox" :class="{ checked: agreement }">
            <text v-if="agreement" class="check-icon">✓</text>
          </view>
          <text class="consent-text">我已阅读并同意《用户协议》《隐私政策》</text>
        </view>
        <view class="consent-card">
          <view class="checkbox" :class="{ checked: consents['健康信息处理'] }" @click="toggleConsent('健康信息处理')">
            <text v-if="consents['健康信息处理']" class="check-icon">✓</text>
          </view>
          <text class="consent-card-text">单独同意：处理我的健康信息（含检查报告、症状记录，属敏感个人信息）。可随时在“我的-数据与授权”撤回。</text>
        </view>
      </view>

      <button class="primary-btn" :disabled="!canSubmit" @click="handleLogin">
        登录 / 注册
      </button>

      <view class="info-alert">
        <image src="/static/icons/ic_info.png" class="info-icon" />
        <text class="info-text">本产品帮助你理解资料与准备复诊，不代替医生诊断，不提供处方或手术判断。</text>
      </view>
    </view>

    <view class="emergency-bar" @click="goEmergency">
      <image src="/static/icons/ic_warn.png" class="emergency-icon" />
      <text class="emergency-bar-text">出现严重症状？无需登录，立即查看就医提示</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { api, setToken } from '../../api/request';

const phone = ref('');
const code = ref('');
const countdown = ref(0);
const agreement = ref(false);
const consents = ref<Record<string, boolean>>({
  '健康信息处理': false,
  '分享': false,
  '产品改进': false,
});

const canSubmit = computed(() => {
  return phone.value.length === 11 && code.value.length === 6
    && agreement.value && consents.value['健康信息处理'];
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
    // 协议勾选不作为授权范围；仅“单独同意”记录健康信息处理授权
    if (consents.value['健康信息处理']) {
      await api.grantConsent(['健康信息处理']);
    }
    uni.reLaunch({ url: '/pages/index/index' });
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

.emergency-bar {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: 48rpx;
  display: flex;
  align-items: center;
  background: rgba(217, 59, 59, 0.12);
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  z-index: 50;
}

.emergency-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.emergency-bar-text {
  font-size: 26rpx;
  color: var(--error);
  font-weight: 500;
  flex: 1;
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
  margin: 40rpx 0 24rpx;
}

.consent-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
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

.consent-card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  border: 2rpx solid var(--border);
  border-radius: 16rpx;
  padding: 24rpx;
}

.consent-card-text {
  font-size: 22rpx;
  color: var(--text-2);
  flex: 1;
  line-height: 1.6;
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: rgba(47, 111, 216, 0.08);
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
}

.info-icon {
  width: 32rpx;
  height: 32rpx;
  margin-top: 4rpx;
  flex-shrink: 0;
}

.info-text {
  font-size: 22rpx;
  color: var(--text-2);
  line-height: 1.6;
  flex: 1;
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
