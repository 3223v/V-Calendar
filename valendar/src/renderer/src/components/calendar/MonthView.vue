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
          <span class="day-number" :class="{ 'day-today': dateInfo.isToday }">
            {{ dateInfo.day }}
          </span>
          <span v-if="dateInfo.lunarDateString && !dateInfo.isCurrentMonth" class="lunar-date">
            {{ dateInfo.lunarDateString }}
          </span>
        </div>
        <div v-if="dateInfo.holidayName" class="holiday-name">
          {{ dateInfo.holidayName }}
        </div>
        <div v-if="dateInfo.eventCount > 0" class="event-markers">
          <div
            v-for="(event, idx) in dateInfo.events.slice(0, 2)"
            :key="idx"
            class="event-marker"
            :style="{ backgroundColor: getEventColor(event.category) }"
            :title="event.title"
          >
            <span class="event-title">{{ event.title }}</span>
          </div>
          <div v-if="dateInfo.eventCount > 2" class="more-events">
            +{{ dateInfo.eventCount - 2 }} 更多
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
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--spacing-2) 0;
  flex-shrink: 0;
}

.weekday {
  text-align: center;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-2) 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  flex: 1;
  overflow: hidden;
}

.calendar-day {
  border-right: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--spacing-1\.5);
  min-height: 0;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.calendar-day:hover {
  background-color: var(--color-surface-hover);
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day.other-month {
  background-color: var(--color-surface);
}

.calendar-day.other-month .day-number {
  color: var(--color-text-light);
}

.calendar-day.other-month .event-markers {
  opacity: 0.5;
}

.calendar-day.today {
  background-color: rgba(44, 62, 80, 0.03);
}

.calendar-day.selected {
  background-color: rgba(44, 62, 80, 0.06);
}

.calendar-day.selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary);
}

.calendar-day.holiday .day-number {
  color: var(--color-holiday);
  font-weight: var(--font-semibold);
}

.calendar-day.weekend .day-number {
  color: var(--color-weekend);
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-1);
  flex-shrink: 0;
}

.day-number {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.day-number.day-today {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  font-weight: var(--font-semibold);
}

.lunar-date {
  font-size: var(--text-xs);
  color: var(--color-lunar);
  line-height: 1;
}

.holiday-name {
  font-size: var(--text-xs);
  color: var(--color-holiday);
  font-weight: var(--font-medium);
  margin-bottom: var(--spacing-0\.5);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-markers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow: hidden;
}

.event-marker {
  padding: 1px 4px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.event-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-events {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  padding: 1px 4px;
  font-weight: var(--font-medium);
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .calendar-day {
    padding: var(--spacing-1);
  }
  
  .day-number {
    font-size: var(--text-xs);
    width: 22px;
    height: 22px;
  }
  
  .event-marker {
    font-size: 10px;
    padding: 0 3px;
  }
}

@media (max-width: 768px) {
  .weekday {
    font-size: 10px;
  }
  
  .day-header {
    margin-bottom: 0;
  }
  
  .lunar-date {
    display: none;
  }
}
</style>
