<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { getAuthToken } from '@/api/client';

onLaunch(() => {
  // 启动时预取就医提示（无需登录，全局可达）
  // 已有登录态则直接进入首页（刷新 / 深链接不丢登录态）
  if (getAuthToken()) {
    uni.switchTab({ url: '/pages/home/index' });
  }
});
</script>

<style>
@import './styles/common.css';
</style>
