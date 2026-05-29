import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import type { ViewMode } from '../types';

export const useCalendarStore = defineStore('calendar', () => {
  const currentDate = ref(dayjs());
  const selectedDate = ref(dayjs());
  const viewMode = ref<ViewMode>('month');

  const currentYear = computed(() => currentDate.value.year());
  const currentMonth = computed(() => currentDate.value.month());
  const currentDay = computed(() => currentDate.value.date());

  const selectedYear = computed(() => selectedDate.value.year());
  const selectedMonth = computed(() => selectedDate.value.month());
  const selectedDay = computed(() => selectedDate.value.date());

  function nextMonth(): void {
    currentDate.value = currentDate.value.add(1, 'month');
  }

  function prevMonth(): void {
    currentDate.value = currentDate.value.subtract(1, 'month');
  }

  function nextWeek(): void {
    currentDate.value = currentDate.value.add(1, 'week');
  }

  function prevWeek(): void {
    currentDate.value = currentDate.value.subtract(1, 'week');
  }

  function nextDay(): void {
    currentDate.value = currentDate.value.add(1, 'day');
  }

  function prevDay(): void {
    currentDate.value = currentDate.value.subtract(1, 'day');
  }

  function goToToday(): void {
    currentDate.value = dayjs();
    selectedDate.value = dayjs();
  }

  function goToDate(date: string | Date | dayjs.Dayjs): void {
    const d = dayjs(date);
    currentDate.value = d;
    selectedDate.value = d;
  }

  function selectDate(date: string | Date | dayjs.Dayjs): void {
    selectedDate.value = dayjs(date);
  }

  function setViewMode(mode: ViewMode): void {
    viewMode.value = mode;
  }

  function getMonthDays(): dayjs.Dayjs[] {
    const startOfMonth = currentDate.value.startOf('month');
    const endOfMonth = currentDate.value.endOf('month');
    const startDay = startOfMonth.day();
    const days: dayjs.Dayjs[] = [];

    for (let i = startDay - 1; i >= 0; i--) {
      days.push(startOfMonth.subtract(i + 1, 'day'));
    }

    let day = startOfMonth;
    while (day.isBefore(endOfMonth) || day.isSame(endOfMonth, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(endOfMonth.add(i, 'day'));
    }

    return days;
  }

  function getWeekDays(): dayjs.Dayjs[] {
    const startOfWeek = currentDate.value.startOf('week');
    const days: dayjs.Dayjs[] = [];

    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }

    return days;
  }

  return {
    currentDate,
    selectedDate,
    viewMode,
    currentYear,
    currentMonth,
    currentDay,
    selectedYear,
    selectedMonth,
    selectedDay,
    nextMonth,
    prevMonth,
    nextWeek,
    prevWeek,
    nextDay,
    prevDay,
    goToToday,
    goToDate,
    selectDate,
    setViewMode,
    getMonthDays,
    getWeekDays
  };
});
