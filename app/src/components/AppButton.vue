<template>
  <button
    class="app-button"
    :class="[`app-button--${type}`, { 'app-button--block': block, 'app-button--disabled': disabled }]"
    :disabled="disabled"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'primary' | 'secondary' | 'soft' | 'danger';
  block?: boolean;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: 'primary',
  block: false,
  disabled: false,
});

const emit = defineEmits<{ click: [] }>();

function onClick() {
  emit('click');
}
</script>

<style scoped>
.app-button {
  min-height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.app-button--block {
  width: 100%;
}
.app-button--primary {
  background: var(--primary);
  color: #fff;
}
.app-button--secondary {
  background: var(--surface);
  color: var(--primary);
  border: 1px solid var(--primary);
}
.app-button--soft {
  background: var(--primary-light);
  color: var(--primary);
}
.app-button--danger {
  background: var(--error);
  color: #fff;
}
.app-button--disabled {
  opacity: 0.5;
}
</style>
