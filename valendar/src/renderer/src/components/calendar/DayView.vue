<template>
  <div class="day-view">
    <div class="day-header">
      <div class="date-info">
        <div class="date-row">
          <span class="day-name"
            >{{ selectedDateInfo.dayNameCN }} {{ selectedDateInfo.dayNameEN }}</span
          >
          <span class="date-divider">·</span>
          <span class="solar-date">{{ selectedDateInfo.solarDate }}</span>
          <span class="date-divider">·</span>
          <span class="lunar-date">{{ selectedDateInfo.lunarDateStr }}</span>
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
        <div
          v-for="hour in 24"
          :key="hour"
          class="hour-slot"
          :class="{ 'selected-slot': isTimeSlotSelected(hour - 1) }"
          @click="handleTimeSlotClick(hour - 1)"
        ></div>
        <div class="events-overlay">
          <div
            v-for="event in selectedDateInfo.events"
            :key="event.id"
            class="event-block"
            :style="{
              backgroundColor: getEventColor(event.category),
              top: getEventTop(event),
              height: getEventHeight(event)
            }"
            @click.stop="handleEventClick(event)"
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
import { computed } from 'vue'
import { useCalendar } from '../../composables/useCalendar'
import {
  getEventColor,
  formatHour,
  getEventTop,
  getEventHeight
} from '../../utils/event-display'
import type { CalendarEvent } from '../../types'

const emit = defineEmits<{
  (e: 'event-click', event: CalendarEvent): void
}>()

const { selectedDate, getDateInfo, selectTimeSlot, selectedTimeSlot } = useCalendar()

const selectedDateInfo = computed(() => {
  const info = getDateInfo(selectedDate.value)
  const dayOfWeek = selectedDate.value.day()

  const dayNamesCN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const dayNamesEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return {
    ...info,
    dayNameCN: dayNamesCN[dayOfWeek],
    dayNameEN: dayNamesEN[dayOfWeek],
    solarDate: selectedDate.value.format('YYYY年M月D日'),
    lunarDateStr: info.lunarDateString || ''
  }
})

function handleEventClick(event: CalendarEvent): void {
  emit('event-click', event)
}

function isTimeSlotSelected(hour: number): boolean {
  if (!selectedTimeSlot.value) return false
  const dateStr = selectedDate.value.format('YYYY-MM-DD')
  if (selectedTimeSlot.value.date !== dateStr) return false
  if (!selectedTimeSlot.value.startTime) return true
  const slotHour = parseInt(selectedTimeSlot.value.startTime.split(':')[0], 10)
  return slotHour === hour
}

function handleTimeSlotClick(hour: number): void {
  const dateStr = selectedDate.value.format('YYYY-MM-DD')
  selectTimeSlot({
    date: dateStr,
    startTime: `${hour.toString().padStart(2, '0')}:00`,
    endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
  })
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
  padding: var(--spacing-5) var(--spacing-6);
  text-align: center;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.date-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

.date-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  font-size: var(--text-xl);
}

.day-name {
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.date-divider {
  color: var(--color-text-light);
  font-weight: var(--font-light);
}

.solar-date {
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.lunar-date {
  font-weight: var(--font-medium);
  color: var(--color-lunar);
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
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  padding: 0 var(--spacing-2);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  border-bottom: 1px solid var(--color-border-light);
  font-weight: var(--font-medium);
}

.events-column {
  flex: 1;
  position: relative;
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

.events-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
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
  pointer-events: auto;
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

  .date-row {
    font-size: var(--text-lg);
    gap: var(--spacing-2);
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

  .date-row {
    font-size: var(--text-md);
    gap: var(--spacing-1\.5);
    flex-wrap: wrap;
    justify-content: center;
  }

  .time-column {
    width: 50px;
  }
}
</style>
