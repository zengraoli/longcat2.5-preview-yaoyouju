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

/* ===== 全局通用组件样式（各页 scoped 样式可覆盖） ===== */
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
  text-align: center;

  &[disabled] {
    opacity: 0.4;
    background: var(--text-3);
  }
}

.sub-btn {
  background: var(--primary-light);
  color: var(--primary);
  font-size: 26rpx;
  border-radius: 16rpx;
  border: none;
  padding: 18rpx 36rpx;

  &[disabled] {
    opacity: 0.4;
  }
}

.card {
  background: var(--surface);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.chip {
  padding: 14rpx 32rpx;
  background: var(--bg);
  border-radius: 24rpx;
  font-size: 26rpx;
  color: var(--text-2);
  border: 2rpx solid transparent;
}

.chip.selected {
  background: var(--primary);
  color: #fff;
}

.input {
  width: 100%;
  height: 88rpx;
  background: var(--bg);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--text-1);
  box-sizing: border-box;
}

.link-text {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: var(--primary);
  margin-top: 32rpx;
}
</style>
