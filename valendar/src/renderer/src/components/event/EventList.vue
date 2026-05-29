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
  padding: var(--spacing-4) var(--spacing-5);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  backdrop-filter: blur(var(--blur-sm));
}

.list-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
  line-height: var(--leading-tight);
}

.list-header .btn-primary {
  border-radius: var(--radius-lg);
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-base);
}

.list-header .btn-primary:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-10);
  margin: var(--spacing-5);
  border-radius: var(--radius-xl);
  background: linear-gradient(
    135deg,
    var(--color-surface) 0%,
    var(--color-surface-hover) 100%
  );
  border: 1px dashed var(--color-border);
  animation: fadeIn var(--transition-slow) ease-out;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: var(--spacing-5);
  opacity: 0.6;
  filter: grayscale(0.3);
  line-height: 1;
}

.empty-text {
  font-size: var(--text-lg);
  color: var(--color-text);
  font-weight: var(--font-medium);
  margin-bottom: var(--spacing-2);
  letter-spacing: -0.01em;
}

.empty-hint {
  font-size: var(--text-md);
  color: var(--color-text-light);
  line-height: var(--leading-relaxed);
}

.events-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4) var(--spacing-5);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}

.events-container::-webkit-scrollbar {
  width: 4px;
}

.events-container::-webkit-scrollbar-track {
  background: transparent;
  margin: var(--spacing-2) 0;
}

.events-container::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-base);
}

.events-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-light);
}
</style>
