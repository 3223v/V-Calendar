export type EventCategory = 'work' | 'personal' | 'holiday' | 'important' | 'custom'

export interface RepeatRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  endDate?: string
  count?: number
  weekdays?: number[]
  monthDay?: number
}

export interface AlarmRule {
  id: string
  before: number
  isEnabled: boolean
  sound?: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
  isLunar: boolean
  repeat?: RepeatRule
  alarm?: AlarmRule
  category: EventCategory
  color?: string
  location?: string
  createdAt: string
  updatedAt: string
}

export interface EventInput {
  title: string
  description?: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
  isLunar?: boolean
  repeat?: RepeatRule
  alarm?: AlarmRule
  category: EventCategory
  color?: string
  location?: string
}

export interface EventQueryParams {
  startDate?: string
  endDate?: string
  category?: EventCategory
  keyword?: string
}

export interface Alarm {
  id: string
  eventId: string
  triggerTime: string
  message: string
  isSnoozed: boolean
  isDismissed: boolean
  sound?: string
}

export interface AlarmInput {
  eventId: string
  triggerTime: string
  message: string
  sound?: string
}

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'
export type DefaultView = 'month' | 'week' | 'day'
export type ViewMode = 'month' | 'week' | 'day'

export interface Settings {
  language: Language
  theme: Theme
  weekStartDay: 0 | 1
  defaultView: DefaultView
  showLunar: boolean
  showHoliday: boolean
  holidayRegions: string[]
  alarmSound: string
  alarmVolume: number
  snoozeMinutes: number
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
  crudCountdown?: number
  crudAutoExecute?: string
  asrOnlineKey?: string
  aiSupportsImage?: boolean
}
