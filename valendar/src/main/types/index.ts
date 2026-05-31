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

export interface CRUDOperation {
  id: string
  source: 'nlu'
  confidence: number
  type: 'create' | 'update' | 'delete'
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
  executed?: boolean
  error?: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'system' | 'assistant'
  type: 'text' | 'thinking' | 'result' | 'error' | 'abandoned' | 'completed'
  content: string
  source: 'voice-online' | 'text' | 'nlu' | 'system'
  timestamp: string
  crudOperations?: CRUDOperation[]
  metadata?: Record<string, any>
}

export interface ConversationSession {
  id: string
  messages: ConversationMessage[]
  crudOperations: CRUDOperation[]
  status: 'listening' | 'processing' | 'waiting-decision' | 'executing' | 'completed' | 'abandoned'
  countdownSeconds: number
  createdAt: string
  updatedAt: string
}
