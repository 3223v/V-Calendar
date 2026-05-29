import Store from 'electron-store';
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
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'valendar-data',
      defaults: {
        events: [],
        settings: defaultSettings,
        alarms: []
      }
    });
  }

  getEvents(): CalendarEvent[] {
    return this.store.get('events', []);
  }

  getEvent(id: string): CalendarEvent | undefined {
    const events = this.getEvents();
    return events.find(e => e.id === id);
  }

  createEvent(input: EventInput): CalendarEvent {
    const events = this.getEvents();
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

  updateEvent(id: string, input: EventInput): CalendarEvent | null {
    const events = this.getEvents();
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

  deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return false;

    events.splice(index, 1);
    this.store.set('events', events);
    return true;
  }

  deleteEvents(ids: string[]): number {
    const events = this.getEvents();
    const initialLength = events.length;
    const idsSet = new Set(ids);
    const filtered = events.filter(e => !idsSet.has(e.id));
    this.store.set('events', filtered);
    return initialLength - filtered.length;
  }

  getSettings(): Settings {
    return this.store.get('settings', defaultSettings);
  }

  updateSettings(updates: Partial<Settings>): Settings {
    const settings = this.getSettings();
    const newSettings = { ...settings, ...updates };
    this.store.set('settings', newSettings);
    return newSettings;
  }

  getAlarms(): Alarm[] {
    return this.store.get('alarms', []);
  }

  createAlarm(input: AlarmInput): Alarm {
    const alarms = this.getAlarms();
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

  updateAlarm(id: string, updates: Partial<Alarm>): Alarm | null {
    const alarms = this.getAlarms();
    const index = alarms.findIndex(a => a.id === id);
    if (index === -1) return null;

    alarms[index] = { ...alarms[index], ...updates };
    this.store.set('alarms', alarms);
    return alarms[index];
  }

  deleteAlarm(id: string): boolean {
    const alarms = this.getAlarms();
    const index = alarms.findIndex(a => a.id === id);
    if (index === -1) return false;

    alarms.splice(index, 1);
    this.store.set('alarms', alarms);
    return true;
  }

  clearDismissedAlarms(): void {
    const alarms = this.getAlarms().filter(a => !a.isDismissed);
    this.store.set('alarms', alarms);
  }

  exportData(): string {
    return JSON.stringify({
      events: this.getEvents(),
      settings: this.getSettings(),
      alarms: this.getAlarms(),
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString()
      }
    }, null, 2);
  }

  importData(jsonString: string): { imported: number; errors: Array<{ index: number; error: string }> } {
    try {
      const data = JSON.parse(jsonString);
      let imported = 0;
      const errors: Array<{ index: number; error: string }> = [];

      if (data.events && Array.isArray(data.events)) {
        const existingEvents = this.getEvents();
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
        this.updateSettings(data.settings);
      }

      return { imported, errors };
    } catch (err) {
      throw new Error(`Import failed: ${err}`);
    }
  }
}

export const storageService = new StorageService();
