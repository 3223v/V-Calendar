import { computed } from 'vue';
import dayjs from 'dayjs';
import { useCalendarStore } from '../stores/calendar.store';
import { useEventStore } from '../stores/event.store';
import { useSettingsStore } from '../stores/settings.store';
import { useLunar } from './useLunar';
import { useHoliday } from './useHoliday';
import type { CalendarEvent } from '../types';

export function useCalendar() {
  const calendarStore = useCalendarStore();
  const eventStore = useEventStore();
  const settingsStore = useSettingsStore();
  const { getLunarInfo, getLunarDateString, getSolarTerm, getLunarFestival } = useLunar();
  const { getHolidayInfo, isWorkday, isWeekend, getSolarHoliday } = useHoliday();

  const monthDays = computed(() => calendarStore.getMonthDays());
  const weekDays = computed(() => calendarStore.getWeekDays());

  const weekDayNames = computed(() => {
    const startDay = settingsStore.settings.weekStartDay;
    const names: string[] = ['日', '一', '二', '三', '四', '五', '六'];
    const ordered: string[] = [];
    for (let i = 0; i < 7; i++) {
      ordered.push(names[(startDay + i) % 7]);
    }
    return ordered;
  });

  const formattedCurrentDate = computed(() => {
    return calendarStore.currentDate.format('YYYY年M月');
  });

  const formattedSelectedDate = computed(() => {
    return calendarStore.selectedDate.format('YYYY年M月D日');
  });

  const selectedDate = computed(() => calendarStore.selectedDate);

  function getEventsForDate(date: dayjs.Dayjs): CalendarEvent[] {
    const dateStr = date.format('YYYY-MM-DD');
    return eventStore.getEventsByDate(dateStr);
  }

  function getEventCountForDate(date: dayjs.Dayjs): number {
    return getEventsForDate(date).length;
  }

  function getDateInfo(date: dayjs.Dayjs) {
    const isCurrentMonth = date.month() === calendarStore.currentMonth;
    const isToday = date.isSame(dayjs(), 'day');
    const isSelected = date.isSame(calendarStore.selectedDate, 'day');
    const lunarInfo = getLunarInfo(date);
    const holidayInfo = getHolidayInfo(date);
    const isWorkdayDay = isWorkday(date);
    const isWeekendDay = isWeekend(date);
    const solarTerm = getSolarTerm(date);
    const lunarFestival = getLunarFestival(date);
    const solarHoliday = getSolarHoliday(date);

    return {
      date,
      dateStr: date.format('YYYY-MM-DD'),
      day: date.date(),
      isCurrentMonth,
      isToday,
      isSelected,
      lunarInfo,
      lunarDateString: getLunarDateString(date),
      holidayInfo,
      holidayName: holidayInfo?.name,
      isHoliday: holidayInfo?.isHoliday || false,
      isWorkday: isWorkdayDay,
      isWeekend: isWeekendDay,
      solarTerm,
      lunarFestival,
      solarHoliday,
      events: getEventsForDate(date),
      eventCount: getEventCountForDate(date)
    };
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? '下午' : '上午';
    const hour12 = hour % 12 || 12;
    return `${ampm}${hour12}:${minutes}`;
  }

  return {
    currentDate: computed(() => calendarStore.currentDate),
    selectedDate,
    viewMode: computed(() => calendarStore.viewMode),
    selectedTimeSlot: computed(() => calendarStore.selectedTimeSlot),
    monthDays,
    weekDays,
    weekDayNames,
    formattedCurrentDate,
    formattedSelectedDate,
    getEventsForDate,
    getEventCountForDate,
    getDateInfo,
    formatTime,
    nextMonth: calendarStore.nextMonth,
    prevMonth: calendarStore.prevMonth,
    nextWeek: calendarStore.nextWeek,
    prevWeek: calendarStore.prevWeek,
    nextDay: calendarStore.nextDay,
    prevDay: calendarStore.prevDay,
    goToToday: calendarStore.goToToday,
    goToDate: calendarStore.goToDate,
    selectDate: calendarStore.selectDate,
    selectTimeSlot: calendarStore.selectTimeSlot,
    setViewMode: calendarStore.setViewMode,
    getMonthDays: calendarStore.getMonthDays,
    getWeekDays: calendarStore.getWeekDays
  };
}
