import { computed } from 'vue'
import dayjs from 'dayjs'
import { isHoliday, isWorkday, getDayDetail } from 'chinese-days'
import { createLogger } from '../utils/logger'

const log = createLogger('useHoliday')

export interface HolidayInfo {
  name: string
  isHoliday: boolean
  isWorkday: boolean
  isWeekend: boolean
  date: string
  detail?: string
}

const solarHolidays: Record<string, string> = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '03-12': '植树节',
  '04-01': '愚人节',
  '05-01': '劳动节',
  '05-04': '青年节',
  '06-01': '儿童节',
  '07-01': '建党节',
  '08-01': '建军节',
  '09-10': '教师节',
  '10-01': '国庆节',
  '10-31': '万圣节',
  '11-11': '双十一',
  '12-24': '平安夜',
  '12-25': '圣诞节'
}

export function useHoliday() {
  function getHolidayInfo(date: dayjs.Dayjs): HolidayInfo | null {
    try {
      const dateStr = date.format('YYYY-MM-DD')
      const dayOfWeek = date.day()
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6

      const dayDetail = getDayDetail(dateStr)

      const monthDay = date.format('MM-DD')
      const solarHoliday = solarHolidays[monthDay]

      const isHolidayDay = isHoliday(dateStr)
      const isWorkdayDay = isWorkday(dateStr)

      let name = ''
      let detail = ''

      if (dayDetail && !dayDetail.work && dayDetail.name) {
        const nameParts = dayDetail.name.split(', ')
        if (nameParts.length > 1) {
          name = nameParts[1]
          detail = nameParts[0]
        } else {
          name = dayDetail.name
        }
      } else if (solarHoliday) {
        name = solarHoliday
      }

      return {
        name: name,
        isHoliday: isHolidayDay,
        isWorkday: isWorkdayDay,
        isWeekend: isWeekendDay,
        date: dateStr,
        detail: detail || undefined
      }
    } catch (error) {
      log.error('Error getting holiday info:', error)
      return null
    }
  }

  function isHolidayDay(date: dayjs.Dayjs): boolean {
    try {
      const dateStr = date.format('YYYY-MM-DD')
      return isHoliday(dateStr)
    } catch {
      return false
    }
  }

  function isWorkdayDay(date: dayjs.Dayjs): boolean {
    try {
      const dateStr = date.format('YYYY-MM-DD')
      return isWorkday(dateStr)
    } catch {
      const day = date.day()
      return day !== 0 && day !== 6
    }
  }

  function isWeekendDay(date: dayjs.Dayjs): boolean {
    const day = date.day()
    return day === 0 || day === 6
  }

  function getSolarHoliday(date: dayjs.Dayjs): string | undefined {
    const monthDay = date.format('MM-DD')
    return solarHolidays[monthDay]
  }

  const currentHolidayInfo = computed(() => getHolidayInfo(dayjs()))

  return {
    getHolidayInfo,
    isHoliday: isHolidayDay,
    isWorkday: isWorkdayDay,
    isWeekend: isWeekendDay,
    getSolarHoliday,
    currentHolidayInfo
  }
}
