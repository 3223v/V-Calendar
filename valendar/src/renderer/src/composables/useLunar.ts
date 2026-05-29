import { computed } from 'vue';
import dayjs from 'dayjs';
import { getLunarDate, getSolarTerms, getLunarFestivals } from 'chinese-days';

export interface LunarInfo {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarMonCN: string;
  lunarDayCN: string;
  zodiac: string;
  solarTerm?: string;
  lunarFestival?: string;
}

export function useLunar() {
  function getLunarInfo(date: dayjs.Dayjs): LunarInfo | null {
    try {
      const dateStr = date.format('YYYY-MM-DD');
      const lunarDate = getLunarDate(dateStr);

      if (!lunarDate) return null;

      // 获取节气
      const solarTerms = getSolarTerms(dateStr, dateStr);
      const solarTerm = solarTerms && solarTerms.length > 0 ? solarTerms[0].name : undefined;

      // 获取农历节日
      const lunarFestivals = getLunarFestivals(dateStr);
      const lunarFestival = lunarFestivals && lunarFestivals.length > 0 && lunarFestivals[0].name.length > 0 
        ? lunarFestivals[0].name[0] 
        : undefined;

      return {
        lunarYear: lunarDate.lunarYear,
        lunarMonth: lunarDate.lunarMon,
        lunarDay: lunarDate.lunarDay,
        lunarMonCN: lunarDate.lunarMonCN,
        lunarDayCN: lunarDate.lunarDayCN,
        zodiac: lunarDate.zodiac,
        solarTerm: solarTerm,
        lunarFestival: lunarFestival
      };
    } catch (error) {
      console.error('Error getting lunar info:', error);
      return null;
    }
  }

  function getLunarDateString(date: dayjs.Dayjs): string {
    const info = getLunarInfo(date);
    if (!info) return '';

    // 如果是初一，显示月份
    if (info.lunarDay === 1) {
      return info.lunarMonCN;
    }

    return info.lunarDayCN;
  }

  function getSolarTerm(date: dayjs.Dayjs): string | undefined {
    const info = getLunarInfo(date);
    return info?.solarTerm;
  }

  function getLunarFestival(date: dayjs.Dayjs): string | undefined {
    const info = getLunarInfo(date);
    return info?.lunarFestival;
  }

  const currentLunarInfo = computed(() => getLunarInfo(dayjs()));

  return {
    getLunarInfo,
    getLunarDateString,
    getSolarTerm,
    getLunarFestival,
    currentLunarInfo
  };
}
