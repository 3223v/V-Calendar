<template>
  <div class="week-view">
    <div class="week-header">
      <div class="time-column"></div>
      <div
        v-for="dateInfo in weekDaysInfo"
        :key="dateInfo.dateStr"
        class="weekday-header"
        :class="{
          'today': dateInfo.isToday,
          'selected': dateInfo.isSelected,
          'holiday': dateInfo.isHoliday,
          'weekend': dateInfo.isWeekend
        }"
        @click="selectDate(dateInfo.date)"
      >
        <div class="weekday-name">{{ dateInfo.dayName }}</div>
        <div class="weekday-date">
          <span class="day-number">{{ dateInfo.day }}</span>
          <span v-if="dateInfo.lunarDateString" class="lunar-date">
            {{ dateInfo.lunarDateString }}
          </span>
        </div>
      </div>
    </div>
    <div class="week-content">
      <div class="time-column">
        <div v-for="hour in 24" :key="hour" class="time-slot">
          {{ formatHour(hour - 1) }}
        </div>
      </div>
      <div class="days-columns">
        <div
          v-for="dateInfo in weekDaysInfo"
          :key="dateInfo.dateStr"
          class="day-column"
          :class="{ 'today': dateInfo.isToday }"
        >
          <div v-for="hour in 24" :key="hour" class="hour-slot">
            <div
              v-for="event in getEventsForHour(dateInfo.date, hour - 1)"
              :key="event.id"
              class="event-block"
              :style="{
                backgroundColor: getEventColor(event.category),
                top: getEventTop(event),
                height: getEventHeight(event)
              }"
              @click="handleEventClick(event)"
            >
              <div class="event-title">{{ event.title }}</div>
              <div v-if="event.startTime" class="event-time">
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
import dayjs from 'dayjs';
import { useCalendar } from '../../composables/useCalendar';
import type { CalendarEvent, EventCategory } from '../../types';

const emit = defineEmits<{
  (e: 'event-click', event: CalendarEvent): void;
}>();

const { weekDays, getDateInfo, selectDate } = useCalendar();

const weekDaysInfo = computed(() => {
  return weekDays.value.map(date => {
    const info = getDateInfo(date);
    return {
      ...info,
      dayName: date.format('ddd'),
      day: date.date()
    };
  });
});

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function getEventsForHour(date: dayjs.Dayjs, hour: number): CalendarEvent[] {
  const events = getDateInfo(date).events.filter(e => {
    if (!e.startTime) return false;
    const eventHour = parseInt(e.startTime.split(':')[0], 10);
    return eventHour === hour;
  });
  return events;
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
.week-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
}

.week-header {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.time-column {
  width: 60px;
  flex-shrink: 0;
}

.weekday-header {
  flex: 1;
  text-align: center;
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 1px solid var(--color-border);
}

.weekday-header:hover {
  background-color: var(--color-surface-hover);
}

.weekday-header.today {
  background-color: var(--color-surface);
}

.weekday-header.today .day-number {
  background-color: var(--color-primary);
  color: white;
  border-radius: 50%;
}

.weekday-name {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.weekday-date {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day-number {
  font-size: 20px;
  font-weight: 500;
  color: var(--color-text);
}

.lunar-date {
  font-size: 10px;
  color: var(--color-lunar);
  margin-top: 2px;
}

.week-content {
  display: flex;
  flex: 1;
  overflow-y: auto;
}

.time-slot {
  height: 60px;
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 0 var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.days-columns {
  display: flex;
  flex: 1;
}

.day-column {
  flex: 1;
  border-left: 1px solid var(--color-border);
  position: relative;
}

.day-column.today {
  background-color: rgba(44, 62, 80, 0.03);
}

.hour-slot {
  height: 60px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.event-block {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 4px;
  padding: 4px;
  color: white;
  font-size: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  z-index: 1;
}

.event-block:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}

.event-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-time {
  font-size: 10px;
  opacity: 0.9;
  margin-top: 2px;
}
</style>
