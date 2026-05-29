import { computed } from 'vue';
import dayjs from 'dayjs';

export interface HolidayInfo {
  name: string;
  isHoliday: boolean;
  date: string;
}

export function useHoliday() {
  function isHoliday(date: dayjs.Dayjs): boolean {
    const day = date.day();
    return day === 0 || day === 6;
  }

  function isWeekend(date: dayjs.Dayjs): boolean {
    const day = date.day();
    return day === 0 || day === 6;
  }

  const currentHolidayInfo = computed(() => null);

  return {
    isHoliday,
    isWeekend,
    currentHolidayInfo
  };
}
