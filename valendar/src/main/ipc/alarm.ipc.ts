import { ipcMain } from 'electron';
import { alarmService } from '../services/alarm.service';
import { storageService } from '../services/storage.service';
import type { AlarmInput } from '../types';

export function registerAlarmHandlers(): void {
  ipcMain.handle('alarm:getAll', async () => {
    try {
      return await storageService.getAlarms();
    } catch (error) {
      console.error('Error getting alarms:', error);
      throw error;
    }
  });

  ipcMain.handle('alarm:create', async (_, input: AlarmInput) => {
    try {
      return alarmService.createAlarmForEvent(
        input.eventId,
        input.triggerTime,
        input.message,
        input.sound
      );
    } catch (error) {
      console.error('Error creating alarm:', error);
      throw error;
    }
  });

  ipcMain.handle('alarm:snooze', async (_, id: string, minutes?: number) => {
    try {
      const settings = await storageService.getSettings();
      const snoozeMinutes = minutes ?? settings.snoozeMinutes;
      await alarmService.snoozeAlarm(id, snoozeMinutes);
      return true;
    } catch (error) {
      console.error('Error snoozing alarm:', error);
      throw error;
    }
  });

  ipcMain.handle('alarm:dismiss', async (_, id: string) => {
    try {
      await alarmService.dismissAlarm(id);
      return true;
    } catch (error) {
      console.error('Error dismissing alarm:', error);
      throw error;
    }
  });

  ipcMain.handle('alarm:delete', async (_, id: string) => {
    try {
      alarmService.cancelAlarm(id);
      return await storageService.deleteAlarm(id);
    } catch (error) {
      console.error('Error deleting alarm:', error);
      throw error;
    }
  });
}
