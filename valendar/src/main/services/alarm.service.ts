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

  startAllAlarms(): void {
    const alarms = storageService.getAlarms();

    alarms.forEach(alarm => {
      if (!alarm.isDismissed) {
        this.scheduleAlarm(alarm);
      }
    });
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

  snoozeAlarm(alarmId: string, minutes: number): void {
    const alarms = storageService.getAlarms();
    const alarm = alarms.find(a => a.id === alarmId);

    if (!alarm) return;

    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    storageService.updateAlarm(alarmId, {
      isSnoozed: true,
      triggerTime: snoozeTime
    });

    const updatedAlarm = storageService.getAlarms().find(a => a.id === alarmId);
    if (updatedAlarm) {
      this.scheduleAlarm(updatedAlarm);
    }
  }

  dismissAlarm(alarmId: string): void {
    storageService.updateAlarm(alarmId, { isDismissed: true });
    this.cancelAlarm(alarmId);
  }

  cancelAlarm(alarmId: string): void {
    const timer = this.alarms.get(alarmId);
    if (timer) {
      clearTimeout(timer);
      this.alarms.delete(alarmId);
    }
  }

  createAlarmForEvent(eventId: string, triggerTime: string, message: string, sound?: string): Alarm {
    const alarm = storageService.createAlarm({
      eventId,
      triggerTime,
      message,
      sound
    });
    this.scheduleAlarm(alarm);
    return alarm;
  }

  deleteAlarmForEvent(eventId: string): void {
    const alarms = storageService.getAlarms();
    alarms
      .filter(a => a.eventId === eventId)
      .forEach(alarm => {
        this.cancelAlarm(alarm.id);
        storageService.deleteAlarm(alarm.id);
      });
  }

  cleanup(): void {
    this.alarms.forEach(timer => clearTimeout(timer));
    this.alarms.clear();
  }
}

export const alarmService = new AlarmService();
