import { v4 as uuidv4 } from 'uuid'
import { join } from 'path'
import { app } from 'electron'
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  statSync
} from 'fs'
import type { CalendarEvent, Settings, Alarm, EventInput, AlarmInput, ConversationSession } from '../types'

interface StoreSchema {
  events: CalendarEvent[]
  settings: Settings
  alarms: Alarm[]
  conversationHistory: ConversationSession[]
}

const defaultSettings: Settings = {
  language: 'zh-CN',
  theme: 'system',
  weekStartDay: 0,
  defaultView: 'month',
  showLunar: true,
  showHoliday: true,
  holidayRegions: ['CN'],
  alarmSound: 'default',
  alarmVolume: 80,
  snoozeMinutes: 5,
  crudCountdown: 10,
  crudAutoExecute: 'best',
  asrOnlineKey: '9b36f0044c8a4d2eb486e3b037749361.3oTwpnahTWQvSp4w',
  aiBaseUrl: 'https://api.deepseek.com',
  aiApiKey: 'sk-1362e0bb054d48c288e6a70cff613c19',
  aiModel: 'deepseek-v4-pro'
}

const BACKUP_DIR = 'backups'
const MAX_BACKUPS = 5

function validateEventInput(input: EventInput): string[] {
  const errors: string[] = []
  if (!input.title || input.title.trim().length === 0) {
    errors.push('事件标题不能为空')
  }
  if (input.title && input.title.length > 200) {
    errors.push('事件标题不能超过200个字符')
  }
  if (!input.startDate) {
    errors.push('开始日期不能为空')
  }
  if (!input.endDate) {
    errors.push('结束日期不能为空')
  }
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    errors.push('开始日期不能晚于结束日期')
  }
  if (input.startTime && !/^\d{2}:\d{2}$/.test(input.startTime)) {
    errors.push('开始时间格式无效，应为 HH:mm')
  }
  if (input.endTime && !/^\d{2}:\d{2}$/.test(input.endTime)) {
    errors.push('结束时间格式无效，应为 HH:mm')
  }
  if (!input.isAllDay && input.startTime && input.endTime) {
    if (input.startDate === input.endDate && input.startTime >= input.endTime) {
      errors.push('结束时间必须晚于开始时间')
    }
  }
  if (input.description && input.description.length > 2000) {
    errors.push('事件描述不能超过2000个字符')
  }
  return errors
}

class StorageService {
  private store: any = null
  private backupPath: string = ''
  private ready = false

  async init(): Promise<void> {
    if (this.ready) return

    const { default: Store } = await import('electron-store')
    this.store = new Store<StoreSchema>({
      name: 'valendar-data',
      defaults: {
        events: [],
        settings: defaultSettings,
        alarms: [],
        conversationHistory: []
      }
    })

    this.backupPath = join(app.getPath('userData'), BACKUP_DIR)
    if (!existsSync(this.backupPath)) {
      mkdirSync(this.backupPath, { recursive: true })
    }

    this.ready = true
    console.log('[StorageService] Initialized. Store path:', this.store.path)
    console.log('[StorageService] Current events count:', this.store.get('events', []).length)
  }

  private assertReady(): void {
    if (!this.ready || !this.store) {
      throw new Error('StorageService not initialized. Call init() first.')
    }
  }

  private createBackup(): void {
    try {
      this.assertReady()
      const data = this.store.store
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = join(this.backupPath, `backup-${timestamp}.json`)
      writeFileSync(backupFile, JSON.stringify(data, null, 2))
      this.cleanupOldBackups()
    } catch (err) {
      console.error('[StorageService] Failed to create backup:', err)
    }
  }

  private cleanupOldBackups(): void {
    try {
      const files = readdirSync(this.backupPath)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse()

      if (files.length > MAX_BACKUPS) {
        files.slice(MAX_BACKUPS).forEach((file) => {
          try {
            unlinkSync(join(this.backupPath, file))
          } catch (err) {
            console.error('[StorageService] Failed to delete old backup:', err)
          }
        })
      }
    } catch (err) {
      console.error('[StorageService] Failed to cleanup backups:', err)
    }
  }

  async restoreFromBackup(backupFile?: string): Promise<boolean> {
    this.assertReady()
    try {
      let targetFile = backupFile
      if (!targetFile) {
        const files = readdirSync(this.backupPath)
          .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
          .sort()
          .reverse()
        if (files.length === 0) return false
        targetFile = join(this.backupPath, files[0])
      }

      const data = JSON.parse(readFileSync(targetFile, 'utf-8'))
      if (data.events && Array.isArray(data.events)) {
        this.store.set('events', data.events)
      }
      if (data.settings) {
        this.store.set('settings', data.settings)
      }
      if (data.alarms && Array.isArray(data.alarms)) {
        this.store.set('alarms', data.alarms)
      }
      return true
    } catch (err) {
      console.error('[StorageService] Failed to restore from backup:', err)
      return false
    }
  }

