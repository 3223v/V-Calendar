<template>
  <div class="month-view">
    <div class="calendar-header">
      <div class="weekday" v-for="day in weekDayNames" :key="day">
        {{ day }}
      </div>
    </div>
    <div class="calendar-grid">
      <div
        v-for="(dateInfo, index) in monthDaysInfo"
        :key="index"
        class="calendar-day"
        :class="{
          'other-month': !dateInfo.isCurrentMonth,
          'today': dateInfo.isToday,
          'selected': dateInfo.isSelected,
          'holiday': dateInfo.isHoliday,
          'weekend': dateInfo.isWeekend
        }"
        @click="selectDate(dateInfo.date)"
      >
        <div class="day-header">
          <span class="day-number">{{ dateInfo.day }}</span>
          <span v-if="dateInfo.lunarDateString" class="lunar-date">
            {{ dateInfo.lunarDateString }}
          </span>
        </div>
        <div v-if="dateInfo.holidayName" class="holiday-name">
          {{ dateInfo.holidayName }}
        </div>
        <div v-if="dateInfo.eventCount > 0" class="event-markers">
          <div
            v-for="(event, idx) in dateInfo.events.slice(0, 3)"
            :key="idx"
            class="event-marker"
            :style="{ backgroundColor: getEventColor(event.category) }"
            :title="event.title"
          >
            <span class="event-title">{{ event.title }}</span>
          </div>
          <div v-if="dateInfo.eventCount > 3" class="more-events">
            +{{ dateInfo.eventCount - 3 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCalendar } from '../../composables/useCalendar';
import type { EventCategory } from '../../types';

const { monthDays, weekDayNames, getDateInfo, selectDate } = useCalendar();

const monthDaysInfo = computed(() => {
  return monthDays.value.map(date => getDateInfo(date));
});

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
</script>

<style scoped>
.month-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-sm) 0;
}

.weekday {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  padding: var(--spacing-sm) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  overflow-y: auto;
}

.calendar-day {
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-sm);
  min-height: 100px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.calendar-day:hover {
  background-color: var(--color-surface-hover);
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day.other-month {
  background-color: var(--color-surface);
  opacity: 0.6;
}

.calendar-day.today .day-number {
  background-color: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day.selected {
  background-color: var(--color-surface);
  border: 2px solid var(--color-primary);
}

.calendar-day.holiday .day-number {
  color: var(--color-holiday);
}

.calendar-day.weekend .day-number {
  color: var(--color-weekend);
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: var(--spacing-xs);
}

.day-number {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.lunar-date {
  font-size: 10px;
  color: var(--color-lunar);
  line-height: 1.2;
}

.holiday-name {
  font-size: 10px;
  color: var(--color-holiday);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
  line-height: 1.2;
}

.event-markers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow: hidden;
}

.event-marker {
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 10px;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-events {
  font-size: 10px;
  color: var(--color-text-secondary);
  padding: 2px 4px;
}
</style>
