<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { getAuthToken, setAuthToken, setUnauthorizedHandler } from '@/api/client';

onLaunch(() => {
  // 登录失效（1002）时引导回登录页，避免首页像新用户一样空白
  setUnauthorizedHandler(() => {
    setAuthToken(null);
    uni.reLaunch({ url: '/pages/login/index' });
  });
  // 已有登录态则直接进入首页（刷新 / 深链接不丢登录态）
  if (getAuthToken()) {
    uni.switchTab({ url: '/pages/home/index' });
  }
});
</script>

<style>
@import './styles/common.css';
</style>
