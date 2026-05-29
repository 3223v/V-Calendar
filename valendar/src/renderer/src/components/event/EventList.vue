<template>
  <div class="event-list">
    <div class="list-header">
      <h3 class="list-title">事件列表</h3>
      <button class="btn btn-primary" @click="handleCreate">
        + 新建事件
      </button>
    </div>
    <div v-if="events.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <p class="empty-text">暂无事件</p>
      <p class="empty-hint">点击上方按钮创建新事件</p>
    </div>
    <div v-else class="events-container">
      <EventCard
        v-for="event in sortedEvents"
        :key="event.id"
        :event="event"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import EventCard from './EventCard.vue';
import type { CalendarEvent } from '../../types';

const props = defineProps<{
  events: CalendarEvent[];
}>();

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'edit', event: CalendarEvent): void;
  (e: 'delete', event: CalendarEvent): void;
}>();

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => {
    const dateA = dayjs(a.startDate);
    const dateB = dayjs(b.startDate);
    return dateB.valueOf() - dateA.valueOf();
  });
});

function handleCreate(): void {
  emit('create');
}

function handleEdit(event: CalendarEvent): void {
  emit('edit', event);
}

function handleDelete(event: CalendarEvent): void {
  emit('delete', event);
}
</script>

<style scoped>
.event-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  color: var(--color-text);
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.empty-hint {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.events-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
