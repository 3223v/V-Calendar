import { BrowserWindow } from 'electron';
import type { Alarm } from '../types';
import { storageService } from './storage.service';
import { notificationService } from './notification.service';

class AlarmService {
  private alarms: Map<string, NodeJS.Timeout> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async startAllAlarms(): Promise<void> {
    const alarms = await storageService.getAlarms();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    for (const alarm of alarms) {
      if (alarm.isDismissed) continue;

      const triggerTime = new Date(alarm.triggerTime).getTime();
      if (triggerTime < now - oneDay) {
        await storageService.deleteAlarm(alarm.id);
        continue;
      }

      this.scheduleAlarm(alarm);
    }
  }

  scheduleAlarm(alarm: Alarm): void {
    const triggerTime = new Date(alarm.triggerTime).getTime();
    const delay = triggerTime - Date.now();

    if (delay <= 0) {
      this.triggerAlarm(alarm);
      return;
    }

    if (this.alarms.has(alarm.id)) {
      this.cancelAlarm(alarm.id);
    }

    const timer = setTimeout(() => {
      this.triggerAlarm(alarm);
      this.alarms.delete(alarm.id);
    }, delay);

    this.alarms.set(alarm.id, timer);
  }

  private triggerAlarm(alarm: Alarm): void {
    notificationService.showAlarm(alarm.message, alarm.triggerTime);

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('alarm-triggered', alarm);
    }
  }

  async snoozeAlarm(alarmId: string, minutes: number): Promise<void> {
    const alarms = await storageService.getAlarms();
    const alarm = alarms.find(a => a.id === alarmId);

    if (!alarm) return;

    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    await storageService.updateAlarm(alarmId, {
      isSnoozed: true,
      triggerTime: snoozeTime
    });

    const updatedAlarms = await storageService.getAlarms();
    const updatedAlarm = updatedAlarms.find(a => a.id === alarmId);
    if (updatedAlarm) {
      this.scheduleAlarm(updatedAlarm);
    }
  }

  async dismissAlarm(alarmId: string): Promise<void> {
    await storageService.updateAlarm(alarmId, { isDismissed: true });
    this.cancelAlarm(alarmId);
  }

  cancelAlarm(alarmId: string): void {
    const timer = this.alarms.get(alarmId);
    if (timer) {
      clearTimeout(timer);
      this.alarms.delete(alarmId);
    }
  }

  async createAlarmForEvent(eventId: string, triggerTime: string, message: string, sound?: string): Promise<Alarm> {
    const alarm = await storageService.createAlarm({
      eventId,
      triggerTime,
      message,
      sound
    });
    this.scheduleAlarm(alarm);
    return alarm;
  }

  async deleteAlarmForEvent(eventId: string): Promise<void> {
    const alarms = await storageService.getAlarms();
    const eventAlarms = alarms.filter(a => a.eventId === eventId);

    for (const alarm of eventAlarms) {
      this.cancelAlarm(alarm.id);
      await storageService.deleteAlarm(alarm.id);
    }
  }

  cleanup(): void {
    this.alarms.forEach(timer => clearTimeout(timer));
    this.alarms.clear();
  }
}

export const alarmService = new AlarmService();
