<template>
  <view class="mine">
    <view class="mine__header">
      <text class="mine__title">我的</text>
      <Icon name="settings" :size="18" class="mine__settings" />
    </view>

    <!-- 用户卡片 -->
    <view class="card mine__user">
      <view class="mine__avatar">U</view>
      <view class="mine__user-body">
        <text class="mine__phone">{{ maskedPhone || '未登录' }}</text>
        <text class="mine__uid">匿名内部标识 {{ anonymousId }}{{ anonymousId ? '（分析内容与身份信息分离存储）' : '' }}</text>
      </view>
    </view>

    <!-- 数据与授权 -->
    <view class="card">
      <text class="card-title">数据与授权</text>
      <view class="mine__row" @click="goConsents">
        <Icon name="shield" :size="18" class="mine__row-icon" />
        <view class="mine__row-body">
          <text class="mine__row-title">我的同意记录</text>
          <text class="mine__row-desc">{{ consentSummary }}</text>
        </view>
        <text class="mine__row-tag">可撤回</text>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="onRevoke">
        <Icon name="close" :size="18" class="mine__row-icon" />
        <view class="mine__row-body">
          <text class="mine__row-title">撤回“处理健康信息”的同意</text>
          <text class="mine__row-desc">撤回后停止个性化分析，已审核科普与已导出摘要仍可用</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="showExport = true">
        <Icon name="download" :size="18" class="mine__row-icon" />
        <view class="mine__row-body">
          <text class="mine__row-title">导出我的全部数据</text>
          <text class="mine__row-desc">可读格式（PDF / JSON），包含病程、报告原文与分析版本</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="onDelete">
        <Icon name="trash" :size="18" class="mine__row-icon mine__row-icon--danger" />
        <view class="mine__row-body">
          <text class="mine__row-title mine__row-title--danger">删除账户与数据</text>
          <text class="mine__row-desc">删除病程、报告、分析、反馈与身份信息，不可恢复</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
    </view>

    <!-- 内容库入口 -->
    <view class="card">
      <text class="card-title">已审核内容</text>
      <view class="mine__row" @click="goContents">
        <Icon name="book" :size="18" class="mine__row-icon" />
        <view class="mine__row-body">
          <text class="mine__row-title">审核内容库</text>
          <text class="mine__row-desc">临床审定的科普视频与图文，附来源与版本</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
    </view>

    <!-- 分享与社区 -->
    <view class="card">
      <text class="card-title">分享与社区</text>
      <view class="mine__row">
        <Icon name="people" :size="18" class="mine__row-icon" />
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
      <view class="mine__row" @click="showService = true">
        <text class="mine__row-icon">ℹ</text>
        <view class="mine__row-body">
          <text class="mine__row-title">服务范围与不做的事</text>
          <text class="mine__row-desc">不作诊断、不给手术判断、不调整药物、不生成严重程度总分</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="showEmergency = true">
        <Icon name="warning" :size="18" class="mine__row-icon mine__row-icon--danger" />
        <view class="mine__row-body">
          <text class="mine__row-title mine__row-title--danger">紧急就医提示</text>
          <text class="mine__row-desc">无需登录，网络异常时也可查看</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row" @click="showReview = true">
        <Icon name="report" :size="18" class="mine__row-icon" />
        <view class="mine__row-body">
          <text class="mine__row-title">临床审定与来源说明</text>
          <text class="mine__row-desc">谁审核了内容、依据是什么、如何举报错误</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
      <view class="mine__row">
        <Icon name="settings" :size="18" class="mine__row-icon" />
        <view class="mine__row-body">
          <text class="mine__row-title">版本信息</text>
          <text class="mine__row-desc">App v0.1.0 · 分析模型 {{ modelName || 'local-mock-v1' }} · 内容库 {{ contentLibVersion || '—' }}</text>
        </view>
        <text class="mine__row-arrow">›</text>
      </view>
    </view>

    <AppButton type="secondary" block @click="onLogout">退出登录</AppButton>

    <TipBar type="warn">
      删除会覆盖公开卡片、搜索索引、向量、缓存和派生摘要；备份与依法需要保留的信息按政策管理，不承诺瞬时全网删除。
    </TipBar>

    <!-- 同意记录弹层 -->
    <view v-if="showConsents" class="mask" @click="showConsents = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">我的同意记录</text>
        <view v-for="(c, i) in consents" :key="i" class="dialog__consent">
          <text class="dialog__consent-scope">{{ c.scope }}</text>
          <text class="dialog__consent-state">{{ c.granted ? '已同意' : '未同意' }}</text>
          <text class="dialog__consent-time">{{ c.grantedAt ? formatTime(c.grantedAt) : '—' }}</text>
        </view>
        <AppButton block @click="showConsents = false">关闭</AppButton>
      </view>
    </view>

    <!-- 导出数据弹层 -->
    <view v-if="showExport" class="mask" @click="showExport = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">导出我的全部数据</text>
        <text class="dialog__text">将导出病程、报告原文、分析版本与同意记录（可读 JSON）。点击下方按钮复制导出内容，或保存为文件。</text>
        <AppButton block @click="onExport">复制导出数据</AppButton>
      </view>
    </view>

    <!-- 服务范围弹层 -->
    <view v-if="showService" class="mask" @click="showService = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">服务范围与不做的事</text>
        <text class="dialog__text">本产品帮助你理解检查报告、整理病程与准备复诊，不代替医生诊断。不作诊断、不给手术判断、不调整药物、不生成严重程度总分。</text>
        <AppButton block @click="showService = false">我知道了</AppButton>
      </view>
    </view>

    <!-- 临床审定弹层 -->
    <view v-if="showReview" class="mask" @click="showReview = false">
      <view class="dialog" @click.stop>
        <text class="dialog__title">临床审定与来源说明</text>
        <text class="dialog__text">内容库中的视频与图文均由临床审核人员审定，依据为诊疗指南与审核科普材料，每条内容附审定版本与审核记录。如发现错误，可在“反馈与举报”页提交，会自动附带内容版本信息。</text>
        <AppButton block @click="showReview = false">我知道了</AppButton>
      </view>
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
import { ref, computed, onMounted } from 'vue';
import Icon from '@/components/Icon.vue';
import AppButton from '@/components/AppButton.vue';
import TipBar from '@/components/TipBar.vue';
import { getSafetyTips, getMe, getConsents, setConsent, logout, deleteAccount, setAuthToken, exportMyData, listEpisodes, getLatestAnalysis, type ConsentView } from '@/api';

