<template>
  <div class="event-card" :style="{ borderLeftColor: eventColor }">
    <div class="event-header">
      <h3 class="event-title">{{ event.title }}</h3>
      <div class="event-actions">
        <button class="action-btn" @click="handleEdit" title="编辑">
          ✎
        </button>
        <button class="action-btn delete" @click="handleDelete" title="删除">
          ×
        </button>
      </div>
    </div>
    <div class="event-details">
      <div v-if="event.description" class="event-description">
        {{ event.description }}
      </div>
      <div class="event-meta">
        <div class="meta-item">
          <span class="meta-icon">📅</span>
          <span>{{ formattedDateRange }}</span>
        </div>
        <div v-if="!event.isAllDay && event.startTime" class="meta-item">
          <span class="meta-icon">🕒</span>
          <span>{{ formattedTimeRange }}</span>
        </div>
        <div v-if="event.location" class="meta-item">
          <span class="meta-icon">📍</span>
          <span>{{ event.location }}</span>
        </div>
        <div v-if="event.alarm?.isEnabled" class="meta-item">
          <span class="meta-icon">⏰</span>
          <span>提前 {{ event.alarm.before }} 分钟</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import type { CalendarEvent, EventCategory } from '../../types';

const props = defineProps<{
  event: CalendarEvent;
}>();

const emit = defineEmits<{
  (e: 'edit', event: CalendarEvent): void;
  (e: 'delete', event: CalendarEvent): void;
}>();

const eventColor = computed(() => {
  const colors: Record<EventCategory, string> = {
    work: 'var(--color-event-work)',
    personal: 'var(--color-event-personal)',
    holiday: 'var(--color-event-holiday)',
    important: 'var(--color-event-important)',
    custom: 'var(--color-primary)'
  };
  return colors[props.event.category] || colors.personal;
});

const formattedDateRange = computed(() => {
  const start = dayjs(props.event.startDate);
  const end = dayjs(props.event.endDate);

  if (props.event.startDate === props.event.endDate) {
    return start.format('YYYY年M月D日');
  }

  return `${start.format('M月D日')} - ${end.format('M月D日')}`;
});

const formattedTimeRange = computed(() => {
  if (!props.event.startTime) return '';
  if (!props.event.endTime) return props.event.startTime;
  return `${props.event.startTime} - ${props.event.endTime}`;
});

function handleEdit(): void {
  emit('edit', props.event);
}

function handleDelete(): void {
  if (confirm('确定要删除这个事件吗？')) {
    emit('delete', props.event);
  }
}
</script>

<style scoped>
.event-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  border-left: 4px solid;
  transition: var(--transition-base);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.event-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: var(--transition-base);
  pointer-events: none;
}

.event-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
  border-left-width: 6px;
}

.event-card:hover::before {
  opacity: 1;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-3);
}

.event-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  flex: 1;
  margin-right: var(--spacing-3);
  line-height: var(--leading-tight);
  letter-spacing: -0.01em;
}

.event-actions {
  display: flex;
  gap: var(--spacing-1);
  opacity: 0;
  transform: translateY(4px);
  transition: var(--transition-fast);
}

.event-card:hover .event-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
}

.action-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
  border-color: var(--color-border);
}

.action-btn.delete:hover {
  background-color: var(--color-error);
  color: var(--color-text-inverse);
  border-color: var(--color-error);
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.event-description {
  font-size: var(--text-md);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background-color: var(--color-surface-hover);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-full);
  transition: var(--transition-fast);
}

.meta-item:hover {
  background-color: var(--color-surface-active);
  color: var(--color-text);
}

.meta-icon {
  font-size: var(--text-base);
  display: flex;
  align-items: center;
}

@media (max-width: 640px) {
  .event-card {
    padding: var(--spacing-3);
  }
  
  .event-header {
    margin-bottom: var(--spacing-2);
  }
  
  .event-title {
    font-size: var(--text-md);
  }
  
  .event-meta {
    gap: var(--spacing-1);
  }
  
  .meta-item {
    font-size: var(--text-xs);
    padding: var(--spacing-0\.5) var(--spacing-1\.5);
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
}
</style>
