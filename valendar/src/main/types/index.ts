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

export interface NotificationOptions {
  title: string
  body: string
  sound?: string
}

export interface ExportResult {
  success: boolean
  data?: string
  error?: string
  recordCount: number
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ index: number; error: string }>
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'system'
  content: string
  source: 'voice-online' | 'text'
  timestamp: string
  images?: string[]
  status?: 'thinking' | 'executed' | 'abandoned' | 'error' | 'created' | 'rolled-back'
  opIds?: string[]
  executedEventId?: string
}

export interface ConversationCRUDOperation {
  id: string
  source: 'nlu'
  confidence: number
  type: 'create' | 'update' | 'delete' | 'query'
  status: 'pending' | 'executing' | 'executed' | 'abandoned' | 'error' | 'rolled-back'
  executedEventId?: string
  event: {
    title: string
    description?: string
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
    isAllDay: boolean
    category: string
    location?: string
  }
}

export interface ConversationHistoryEntry {
  id: string
  messages: ConversationMessage[]
  crudOperations: ConversationCRUDOperation[]
  status: 'completed' | 'abandoned'
  createdAt: string
  completedAt: string
}
