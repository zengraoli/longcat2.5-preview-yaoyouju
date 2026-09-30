<template>
  <div class="layout">
    <header class="layout__nav">
      <div class="layout__brand">
        <span class="layout__logo">腰</span>
        <span class="layout__name">腰有据</span>
      </div>
      <nav class="layout__menu">
        <router-link
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="layout__menu-item"
          :class="{ 'layout__menu-item--active': isActive(item.to) }"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <div class="layout__actions">
        <button class="layout__emergency" @click="showEmergency = true">⚠ 紧急就医提示</button>
        <router-link to="/account" class="layout__account">账户与数据</router-link>
      </div>
    </header>
    <main class="layout__main">
      <slot />
    </main>

    <!-- 就医提示弹层 -->
    <div v-if="showEmergency" class="mask" @click="showEmergency = false">
      <div class="dialog" @click.stop>
        <h3 class="dialog__title">{{ emergency.title }}</h3>
        <div v-for="(item, i) in emergency.redFlags" :key="i" class="dialog__item">
          <span class="dialog__dot">•</span>
          <span class="dialog__text">{{ item }}</span>
        </div>
        <p class="dialog__note">{{ emergency.note }}</p>
        <button class="dialog__btn" @click="showEmergency = false">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api/client';
import { REDFLAG_EVENT, type RedFlagPayload } from '@/utils/redflag';

const route = useRoute();
const showEmergency = ref(false);
const emergency = ref({ title: '', redFlags: [] as string[], note: '' });

/** 各页面命中红旗时弹出就医提示（统一入口，避免与“已保存”提示互相遮挡） */
function onRedFlag(e: Event) {
  const payload = (e as CustomEvent<RedFlagPayload>).detail;
  emergency.value = {
    title: payload.title || '需要及时寻求专业帮助',
    redFlags: payload.messages,
    note: payload.note || '你录入的内容包含需及时就医的信号；记录已保存，本轮不会生成个性化分析。',
  };
  showEmergency.value = true;
}

onMounted(() => {
  window.addEventListener(REDFLAG_EVENT, onRedFlag);
});
onBeforeUnmount(() => {
  window.removeEventListener(REDFLAG_EVENT, onRedFlag);
});

const menu = [
  { to: '/dashboard', label: '当前情况' },
  { to: '/qa', label: '问与解释' },
  { to: '/timeline', label: '病程' },
  { to: '/followup', label: '复诊准备' },
  { to: '/contents', label: '审核内容库' },
  { to: '/account', label: '账户与数据' },
];

function isActive(to: string) {
  return route.path.startsWith(to);
}

onMounted(async () => {
  try {
    const tips = await api.get<{ title: string; redFlags: string[]; note: string }>('/safety/tips');
    emergency.value = tips;
  } catch {
    // 预取失败不阻塞
  }
});
</script>

<style scoped>
.layout {
  min-height: 100vh;
}
.layout__nav {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 0 40px;
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.layout__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.layout__logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.layout__name {
  font-size: 16px;
  font-weight: 500;
}
.layout__menu {
  display: flex;
  gap: 4px;
  flex: 1;
}
.layout__menu-item {
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
}
.layout__menu-item--active {
  color: var(--primary);
  background: var(--primary-light);
  font-weight: 500;
}
.layout__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.layout__emergency {
  font-size: 12px;
  color: var(--error);
  background: rgba(217, 59, 59, 0.08);
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}
.layout__account {
  font-size: 13px;
  color: var(--text-2);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
}
.layout__account:hover {
  color: var(--primary);
  background: var(--primary-light);
}
.layout__main {
  padding: 24px 40px;
  max-width: 1440px;
  margin: 0 auto;
}
@media (max-width: 700px) {
  .layout__nav {
    padding: 8px 16px;
    gap: 8px;
    height: auto;
    min-height: 56px;
    flex-wrap: wrap;
  }
  .layout__brand {
    order: 1;
  }
  .layout__name {
    display: none;
  }
  .layout__actions {
    order: 2;
    margin-left: auto;
    flex-shrink: 0;
  }
  /* 菜单独占一行，完整宽度横向滚动，不再被品牌与操作区挤压 */
  .layout__menu {
    order: 3;
    flex-basis: 100%;
    min-width: 0;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;
  }
  .layout__menu-item {
    white-space: nowrap;
    flex-shrink: 0;
    padding: 6px 10px;
    font-size: 13px;
  }
  .layout__main {
    padding: 16px;
  }
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
  padding: 24px;
  width: 400px;
}
.dialog__title { font-size: 16px; font-weight: 500; margin: 0 0 12px; }
.dialog__item { display: flex; gap: 8px; margin-bottom: 8px; }
.dialog__dot { color: var(--error); }
.dialog__text { font-size: 14px; flex: 1; }
.dialog__note { font-size: 12px; color: var(--text-2); margin: 12px 0 16px; }
.dialog__btn {
  width: 100%;
  min-height: 44px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
