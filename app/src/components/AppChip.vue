<template>
  <view
    class="app-chip"
    :class="[`app-chip--${state}`]"
    @click="emit('click')"
  >
    <slot />
  </view>
</template>

<script setup lang="ts">
interface Props {
  state?: 'selected' | 'unselected' | 'skip';
}

withDefaults(defineProps<Props>(), {
  state: 'unselected',
});

const emit = defineEmits<{ click: [] }>();
</script>

<style scoped>
.app-chip {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-1);
}
.app-chip--selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.app-chip--skip {
  background: transparent;
  border-color: transparent;
  color: var(--text-3);
}
</style>
