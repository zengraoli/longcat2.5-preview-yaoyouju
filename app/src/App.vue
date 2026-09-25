<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('App Launch');
});
</script>

<style lang="scss">
page {
  --primary: #0F6E74;
  --primary-light: #E3F1F2;
  --bg: #F4F6F8;
  --surface: #FFFFFF;
  --border: #E4E8EE;
  --text-1: #1B2230;
  --text-2: #5C6675;
  --text-3: #98A1AE;
  --ok: #1E9E5A;
  --warn: #C77700;
  --error: #D93B3B;
  --info: #2F6FD8;

  background-color: var(--bg);
  color: var(--text-1);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  line-height: 1.5;
}
</style>
