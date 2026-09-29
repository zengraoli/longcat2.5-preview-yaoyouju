<template>
  <view class="fallback">
    <view class="fallback__header">
      <text class="fallback__back" @click="goHome">‹</text>
      <text class="fallback__title">一页分析</text>
    </view>

    <view class="fallback__body">
      <view class="fallback__icon">📶</view>
      <text class="fallback__title-main">本次无法完成个性化解释</text>
      <text class="fallback__desc">
        模型或来源校验暂时不可用。我们不会无限重试，也不会重复计费。你已核对的信息已经保存，稍后可以直接生成分析。
      </text>
      <view class="fallback__tags">
        <text class="fallback__tag">错误码 ANL-503</text>
        <text class="fallback__tag fallback__tag--ok">已保存核对信息</text>
        <text class="fallback__tag fallback__tag--ok">未计费</text>
      </view>

      <text class="fallback__available-title">现在仍然可以使用</text>
      <view class="fallback__available">
        <view class="fallback__available-item">
          <text class="fallback__available-icon">▶</text>
          <view class="fallback__available-body">
            <text class="fallback__available-name">已审核科普</text>
            <text class="fallback__available-desc">8 个视频/图文，含字幕与文字替代，不依赖模型</text>
          </view>
          <text class="fallback__available-tag">可用</text>
        </view>
        <view class="fallback__available-item">
          <text class="fallback__available-icon">📋</text>
          <view class="fallback__available-body">
            <text class="fallback__available-name">复诊摘要</text>
            <text class="fallback__available-desc">基于你已有的记录与报告原文生成，可导出</text>
          </view>
          <text class="fallback__available-tag">可用</text>
        </view>
        <view class="fallback__available-item">
          <text class="fallback__available-icon">📈</text>
          <view class="fallback__available-body">
            <text class="fallback__available-name">病程记录</text>
            <text class="fallback__available-desc">继续记录今天；数据只保存在你的账户</text>
          </view>
          <text class="fallback__available-tag">可用</text>
        </view>
      </view>

      <TipBar type="info">
        低带宽下本页与核心文字仍可阅读；网络异常时也能看到基础求助说明。
      </TipBar>

      <EmergencyBar @click="showEmergency = true" />

      <AppButton type="secondary" block @click="onRetry">稍后重试（约 2 分钟后可用）</AppButton>
      <text class="fallback__home" @click="goHome">返回当前情况</text>
    </view>

    <!-- 就医提示弹层 -->
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
import { ref, onMounted } from 'vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import EmergencyBar from '@/components/EmergencyBar.vue';
import { getSafetyTips } from '@/api';

const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

function goHome() {
  uni.switchTab({ url: '/pages/home/index' });
}

function onRetry() {
  uni.showToast({ title: '已安排稍后重试（演示）', icon: 'none' });
}

onMounted(async () => {
  try {
    const tips = await getSafetyTips();
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞
  }
});
</script>

<style scoped>
.fallback {
  min-height: 100vh;
  padding-bottom: 32px;
}
.fallback__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}
.fallback__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.fallback__title {
  font-size: 17px;
  font-weight: 500;
}
.fallback__body {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.fallback__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(199, 119, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin-bottom: 16px;
}
.fallback__title-main {
  font-size: 17px;
  font-weight: 500;
  text-align: center;
  display: block;
  margin-bottom: 12px;
}
.fallback__desc {
  font-size: 14px;
  color: var(--text-2);
  text-align: center;
  line-height: 1.6;
  display: block;
  margin-bottom: 16px;
}
.fallback__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}
.fallback__tag {
  font-size: 12px;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2px 10px;
  border-radius: 4px;
}
.fallback__tag--ok {
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  border-color: transparent;
}
.fallback__available-title {
  font-size: 15px;
  font-weight: 500;
  align-self: flex-start;
  display: block;
  margin-bottom: 12px;
}
.fallback__available {
  width: 100%;
  margin-bottom: 12px;
}
.fallback__available-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}
.fallback__available-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.fallback__available-body { flex: 1; }
.fallback__available-name {
  font-size: 14px;
  font-weight: 500;
  display: block;
}
.fallback__available-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
  line-height: 1.5;
}
.fallback__available-tag {
  font-size: 11px;
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
  padding: 1px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.fallback__home {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 16px;
  min-height: 44px;
  line-height: 44px;
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
.dialog__title { font-size: 16px; font-weight: 500; margin-bottom: 12px; }
.dialog__item { display: flex; gap: 8px; margin-bottom: 8px; }
.dialog__dot { color: var(--error); }
.dialog__text { font-size: 14px; flex: 1; }
.dialog__note { font-size: 12px; color: var(--text-2); margin: 12px 0 16px; }
</style>
