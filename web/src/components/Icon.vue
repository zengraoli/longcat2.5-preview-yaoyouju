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
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'download'">
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'people'">
      <circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.8" />
      <path d="M3 19c1.2-3 3.3-4.5 6-4.5s4.8 1.5 6 4.5M16 5.5a3 3 0 0 1 0 5.8M21 19c-.8-2-2-3.3-3.6-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" stroke-width="1.8" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'warning'">
      <path d="M12 4 3 20h18L12 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M12 10v5M12 17.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'image'">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.8" />
      <circle cx="9" cy="10" r="1.6" stroke="currentColor" stroke-width="1.6" />
      <path d="m5 17 4-4 3 3 3-3 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'camera'">
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" stroke-width="1.8" />
    </template>
    <template v-else-if="name === 'flag'">
      <path d="M6 3v18M6 4h11l-2 4 2 4H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'chat'">
      <path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 19h16M6 19V9M11 19V5M16 19v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'list'">
      <path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" />
    </template>
    <template v-else-if="name === 'signal'">
      <path d="M5 19v-4M10 19v-8M15 19v-12M20 19V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'send'">
      <path d="M4 12 20 4l-6 16-3-7-7-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12 4 4 10-10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="m13.5 6.5 4 4" stroke="currentColor" stroke-width="1.8" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name:
    | 'home'
    | 'qa'
    | 'timeline'
    | 'followup'
    | 'mine'
    | 'report'
    | 'course'
    | 'life'
    | 'clock'
    | 'shield'
    | 'settings'
    | 'close'
    | 'download'
    | 'people'
    | 'book'
    | 'trash'
    | 'calendar'
    | 'warning'
    | 'search'
    | 'image'
    | 'camera'
    | 'flag'
    | 'chat'
    | 'chart'
    | 'list'
    | 'signal'
    | 'send'
    | 'check'
    | 'edit'
    | 'plus';
  size?: number;
}>();
</script>