const maskedPhone = ref('');
const anonymousId = ref('');
const consents = ref<ConsentView[]>([]);
const modelName = ref('');
const contentLibVersion = ref('');
const showConsents = ref(false);
const showEmergency = ref(false);
const showExport = ref(false);
const showService = ref(false);
const showReview = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

const consentSummary = computed(() => {
  const c = consents.value.find((x) => x.scope === '健康信息处理');
  if (!c) return '健康信息处理：未开启';
  return c.granted
    ? `健康信息处理：已同意 ${formatTime(c.grantedAt)} · 分享/产品改进：未开启`
    : '健康信息处理：未开启';
});

function formatTime(iso: string | null) {
  return iso ? iso.slice(0, 10) : '—';
}

function goConsents() {
  showConsents.value = true;
}

function goContents() {
  uni.navigateTo({ url: '/pages/contents/index' });
}

async function onRevoke() {
  uni.showModal({
    title: '撤回同意',
    content: '撤回后将停止个性化分析，已审核科普与已导出摘要仍可用。确定撤回吗？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        const result = await setConsent('健康信息处理', false);
        consents.value = result;
        uni.showToast({ title: '已撤回', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: (e as Error).message, icon: 'none' });
      }
    },
  });
}

function onDelete() {
  uni.showModal({
    title: '删除账户与数据',
    content: '删除会覆盖公开卡片、搜索索引、向量、缓存和派生摘要，不承诺瞬时全网删除。确定删除吗？',
    confirmColor: '#D93B3B',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await deleteAccount();
        setAuthToken(null);
        uni.showToast({ title: '账户与数据已删除', icon: 'success' });
        setTimeout(() => uni.reLaunch({ url: '/pages/login/index' }), 800);
      } catch (e) {
        uni.showToast({ title: (e as Error).message, icon: 'none' });
      }
    },
  });
}

async function onLogout() {
  try {
    await logout();
  } catch {
    // 本地仍清除
  }
  setAuthToken(null);
  uni.reLaunch({ url: '/pages/login/index' });
}

async function onExport() {
  try {
    const data = await exportMyData();
    const text = JSON.stringify(data, null, 2);
    uni.setClipboardData({
      data: text,
      success: () => {
        showExport.value = false;
        uni.showToast({ title: '导出内容已复制', icon: 'success' });
      },
    });
  } catch (e) {
    uni.showToast({ title: (e as Error).message, icon: 'none' });
  }
}

onMounted(async () => {
  try {
    const me = await getMe();
    maskedPhone.value = me.maskedPhone ?? '';
    anonymousId.value = me.id.slice(0, 6) + '…';
  } catch {
    // 未登录
  }
  try {
    consents.value = await getConsents();
  } catch {
    // 未登录
  }
  try {
    const tips = await getSafetyTips();
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞
  }
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const analysis = await getLatestAnalysis(episodes[0].id);
      if (analysis) {
        modelName.value = analysis.modelName ?? analysis.modelReleaseId ?? '';
        contentLibVersion.value = analysis.contentLibVersion ?? analysis.retrievalSnapshot?.contentLibVersion ?? '';
      }
    }
  } catch {
    // 未登录或没有分析
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
.dialog__consent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.dialog__consent-scope { font-size: 14px; flex: 1; }
.dialog__consent-state { font-size: 13px; color: var(--text-2); }
.dialog__consent-time { font-size: 12px; color: var(--text-3); }
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
.dialog__text { font-size: 14px; line-height: 1.6; color: var(--text-1); margin-bottom: 16px; }
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
}
</style>
