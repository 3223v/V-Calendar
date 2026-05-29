<template>
  <Transition name="slide">
    <div v-if="hasActiveAlarm" class="alarm-popup">
      <div class="alarm-header">
        <div class="alarm-icon">⏰</div>
        <div class="alarm-title">日程提醒</div>
      </div>
      <div class="alarm-body">
        <div class="alarm-message">{{ activeAlarm?.message }}</div>
        <div class="alarm-time">{{ formattedTime }}</div>
      </div>
      <div class="alarm-actions">
        <button class="btn btn-secondary" @click="handleSnooze">
          稍后提醒
        </button>
        <button class="btn btn-primary" @click="handleDismiss">
          知道了
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAlarm } from '../../composables/useAlarm';

const { activeAlarm, hasActiveAlarm, snooze, dismiss } = useAlarm();

const formattedTime = computed(() => {
  if (!activeAlarm.value) return '';
  const date = new Date(activeAlarm.value.triggerTime);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

async function handleSnooze(): Promise<void> {
  if (activeAlarm.value) {
    await snooze(activeAlarm.value.id);
  }
}

async function handleDismiss(): Promise<void> {
  if (activeAlarm.value) {
    await dismiss(activeAlarm.value.id);
  }
}
</script>

<style scoped>
.alarm-popup {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-lg);
  min-width: 320px;
  z-index: 2000;
  border: 2px solid var(--color-primary);
}

.alarm-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.alarm-icon {
  font-size: 32px;
  animation: ring 1s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  75% { transform: rotate(-15deg); }
}

.alarm-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.alarm-body {
  margin-bottom: var(--spacing-lg);
}

.alarm-message {
  font-size: 16px;
  color: var(--color-text);
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.alarm-time {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.alarm-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
