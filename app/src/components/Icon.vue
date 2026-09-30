<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- 当前情况（首页） -->
    <template v-if="name === 'home'">
      <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M5 9.5V21h14V9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M9 21v-6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <!-- 问与解释 -->
    <template v-else-if="name === 'qa'">
      <path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <!-- 病程 -->
    <template v-else-if="name === 'timeline'">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <!-- 复诊准备 -->
    <template v-else-if="name === 'followup'">
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.8" />
      <path d="M9 4.5V3h6v1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M8.5 10h7M8.5 13.5h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <!-- 我的 -->
    <template v-else-if="name === 'mine'">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <!-- 困惑：报告术语 -->
    <template v-else-if="name === 'report'">
      <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M14 3v4h4M10 12h6M10 16h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <!-- 困惑：病程变化 -->
    <template v-else-if="name === 'course'">
      <path d="M4 18 9 11l4 4 7-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M4 21h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <!-- 困惑：生活影响 -->
    <template v-else-if="name === 'life'">
      <circle cx="12" cy="6" r="2.5" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 9v6M12 15l-4 6M12 15l4 6M7 11h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: 'home' | 'qa' | 'timeline' | 'followup' | 'mine' | 'report' | 'course' | 'life';
  size?: number;
}>();
</script>
