<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(var(--blur-sm));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--transition-fast) ease-out;
}

.modal {
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  max-width: 520px;
  width: calc(100% - var(--spacing-8));
  max-height: calc(100vh - var(--spacing-16));
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
  animation: slideUp var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.close-btn {
  width: 36px;
  height: 36px;
  font-size: 20px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
  transform: rotate(90deg);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
