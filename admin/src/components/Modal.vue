<template>
  <Teleport to="body">
    <div v-if="open" class="modal-mask" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal__header">
          <span class="modal__title">{{ title }}</span>
          <button class="modal__close" @click="$emit('close')">✕</button>
        </div>
        <div class="modal__body">
          <slot />
        </div>
        <div v-if="showActionsArea" class="modal__actions">
          <button class="btn btn--secondary" @click="$emit('close')">取消</button>
          <button class="btn btn--primary" @click="$emit('confirm')">{{ confirmText || '确定' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';

const props = defineProps<{
  open: boolean;
  title: string;
  confirmText?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

/** 有确认文案时展示操作区（历史调用未传 showActions 也能看到确认按钮） */
const showActionsArea = computed(() => !!props.confirmText);

/** 回车触发确认（焦点在文本域/多行输入时不触发） */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' || !props.open) return;
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
  if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') return;
  e.preventDefault();
  emit('confirm');
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 24px;
}
.modal {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  width: 420px;
  max-width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.modal__title {
  font-size: 16px;
  font-weight: 500;
}
.modal__close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-2);
}
.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.btn {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn--primary { background: var(--primary); color: #fff; }
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
</style>