  async getBackupList(): Promise<Array<{ file: string; date: string; size: number }>> {
    this.assertReady()
    try {
      const files = readdirSync(this.backupPath)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse()

      return files.map((file) => {
        const stat = statSync(join(this.backupPath, file))
        return {
          file,
          date: stat.mtime.toISOString(),
          size: stat.size
        }
      })
    } catch (err) {
      console.error('[StorageService] Failed to get backup list:', err)
      return []
    }
  }

  async getEvents(): Promise<CalendarEvent[]> {
    this.assertReady()
    return this.store.get('events', [])
  }

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    const events = await this.getEvents()
    return events.find((e: CalendarEvent) => e.id === id)
  }

  async createEvent(input: EventInput): Promise<CalendarEvent> {
    console.log('[StorageService] createEvent called:', input.title)

    const errors = validateEventInput(input)
    if (errors.length > 0) {
      console.error('[StorageService] Validation failed:', errors)
      throw new Error(`事件验证失败: ${errors.join(', ')}`)
    }

    this.createBackup()

    const events = await this.getEvents()
    const now = new Date().toISOString()
    const event: CalendarEvent = {
      id: uuidv4(),
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime,
      endTime: input.endTime,
      isAllDay: input.isAllDay,
      isLunar: input.isLunar ?? false,
      repeat: input.repeat,
      alarm: input.alarm,
      category: input.category,
      color: input.color,
      location: input.location,
      createdAt: now,
      updatedAt: now
    }
    events.push(event)
    this.store.set('events', events)

    console.log('[StorageService] Event created:', event.id, 'Total:', events.length)
    return event
  }

  async updateEvent(id: string, input: EventInput): Promise<CalendarEvent | null> {
    this.assertReady()

    const errors = validateEventInput(input)
    if (errors.length > 0) {
      throw new Error(`事件验证失败: ${errors.join(', ')}`)
    }

    const events = await this.getEvents()
    const index = events.findIndex((e: CalendarEvent) => e.id === id)
    if (index === -1) return null

    this.createBackup()

    const event: CalendarEvent = {
      ...events[index],
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime,
      endTime: input.endTime,
      isAllDay: input.isAllDay,
      isLunar: input.isLunar ?? events[index].isLunar,
      repeat: input.repeat,
      alarm: input.alarm,
      category: input.category,
      color: input.color,
      location: input.location,
      updatedAt: new Date().toISOString()
    }
    events[index] = event
    this.store.set('events', events)

    console.log('[StorageService] Event updated:', event.id)
    return event
  }

  async deleteEvent(id: string): Promise<boolean> {
    this.assertReady()
    const events = await this.getEvents()
    const index = events.findIndex((e: CalendarEvent) => e.id === id)
    if (index === -1) return false

    this.createBackup()
    events.splice(index, 1)
    this.store.set('events', events)
    return true
  }

  async deleteEvents(ids: string[]): Promise<number> {
    this.assertReady()
    const events = await this.getEvents()
    const initialLength = events.length
    const idsSet = new Set(ids)
    const filtered = events.filter((e: CalendarEvent) => !idsSet.has(e.id))

    if (filtered.length !== initialLength) {
      this.createBackup()
    }

    this.store.set('events', filtered)
    return initialLength - filtered.length
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const events = await this.getEvents()
    return events.filter((e: CalendarEvent) => e.endDate >= startDate && e.startDate <= endDate)
  }

  async searchEvents(keyword: string): Promise<CalendarEvent[]> {
    const events = await this.getEvents()
    const lowerKeyword = keyword.toLowerCase()
    return events.filter(
      (e: CalendarEvent) =>
        e.title.toLowerCase().includes(lowerKeyword) ||
        (e.description && e.description.toLowerCase().includes(lowerKeyword)) ||
        (e.location && e.location.toLowerCase().includes(lowerKeyword))
    )
  }

  async getEventsByCategory(category: string): Promise<CalendarEvent[]> {
    const events = await this.getEvents()
    return events.filter((e: CalendarEvent) => e.category === category)
  }

  async getEventStats(): Promise<{
    total: number
    byCategory: Record<string, number>
    upcoming: number
    past: number
  }> {
    const events = await this.getEvents()
    const now = new Date().toISOString().split('T')[0]

    const byCategory: Record<string, number> = {}
    let upcoming = 0
    let past = 0

    events.forEach((e: CalendarEvent) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1
      if (e.startDate >= now) {
        upcoming++
      } else {
        past++
      }
    })

    return { total: events.length, byCategory, upcoming, past }
  }

  async getSettings(): Promise<Settings> {
    this.assertReady()
    return this.store.get('settings', defaultSettings)
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const settings = await this.getSettings()
    const newSettings = { ...settings, ...updates }
    this.store.set('settings', newSettings)
    return newSettings
  }

  async getAlarms(): Promise<Alarm[]> {
    this.assertReady()
    return this.store.get('alarms', [])
  }

  async createAlarm(input: AlarmInput): Promise<Alarm> {
    this.assertReady()
    const alarms = await this.getAlarms()
    const alarm: Alarm = {
      id: uuidv4(),
      ...input,
      isSnoozed: false,
      isDismissed: false
    }
    alarms.push(alarm)
    this.store.set('alarms', alarms)
    return alarm
  }

  async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm | null> {
    this.assertReady()
    const alarms = await this.getAlarms()
    const index = alarms.findIndex((a: Alarm) => a.id === id)
    if (index === -1) return null

    alarms[index] = { ...alarms[index], ...updates }
    this.store.set('alarms', alarms)
    return alarms[index]
  }

  async deleteAlarm(id: string): Promise<boolean> {
    this.assertReady()
    const alarms = await this.getAlarms()
    const index = alarms.findIndex((a: Alarm) => a.id === id)
    if (index === -1) return false

    alarms.splice(index, 1)
    this.store.set('alarms', alarms)
    return true
  }

  async clearDismissedAlarms(): Promise<void> {
    this.assertReady()
    const alarms = (await this.getAlarms()).filter((a: Alarm) => !a.isDismissed)
    this.store.set('alarms', alarms)
  }

  async exportData(): Promise<string> {
    return JSON.stringify(
      {
        events: await this.getEvents(),
        settings: await this.getSettings(),
        alarms: await this.getAlarms(),
        metadata: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          recordCount: (await this.getEvents()).length
        }
      },
      null,
      2
    )
  }

  async importData(
    jsonString: string
  ): Promise<{ imported: number; errors: Array<{ index: number; error: string }> }> {
    this.assertReady()
    try {
      const data = JSON.parse(jsonString)
      let imported = 0
      const errors: Array<{ index: number; error: string }> = []

      if (data.events && Array.isArray(data.events)) {
        this.createBackup()

        const existingEvents = await this.getEvents()
        const existingIds = new Set(existingEvents.map((e: CalendarEvent) => e.id))

        data.events.forEach((event: CalendarEvent, index: number) => {
          try {
            if (existingIds.has(event.id)) {
              errors.push({ index, error: `事件ID ${event.id} 已存在，跳过` })
              return
            }

            const newEvent: CalendarEvent = {
              id: uuidv4(),
              title: event.title || '未命名事件',
              description: event.description,
              startDate: event.startDate,
              endDate: event.endDate,
              startTime: event.startTime,
              endTime: event.endTime,
              isAllDay: event.isAllDay ?? true,
              isLunar: event.isLunar ?? false,
              repeat: event.repeat,
              alarm: event.alarm,
              category: event.category ?? 'personal',
              color: event.color,
              location: event.location,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            existingEvents.push(newEvent)
            imported++
          } catch (err) {
            errors.push({ index, error: String(err) })
          }
        })
        this.store.set('events', existingEvents)
      }

      if (data.settings) {
        await this.updateSettings(data.settings)
      }

      if (data.alarms && Array.isArray(data.alarms)) {
        const existingAlarms = await this.getAlarms()
        data.alarms.forEach((alarm: Alarm) => {
          existingAlarms.push({ ...alarm, id: uuidv4() })
        })
        this.store.set('alarms', existingAlarms)
      }

      return { imported, errors }
    } catch (err) {
      throw new Error(`导入失败: ${err}`)
    }
  }

  async clearAllData(): Promise<void> {
    this.assertReady()
    this.createBackup()
    this.store.set('events', [])
    this.store.set('alarms', [])
    this.store.set('settings', defaultSettings)
    this.store.set('conversationHistory', [])
  }

  // --- Conversation History Methods ---

  async getConversationHistory(): Promise<ConversationSession[]> {
    this.assertReady()
    return this.store.get('conversationHistory', [])
  }

  async saveConversationSession(session: ConversationSession): Promise<ConversationSession> {
    this.assertReady()
    const history = await this.getConversationHistory()
    const existingIndex = history.findIndex((s) => s.id === session.id)
    
    if (existingIndex !== -1) {
      history[existingIndex] = { ...session, updatedAt: new Date().toISOString() }
    } else {
      history.push({ ...session, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    
    this.store.set('conversationHistory', history)
    return session
  }

  async updateConversationSession(id: string, updates: Partial<ConversationSession>): Promise<ConversationSession | null> {
    this.assertReady()
    const history = await this.getConversationHistory()
    const index = history.findIndex((s) => s.id === id)
    if (index === -1) return null
    
    history[index] = { ...history[index], ...updates, updatedAt: new Date().toISOString() }
    this.store.set('conversationHistory', history)
    return history[index]
  }

  async deleteConversationSession(id: string): Promise<boolean> {
    this.assertReady()
    const history = await this.getConversationHistory()
    const filtered = history.filter((s) => s.id !== id)
    if (filtered.length === history.length) return false
    this.store.set('conversationHistory', filtered)
    return true
  }

  async clearConversationHistory(): Promise<void> {
    this.assertReady()
    this.store.set('conversationHistory', [])
  }
}

export const storageService = new StorageService()
