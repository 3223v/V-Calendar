<template>
  <div class="day-view">
    <div class="day-header">
      <div class="date-info">
        <div class="day-name">{{ selectedDateInfo.dayName }}</div>
        <div class="date-display">
          <span class="day-number">{{ selectedDateInfo.day }}</span>
          <div class="date-details">
            <span class="month-year">{{ selectedDateInfo.monthYear }}</span>
            <span v-if="selectedDateInfo.lunarDateString" class="lunar-date">
              {{ selectedDateInfo.lunarDateString }}
            </span>
            <span v-if="selectedDateInfo.holidayName" class="holiday-name">
              {{ selectedDateInfo.holidayName }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="day-content">
      <div class="time-column">
        <div v-for="hour in 24" :key="hour" class="time-slot">
          {{ formatHour(hour - 1) }}
        </div>
      </div>
      <div class="events-column">
        <div v-for="hour in 24" :key="hour" class="hour-slot">
          <div
            v-for="event in getEventsForHour(hour - 1)"
            :key="event.id"
            class="event-block"
            :style="{
              backgroundColor: getEventColor(event.category),
              top: getEventTop(event),
              height: getEventHeight(event)
            }"
            @click="handleEventClick(event)"
          >
            <div class="event-content">
              <div class="event-title">{{ event.title }}</div>
              <div v-if="event.startTime && event.endTime" class="event-time">
                {{ event.startTime }} - {{ event.endTime }}
              </div>
              <div v-else-if="event.startTime" class="event-time">
                {{ event.startTime }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCalendar } from '../../composables/useCalendar';
import type { CalendarEvent, EventCategory } from '../../types';

const emit = defineEmits<{
  (e: 'event-click', event: CalendarEvent): void;
}>();

const { selectedDate, getDateInfo } = useCalendar();

const selectedDateInfo = computed(() => {
  const info = getDateInfo(selectedDate.value);
  return {
    ...info,
    dayName: selectedDate.value.format('dddd'),
    day: selectedDate.value.date(),
    monthYear: selectedDate.value.format('YYYY年M月')
  };
});

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function getEventsForHour(hour: number): CalendarEvent[] {
  return selectedDateInfo.value.events.filter(e => {
    if (!e.startTime) return false;
    const eventHour = parseInt(e.startTime.split(':')[0], 10);
    return eventHour === hour;
  });
}

function getEventTop(event: CalendarEvent): string {
  if (!event.startTime) return '0px';
  const [hours, minutes] = event.startTime.split(':').map(Number);
  return `${(hours * 60 + minutes) / 60 * 60}px`;
}

function getEventHeight(event: CalendarEvent): string {
  if (!event.startTime || !event.endTime) return '60px';
  const [startHours, startMinutes] = event.startTime.split(':').map(Number);
  const [endHours, endMinutes] = event.endTime.split(':').map(Number);
  const startMinutesTotal = startHours * 60 + startMinutes;
  const endMinutesTotal = endHours * 60 + endMinutes;
  const duration = Math.max(endMinutesTotal - startMinutesTotal, 30);
  return `${(duration / 60) * 60}px`;
}

function getEventColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    work: 'var(--color-event-work)',
    personal: 'var(--color-event-personal)',
    holiday: 'var(--color-event-holiday)',
    important: 'var(--color-event-important)',
    custom: 'var(--color-primary)'
  };
  return colors[category] || colors.personal;
}

function handleEventClick(event: CalendarEvent): void {
  emit('event-click', event);
}
</script>

<style scoped>
.day-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.day-header {
  padding: var(--spacing-6);
  text-align: center;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.date-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
}

.day-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  text-transform: capitalize;
  letter-spacing: 0.05em;
}

.date-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.day-number {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  line-height: 1;
}

.date-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-1);
}

.month-year {
  font-size: var(--text-lg);
  color: var(--color-text);
  font-weight: var(--font-medium);
}

.lunar-date {
  font-size: var(--text-md);
  color: var(--color-lunar);
}

.holiday-name {
  font-size: var(--text-md);
  color: var(--color-holiday);
  font-weight: var(--font-medium);
}

.day-content {
  display: flex;
  flex: 1;
  overflow-y: auto;
}

.time-column {
  width: 80px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border-light);
}

.time-slot {
  height: 60px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  padding: 0 var(--spacing-2);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  border-bottom: 1px solid var(--color-border-light);
}

.events-column {
  flex: 1;
  position: relative;
}

.hour-slot {
  height: 60px;
  border-bottom: 1px solid var(--color-border-light);
  position: relative;
}

.event-block {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: var(--radius-md);
  padding: var(--spacing-1) var(--spacing-2);
  color: white;
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
  z-index: 1;
}

.event-block:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}

.event-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
}

.event-title {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-time {
  font-size: var(--text-sm);
  opacity: 0.9;
  margin-top: var(--spacing-0\.5);
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .day-header {
    padding: var(--spacing-4);
  }
  
  .day-number {
    font-size: var(--text-4xl);
  }
  
  .month-year {
    font-size: var(--text-md);
  }
  
  .time-column {
    width: 60px;
  }
  
  .time-slot {
    font-size: 10px;
  }
}

@media (max-width: 768px) {
  .day-header {
    padding: var(--spacing-3);
  }
  
  .day-number {
    font-size: var(--text-3xl);
  }
  
  .date-display {
    flex-direction: column;
    gap: var(--spacing-1);
  }
  
  .date-details {
    align-items: center;
  }
  
  .time-column {
    width: 50px;
  }
}
</style>
