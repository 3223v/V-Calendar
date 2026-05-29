import type { CalendarEvent, EventInput, EventQueryParams, Alarm, AlarmInput, Settings } from '../../main/types';

export interface EventAPI {
  getAll: (params?: EventQueryParams) => Promise<CalendarEvent[]>;
  get: (id: string) => Promise<CalendarEvent | null>;
  create: (input: EventInput) => Promise<CalendarEvent>;
  update: (id: string, input: EventInput) => Promise<CalendarEvent | null>;
  delete: (id: string) => Promise<boolean>;
  deleteMany: (ids: string[]) => Promise<number>;
  search: (keyword: string) => Promise<CalendarEvent[]>;
  getByDateRange: (startDate: string, endDate: string) => Promise<CalendarEvent[]>;
  getByCategory: (category: string) => Promise<CalendarEvent[]>;
  getStats: () => Promise<{
    total: number;
    byCategory: Record<string, number>;
    upcoming: number;
    past: number;
  }>;
  getBackups: () => Promise<Array<{ file: string; date: string; size: number }>>;
  restoreBackup: (backupFile?: string) => Promise<boolean>;
}

export interface AlarmAPI {
  getAll: () => Promise<Alarm[]>;
  create: (input: AlarmInput) => Promise<Alarm>;
  snooze: (id: string, minutes?: number) => Promise<boolean>;
  dismiss: (id: string) => Promise<boolean>;
  delete: (id: string) => Promise<boolean>;
  onTriggered: (callback: (alarm: Alarm) => void) => void;
}

export interface SettingsAPI {
  get: () => Promise<Settings>;
  update: (settings: Partial<Settings>) => Promise<Settings>;
}

export interface DataAPI {
  export: (format: 'json' | 'csv') => Promise<{ success: boolean; recordCount?: number; error?: string }>;
  import: (format: 'json' | 'csv') => Promise<{ success: boolean; imported: number; skipped: number; errors: any[] }>;
}

export interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    invoke: <T>(channel: string, ...args: any[]) => Promise<T>;
  };
}

export interface API {
  event: EventAPI;
  alarm: AlarmAPI;
  settings: SettingsAPI;
  data: DataAPI;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: API;
  }
}
