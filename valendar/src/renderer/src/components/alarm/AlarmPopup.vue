<template>
  <Transition name="alarm">
    <div v-if="hasActiveAlarm" class="alarm-popup">
      <div class="alarm-accent"></div>
      <div class="alarm-header">
        <div class="alarm-icon-ring">
          <div class="alarm-icon">⏰</div>
        </div>
        <div class="alarm-header-text">
          <div class="alarm-title">日程提醒</div>
          <div class="alarm-time">{{ formattedTime }}</div>
        </div>
      </div>
      <div class="alarm-divider"></div>
      <div class="alarm-body">
        <div class="alarm-message">{{ activeAlarm?.message }}</div>
      </div>
      <div class="alarm-actions">
        <button class="alarm-btn alarm-btn-secondary" @click="handleSnooze">
          稍后提醒
        </button>
        <button class="alarm-btn alarm-btn-primary" @click="handleDismiss">
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
  bottom: var(--spacing-6);
  right: var(--spacing-6);
  background-color: var(--color-surface);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-5) var(--spacing-6);
  box-shadow: var(--shadow-2xl);
  min-width: 340px;
  max-width: 400px;
  z-index: 2000;
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  backdrop-filter: blur(var(--blur-xl));
  -webkit-backdrop-filter: blur(var(--blur-xl));
}

.alarm-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light), var(--color-primary));
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.alarm-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-1);
  margin-bottom: var(--spacing-4);
}

.alarm-icon-ring {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary-focus), var(--color-surface-active));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.alarm-icon-ring::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary);
  opacity: 0.3;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.15);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.alarm-icon {
  font-size: var(--text-2xl);
  animation: ring-sway 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
  transform-origin: 50% 0;
  line-height: 1;
}

@keyframes ring-sway {
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(20deg); }
  30% { transform: rotate(-16deg); }
  45% { transform: rotate(12deg); }
  60% { transform: rotate(-8deg); }
  75% { transform: rotate(4deg); }
}

.alarm-header-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0\.5);
  min-width: 0;
}

.alarm-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  line-height: var(--leading-tight);
  letter-spacing: -0.01em;
}

.alarm-time {
  font-size: var(--text-sm);
  color: var(--color-text-light);
  font-weight: var(--font-normal);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

.alarm-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  margin-bottom: var(--spacing-4);
}

.alarm-body {
  margin-bottom: var(--spacing-5);
}

.alarm-message {
  font-size: var(--text-md);
  color: var(--color-text);
  font-weight: var(--font-medium);
  line-height: var(--leading-relaxed);
}

.alarm-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

.alarm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2\.5) var(--spacing-5);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: 0.01em;
  cursor: pointer;
  border: none;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  user-select: none;
}

.alarm-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.alarm-btn:hover::after {
  opacity: 0.06;
}

.alarm-btn:active {
  transform: scale(0.97);
  transition: transform var(--transition-fast);
}

.alarm-btn-secondary {
  background-color: var(--color-surface-hover);
  color: var(--color-text-secondary);
}

.alarm-btn-secondary:hover {
  background-color: var(--color-surface-active);
  color: var(--color-text);
}

.alarm-btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-sm);
}

.alarm-btn-primary:hover {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.alarm-btn-primary:active {
  transform: translateY(0) scale(0.97);
  box-shadow: var(--shadow-xs);
}

.alarm-enter-active {
  transition: all var(--transition-spring);
}

.alarm-leave-active {
  transition: all var(--transition-slow);
}

.alarm-enter-from {
  opacity: 0;
  transform: translateX(80px) scale(0.92);
  filter: blur(var(--blur-sm));
}

.alarm-leave-to {
  opacity: 0;
  transform: translateX(60px) scale(0.96);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
