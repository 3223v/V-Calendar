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
          'is-holiday': dateInfo.isHoliday,
          'weekend': dateInfo.isWeekend
        }"
        @click="selectDate(dateInfo.date)"
      >
        <div class="day-header">
          <span class="day-number" :class="{ 'day-today': dateInfo.isToday }">
            {{ dateInfo.day }}
          </span>
          <div class="day-tags">
            <!-- 调休工作日标记 -->
            <span v-if="isAdditionalWorkday(dateInfo)" class="tag tag-work">
              班
            </span>
            <!-- 农历节日/节气（右上角） -->
            <span v-if="dateInfo.lunarFestival || dateInfo.solarTerm" class="tag tag-lunar-festival">
              {{ dateInfo.lunarFestival || dateInfo.solarTerm }}
            </span>
          </div>
        </div>
        <div class="day-content">
          <!-- 农历信息 -->
          <span class="lunar-date" :class="{ 'lunar-first': dateInfo.lunarInfo?.lunarDay === 1 }">
            {{ dateInfo.lunarDateString }}
          </span>
          <!-- 阳历节假日（右下角） -->
          <span v-if="dateInfo.solarHoliday" class="solar-holiday">
            {{ dateInfo.solarHoliday }}
          </span>
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
            +{{ dateInfo.eventCount - 2 }}
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

// 判断是否为调休工作日（周末但需要上班）
function isAdditionalWorkday(dateInfo: any): boolean {
  return dateInfo.isWeekend && dateInfo.isWorkday;
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
</script>

<style scoped>
.month-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-surface);
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
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
  padding: var(--spacing-1);
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

.calendar-day.other-month .lunar-date,
.calendar-day.other-month .solar-holiday {
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

.calendar-day.is-holiday .day-number {
  color: var(--color-holiday);
  font-weight: var(--font-semibold);
}

.calendar-day.weekend .day-number {
  color: var(--color-weekend);
}

.day-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-0\.5);
  flex-shrink: 0;
}

.day-number {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.day-number.day-today {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  font-weight: var(--font-semibold);
}

.day-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
  line-height: 1.2;
  white-space: nowrap;
}

.tag-work {
  background-color: #e74c3c;
  color: white;
  font-size: 9px;
  padding: 1px 3px;
}

.tag-lunar-festival {
  background-color: var(--color-primary-focus);
  color: var(--color-primary);
  font-size: 9px;
  padding: 1px 3px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex: 1;
  min-height: 0;
}

.lunar-date {
  font-size: 10px;
  color: var(--color-lunar);
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lunar-date.lunar-first {
  color: var(--color-primary);
  font-weight: var(--font-medium);
}

.solar-holiday {
  font-size: 9px;
  color: var(--color-holiday);
  font-weight: var(--font-medium);
  line-height: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-markers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  overflow: hidden;
  margin-top: auto;
}

.event-marker {
  padding: 1px 4px;
  border-radius: var(--radius-sm);
  font-size: 10px;
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
  font-size: 10px;
  color: var(--color-text-secondary);
  padding: 1px 4px;
  font-weight: var(--font-medium);
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .calendar-day {
    padding: var(--spacing-0\.5);
  }
  
  .day-number {
    font-size: var(--text-xs);
    width: 20px;
    height: 20px;
  }
  
  .tag {
    font-size: 9px;
    padding: 0 2px;
  }
  
  .lunar-date {
    font-size: 9px;
  }
  
  .solar-holiday {
    font-size: 8px;
  }
  
  .event-marker {
    font-size: 9px;
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
  
  .day-tags {
    display: none;
  }
  
  .solar-holiday {
    display: none;
  }
}
</style>
