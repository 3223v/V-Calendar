<template>
  <div class="week-view">
    <div class="week-header">
      <div class="time-column-header"></div>
      <div
        v-for="dateInfo in weekDaysInfo"
        :key="dateInfo.dateStr"
        class="weekday-header"
        :class="{
          today: dateInfo.isToday,
          selected: dateInfo.isSelected,
          'is-holiday': dateInfo.isHoliday,
          weekend: dateInfo.isWeekend
        }"
        @click="handleHeaderClick(dateInfo)"
      >
        <div class="weekday-name">{{ dateInfo.dayName }}</div>
        <div class="weekday-date">
          <span class="day-number" :class="{ 'day-today': dateInfo.isToday }">{{
            dateInfo.day
          }}</span>
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
          :class="{ today: dateInfo.isToday }"
        >
          <div
            v-for="hour in 24"
            :key="hour"
            class="hour-slot"
            :class="{ 'selected-slot': isTimeSlotSelected(dateInfo.dateStr, hour - 1) }"
            @click="handleTimeSlotClick(dateInfo.date, hour - 1)"
          >
            <div
              v-for="event in getEventForHour(getDateInfo(dateInfo.date).events, hour - 1)"
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
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useCalendar } from '../../composables/useCalendar'
import {
  getEventColor,
  formatHour,
  getEventTop,
  getEventHeight,
  getEventForHour
} from '../../utils/event-display'
import type { CalendarEvent } from '../../types'

const emit = defineEmits<{
  (e: 'event-click', event: CalendarEvent): void
}>()

const { weekDays, getDateInfo, selectDate, selectTimeSlot, selectedTimeSlot } = useCalendar()

const weekDaysInfo = computed(() => {
  return weekDays.value.map((date) => {
    const info = getDateInfo(date)
    return {
      ...info,
      dayName: date.format('ddd'),
      day: date.date()
    }
  })
})

function handleEventClick(event: CalendarEvent): void {
  emit('event-click', event)
}

function isTimeSlotSelected(dateStr: string, hour: number): boolean {
  if (!selectedTimeSlot.value) return false
  if (selectedTimeSlot.value.date !== dateStr) return false
  if (!selectedTimeSlot.value.startTime) return true
  const slotHour = parseInt(selectedTimeSlot.value.startTime.split(':')[0], 10)
  return slotHour === hour
}

function handleHeaderClick(dateInfo: any): void {
  selectDate(dateInfo.date)
  selectTimeSlot({
    date: dateInfo.dateStr
  })
}

function handleTimeSlotClick(date: dayjs.Dayjs, hour: number): void {
  const dateStr = date.format('YYYY-MM-DD')
  selectDate(date)
  selectTimeSlot({
    date: dateStr,
    startTime: `${hour.toString().padStart(2, '0')}:00`,
    endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
  })
}
</script>

<style scoped>
.week-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.week-header {
  display: flex;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.time-column-header {
  width: 80px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border-light);
}

.weekday-header {
  flex: 1;
  text-align: center;
  padding: var(--spacing-2) var(--spacing-1);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  border-right: 1px solid var(--color-border-light);
}

.weekday-header:last-child {
  border-right: none;
}

.weekday-header:hover {
  background-color: var(--color-surface-hover);
}

.weekday-header.today {
  background-color: rgba(44, 62, 80, 0.03);
}

.weekday-header.is-holiday .day-number {
  color: var(--color-holiday);
}

.weekday-header.weekend .weekday-name {
  color: var(--color-weekend);
}

.weekday-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-0\.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.weekday-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.day-number {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  color: var(--color-text);
  width: 32px;
  height: 32px;
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
  font-size: 10px;
  color: var(--color-lunar);
}

.week-content {
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
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  padding: 0 var(--spacing-2);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  border-bottom: 1px solid var(--color-border-light);
  font-weight: var(--font-medium);
}

.days-columns {
  display: flex;
  flex: 1;
}

.day-column {
  flex: 1;
  border-right: 1px solid var(--color-border-light);
  position: relative;
}

.day-column:last-child {
  border-right: none;
}

.day-column.today {
  background-color: rgba(44, 62, 80, 0.03);
}

.hour-slot {
  height: 60px;
  border-bottom: 1px solid var(--color-border-light);
  position: relative;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.hour-slot:hover {
  background-color: var(--color-surface-hover);
}

.hour-slot.selected-slot {
  background-color: var(--color-primary-focus);
}

.event-block {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: var(--radius-sm);
  padding: var(--spacing-0\.5) var(--spacing-1);
  color: white;
  font-size: var(--text-xs);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
  z-index: 1;
}

.event-block:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}

.event-title {
  font-weight: var(--font-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-time {
  font-size: 10px;
  opacity: 0.9;
  margin-top: 2px;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .time-column-header,
  .time-column {
    width: 60px;
  }

  .day-number {
    font-size: var(--text-lg);
    width: 28px;
    height: 28px;
  }

  .weekday-name {
    font-size: 11px;
  }

  .lunar-date {
    display: none;
  }
}

@media (max-width: 768px) {
  .time-column-header,
  .time-column {
    width: 50px;
  }

  .day-number {
    font-size: var(--text-md);
    width: 24px;
    height: 24px;
  }

  .time-slot {
    font-size: 10px;
  }
}
</style>
