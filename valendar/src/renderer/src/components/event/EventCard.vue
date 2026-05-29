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
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border-left: 4px solid;
  transition: all 0.2s ease;
  cursor: pointer;
}

.event-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
  margin-right: var(--spacing-sm);
}

.event-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.event-card:hover .event-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  font-size: 16px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
}

.action-btn.delete:hover {
  background-color: var(--color-error);
  color: white;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.event-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.meta-icon {
  font-size: 14px;
}
</style>
