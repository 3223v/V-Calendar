import { computed } from 'vue';
import dayjs from 'dayjs';

export interface LunarInfo {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  zodiac: string;
  solarTerm?: string;
  isHoliday?: boolean;
  holidayName?: string;
}

const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

export function useLunar() {
  function getLunarInfo(date: dayjs.Dayjs): LunarInfo | null {
    return {
      lunarYear: date.year(),
      lunarMonth: date.month() + 1,
      lunarDay: date.date(),
      zodiac: zodiacAnimals[(date.year() - 4) % 12]
    };
  }

  function getLunarDateString(date: dayjs.Dayjs): string {
    const info = getLunarInfo(date);
    if (!info) return '';

    const monthStr = info.lunarMonth < 10 ? `0${info.lunarMonth}` : `${info.lunarMonth}`;
    const dayStr = info.lunarDay < 10 ? `0${info.lunarDay}` : `${info.lunarDay}`;

    return `${monthStr}-${dayStr}`;
  }

  function isSolarTerm(_date: dayjs.Dayjs): boolean {
    return false;
  }

  const currentLunarInfo = computed(() => getLunarInfo(dayjs()));

  return {
    getLunarInfo,
    getLunarDateString,
    isSolarTerm,
    currentLunarInfo
  };
}
