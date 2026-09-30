<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { setUnauthorizedHandler } from '@/api/client';

const router = useRouter();

onMounted(() => {
  // 会话失效时引导回登录页
  setUnauthorizedHandler(() => {
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' });
    }
  });
});
</script>
