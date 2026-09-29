<template>
  <view class="mine">
    <view class="mine__header">
      <text class="mine__title">我的</text>
      <text class="mine__settings">⚙</text>
    </view>

    <!-- 用户卡片 -->
    <view class="card mine__user">
      <view class="mine__avatar">U</view>
      <view class="mine__user-body">
        <text class="mine__phone">{{ maskedPhone }}</text>
        <text class="mine__uid">匿名内部标识 {{ anonymousId }}（分析内容与身份信息分离存储）</text>
      </view>
    </view>

    <!-- 数据与授权 -->
    <view class="card">
      <text class="card-title">数据与授权</text>
      <view class="mine__row" @click="goConsents">
        <text class="mine__row-icon">🛡</text>
        <view class="mine__row-body">
          <text class="mine__row-title">我的同意记录</text>
          <text class="mine__row-desc">健康信息处理：已同意 2026-09-01 · 分享/产品改进：未开启</text>
        </view>
        <text class="mine__row-tag">可撤回</text>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="onRevoke">
        <text class="mine__row-icon">✕</text>
        <view class="mine__row-body">
          <text class="mine__row-title">撤回“处理健康信息”的同意</text>
          <text class="mine__row-desc">撤回后停止个性化分析，已审核科普与已导出摘要仍可用</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row">
        <text class="mine__row-icon">⬇</text>
        <view class="mine__row-body">
          <text class="mine__row-title">导出我的全部数据</text>
          <text class="mine__row-desc">可读格式（PDF / JSON），包含病程、报告原文与分析版本</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="onDelete">
        <text class="mine__row-icon mine__row-icon--danger">🗑</text>
        <view class="mine__row-body">
          <text class="mine__row-title mine__row-title--danger">删除账户与数据</text>
          <text class="mine__row-desc">覆盖公开卡片、索引、向量、缓存与派生摘要</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
    </view>

    <!-- 分享与社区 -->
    <view class="card">
      <text class="card-title">分享与社区</text>
      <view class="mine__row">
        <text class="mine__row-icon">👥</text>
        <view class="mine__row-body">
          <text class="mine__row-title">案例投稿（二期）</text>
          <text class="mine__row-desc">单独授权 · 预览 · 去除第三方信息 · 人工审核 · 可撤回</text>
        </view>
        <text class="mine__row-tag">尚未开放</text>
        <text class="mine__row-arrow">›</text>
      </view>
    </view>

    <!-- 服务信息 -->
    <view class="card">
      <text class="card-title">服务信息</text>
      <view class="mine__row">
        <text class="mine__row-icon">ℹ</text>
        <view class="mine__row-body">
          <text class="mine__row-title">服务范围与不做的事</text>
          <text class="mine__row-desc">不作诊断、不给手术判断、不调整药物、不生成严重程度总分</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="showEmergency = true">
        <text class="mine__row-icon mine__row-icon--danger">⚠</text>
        <view class="mine__row-body">
          <text class="mine__row-title mine__row-title--danger">紧急就医提示</text>
          <text class="mine__row-desc">无需登录，网络异常时也可查看</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row">
        <text class="mine__row-icon">📄</text>
        <view class="mine__row-body">
          <text class="mine__row-title">临床审定与来源说明</text>
          <text class="mine__row-desc">谁审核了内容、依据是什么、如何举报错误</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row">
        <text class="mine__row-icon">⚙</text>
        <view class="mine__row-body">
          <text class="mine__row-title">版本信息</text>
          <text class="mine__row-desc">App v0.1.0 · 分析模型 M-2609 · 内容库 2026-09</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
    </view>

    <AppButton type="secondary" block @click="onLogout">退出登录</AppButton>

    <TipBar type="warn">
      删除会覆盖公开卡片、搜索索引、向量、缓存和派生摘要；备份与依法需要保留的信息按政策管理，不承诺瞬时全网删除。
    </TipBar>

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

    <BottomTab :items="tabItems" current="/pages/mine/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import BottomTab from '@/components/BottomTab.vue';
import { getSafetyTips, setAuthToken, getAuthToken } from '@/api';

const maskedPhone = ref('138****1234');
const anonymousId = ref('U-8F3K…');
const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

const tabItems = [
  { pagePath: 'pages/home/index', text: '当前情况', icon: '🏠' },
  { pagePath: 'pages/qa/index', text: '问与解释', icon: '💬' },
  { pagePath: 'pages/timeline/index', text: '病程', icon: '📈' },
  { pagePath: 'pages/followup/index', text: '复诊准备', icon: '📋' },
  { pagePath: 'pages/mine/index', text: '我的', icon: '👤' },
];

function goConsents() {
  uni.showToast({ title: '同意记录可在数据与授权中查看', icon: 'none' });
}

function onRevoke() {
  uni.showModal({
    title: '撤回同意',
    content: '撤回后将停止个性化分析，已审核科普与已导出摘要仍可用。确定撤回吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已撤回（演示）', icon: 'success' });
      }
    },
  });
}

function onDelete() {
  uni.showModal({
    title: '删除账户与数据',
    content: '删除会覆盖公开卡片、搜索索引、向量、缓存和派生摘要，不承诺瞬时全网删除。确定删除吗？',
    confirmColor: '#D93B3B',
    success: (res) => {
      if (res.confirm) {
        setAuthToken(null);
        uni.reLaunch({ url: '/pages/login/index' });
      }
    },
  });
}

function onLogout() {
  setAuthToken(null);
  uni.reLaunch({ url: '/pages/login/index' });
}

onMounted(async () => {
  if (!getAuthToken()) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }
  try {
    const tips = await getSafetyTips();
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞
  }
});
</script>

<style scoped>
.mine {
  min-height: 100vh;
  padding: 16px 16px 100px;
}
.mine__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.mine__title {
  font-size: 17px;
  font-weight: 500;
}
.mine__settings { font-size: 20px; color: var(--text-2); }
.mine__user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mine__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mine__user-body { flex: 1; }
.mine__phone {
  font-size: 16px;
  font-weight: 500;
  display: block;
}
.mine__uid {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
  line-height: 1.5;
}
.mine__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.mine__row:last-child {
  border-bottom: none;
}
.mine__row-icon {
  font-size: 18px;
  width: 24px;
  flex-shrink: 0;
}
.mine__row-icon--danger { color: var(--error); }
.mine__row-body { flex: 1; }
.mine__row-title {
  font-size: 14px;
  font-weight: 500;
  display: block;
}
.mine__row-title--danger { color: var(--error); }
.mine__row-desc {
  font-size: 12px;
  color: var(--text-2);
  display: block;
  margin-top: 2px;
  line-height: 1.5;
}
.mine__row-tag {
  font-size: 11px;
  color: var(--primary);
  background: var(--primary-light);
  padding: 1px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.mine__row-arrow {
  color: var(--text-3);
  font-size: 18px;
  flex-shrink: 0;
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
