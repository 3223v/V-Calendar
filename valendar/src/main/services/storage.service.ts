import { v4 as uuidv4 } from 'uuid';
import type { CalendarEvent, Settings, Alarm, EventInput, AlarmInput } from '../types';

interface StoreSchema {
  events: CalendarEvent[];
  settings: Settings;
  alarms: Alarm[];
}

const defaultSettings: Settings = {
  language: 'zh-CN',
  theme: 'system',
  weekStartDay: 1,
  defaultView: 'month',
  showLunar: true,
  showHoliday: true,
  holidayRegions: ['CN'],
  alarmSound: 'default',
  alarmVolume: 80,
  snoozeMinutes: 5,
  aiEnabled: false
};

class StorageService {
  private store: any;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const Store = (await import('electron-store')).default;
    this.store = new Store<StoreSchema>({
      name: 'valendar-data',
      defaults: {
        events: [],
        settings: defaultSettings,
        alarms: []
      }
    });
    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  async getEvents(): Promise<CalendarEvent[]> {
    await this.ensureInitialized();
    return this.store.get('events', []);
  }

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    await this.ensureInitialized();
    const events = await this.getEvents();
    return events.find(e => e.id === id);
  }

  async createEvent(input: EventInput): Promise<CalendarEvent> {
    await this.ensureInitialized();
    const events = await this.getEvents();
    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id: uuidv4(),
      ...input,
      isLunar: input.isLunar ?? false,
      createdAt: now,
      updatedAt: now
    };
    events.push(event);
    this.store.set('events', events);
    return event;
  }

  async updateEvent(id: string, input: EventInput): Promise<CalendarEvent | null> {
    await this.ensureInitialized();
    const events = await this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;

    const event: CalendarEvent = {
      ...events[index],
      ...input,
      isLunar: input.isLunar ?? events[index].isLunar,
      updatedAt: new Date().toISOString()
    };
    events[index] = event;
    this.store.set('events', events);
    return event;
  }

  async deleteEvent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const events = await this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return false;

    events.splice(index, 1);
    this.store.set('events', events);
    return true;
  }

  async deleteEvents(ids: string[]): Promise<number> {
    await this.ensureInitialized();
    const events = await this.getEvents();
    const initialLength = events.length;
    const idsSet = new Set(ids);
    const filtered = events.filter(e => !idsSet.has(e.id));
    this.store.set('events', filtered);
    return initialLength - filtered.length;
  }

  async getSettings(): Promise<Settings> {
    await this.ensureInitialized();
    return this.store.get('settings', defaultSettings);
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    await this.ensureInitialized();
    const settings = await this.getSettings();
    const newSettings = { ...settings, ...updates };
    this.store.set('settings', newSettings);
    return newSettings;
  }

  async getAlarms(): Promise<Alarm[]> {
    await this.ensureInitialized();
    return this.store.get('alarms', []);
  }

  async createAlarm(input: AlarmInput): Promise<Alarm> {
    await this.ensureInitialized();
    const alarms = await this.getAlarms();
    const alarm: Alarm = {
      id: uuidv4(),
      ...input,
      isSnoozed: false,
      isDismissed: false
    };
    alarms.push(alarm);
    this.store.set('alarms', alarms);
    return alarm;
  }

  async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm | null> {
    await this.ensureInitialized();
    const alarms = await this.getAlarms();
    const index = alarms.findIndex(a => a.id === id);
    if (index === -1) return null;

    alarms[index] = { ...alarms[index], ...updates };
    this.store.set('alarms', alarms);
    return alarms[index];
  }

  async deleteAlarm(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const alarms = await this.getAlarms();
    const index = alarms.findIndex(a => a.id === id);
    if (index === -1) return false;

    alarms.splice(index, 1);
    this.store.set('alarms', alarms);
    return true;
  }

  async clearDismissedAlarms(): Promise<void> {
    await this.ensureInitialized();
    const alarms = (await this.getAlarms()).filter(a => !a.isDismissed);
    this.store.set('alarms', alarms);
  }

  async exportData(): Promise<string> {
    await this.ensureInitialized();
    return JSON.stringify({
      events: await this.getEvents(),
      settings: await this.getSettings(),
      alarms: await this.getAlarms(),
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString()
      }
    }, null, 2);
  }

  async importData(jsonString: string): Promise<{ imported: number; errors: Array<{ index: number; error: string }> }> {
    await this.ensureInitialized();
    try {
      const data = JSON.parse(jsonString);
      let imported = 0;
      const errors: Array<{ index: number; error: string }> = [];

      if (data.events && Array.isArray(data.events)) {
        const existingEvents = await this.getEvents();
        data.events.forEach((event: CalendarEvent, index: number) => {
          try {
            const newEvent: CalendarEvent = {
              id: uuidv4(),
              title: event.title,
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
            };
            existingEvents.push(newEvent);
            imported++;
          } catch (err) {
            errors.push({ index, error: String(err) });
          }
        });
        this.store.set('events', existingEvents);
      }

      if (data.settings) {
        await this.updateSettings(data.settings);
      }

      return { imported, errors };
    } catch (err) {
      throw new Error(`Import failed: ${err}`);
    }
  }
}

export const storageService = new StorageService();
