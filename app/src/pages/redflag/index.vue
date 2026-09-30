<template>
  <view class="redflag">
    <view class="redflag__header">
      <text class="redflag__back" @click="goBack">‹</text>
      <text class="redflag__title">需要及时寻求专业帮助</text>
    </view>

    <TipBar type="error">
      <view>
        <text class="redflag__tip-title">建议尽快就医</text>
        <text class="redflag__tip-body">
          你刚才选择了：{{ selectedText }}。这类变化需要医生及时评估，本产品无法替你判断严重程度，本轮不会生成个性化分析。
        </text>
        <text class="redflag__tip-note">本页在网络异常时也可查看。</text>
      </view>
    </TipBar>

    <AppButton type="danger" block @click="call120">拨打 120 / 前往急诊</AppButton>

    <view class="redflag__actions">
      <AppButton type="secondary" block @click="goHospital">查找附近医院</AppButton>
      <AppButton type="secondary" block @click="goDoctor">联系我的主治医生</AppButton>
    </view>

    <view class="card">
      <text class="card-title">就诊时可以带上</text>
      <view v-if="reportHint" class="redflag__bring">
        <text class="redflag__bring-icon">✓</text>
        <text class="redflag__bring-text">{{ reportHint }}</text>
      </view>
      <view class="redflag__bring">
        <text class="redflag__bring-icon">✓</text>
        <text class="redflag__bring-text">症状开始时间与最近变化记录</text>
      </view>
      <view class="redflag__bring">
        <text class="redflag__bring-icon">✓</text>
        <text class="redflag__bring-text">正在使用的药物与既有医嘱</text>
      </view>
    </view>

    <AppButton type="soft" block @click="goSummary">
      📄 生成一页“就诊交接”摘要（仅整理已有信息）
    </AppButton>

    <TipBar type="info">
      此提示由临床审定规则触发，不是诊断结论；请以医生的评估为准。
    </TipBar>

    <text class="redflag__ack" @click="goContents">我已知晓，继续查看已审核科普与复诊摘要</text>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TipBar from '@/components/TipBar.vue';
import AppButton from '@/components/AppButton.vue';

const selectedText = ref('');
const reportHint = ref('');

onMounted(async () => {
  // 读取确认页选择的红旗项
  const selected = uni.getStorageSync('redflagSelected') as string[] | '';
  if (Array.isArray(selected) && selected.length > 0) {
    selectedText.value = selected.join('、');
  } else {
    selectedText.value = '你选择的变化（记录见病程）';
  }
  // 已录入的报告提示
  try {
    const { listEpisodes, timeline } = await import('@/api');
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const tl = await timeline(episodes[0].id);
      const reportEvent = [...tl.events].reverse().find((e) => e.eventType === '报告' && e.rawText);
      if (reportEvent) {
        reportHint.value = `已录入的检查报告原文（${reportEvent.occurredAt.slice(0, 10)}）`;
      }
    }
  } catch {
    // 加载失败不阻塞
  }
});

function goBack() {
  uni.navigateBack();
}

function call120() {
  uni.makePhoneCall({ phoneNumber: '120' });
}

function goSummary() {
  uni.navigateTo({ url: '/pages/summary/index' });
}

function goContents() {
  uni.navigateTo({ url: '/pages/contents/index' });
}

function goHospital() {
  uni.showModal({
    title: '查找附近医院',
    content: '请前往正规医疗机构急诊；如症状严重，请拨打 120 由急救车转运。本演示不提供实时定位与医院推荐。',
    showCancel: false,
  });
}

function goDoctor() {
  uni.showToast({ title: '可在复诊时联系你的主治医生', icon: 'none' });
}
</script>

<style scoped>
.redflag {
  min-height: 100vh;
  padding: 16px 16px 32px;
}
.redflag__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.redflag__back {
  font-size: 24px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.redflag__title {
  font-size: 17px;
  font-weight: 500;
}
.redflag__tip-title {
  display: block;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
}
.redflag__tip-body {
  display: block;
  margin-bottom: 4px;
}
.redflag__tip-note {
  display: block;
  opacity: 0.8;
}
.redflag__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 12px;
}
.redflag__bring {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.redflag__bring-icon { color: var(--ok); font-size: 14px; }
.redflag__bring-text { font-size: 14px; flex: 1; }
.redflag__ack {
  display: block;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  margin-top: 20px;
  min-height: 44px;
  line-height: 44px;
}
</style>
