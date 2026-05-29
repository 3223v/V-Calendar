import { ipcMain } from 'electron';
import { storageService } from '../services/storage.service';
import { alarmService } from '../services/alarm.service';
import type { EventInput, EventQueryParams } from '../types';

export function registerEventHandlers(): void {
  ipcMain.handle('event:getAll', async (_, params?: EventQueryParams) => {
    try {
      let events = await storageService.getEvents();

      if (params) {
        if (params.startDate) {
          events = events.filter(e => e.startDate >= params.startDate!);
        }
        if (params.endDate) {
          events = events.filter(e => e.endDate <= params.endDate!);
        }
        if (params.category) {
          events = events.filter(e => e.category === params.category);
        }
        if (params.keyword) {
          const keyword = params.keyword.toLowerCase();
          events = events.filter(e =>
            e.title.toLowerCase().includes(keyword) ||
            e.description?.toLowerCase().includes(keyword)
          );
        }
      }

      return events;
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  });

  ipcMain.handle('event:get', async (_, id: string) => {
    try {
      return await storageService.getEvent(id) || null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  });

  ipcMain.handle('event:create', async (_, input: EventInput) => {
    try {
      const event = await storageService.createEvent(input);

      if (event.alarm?.isEnabled && event.alarm.before > 0) {
        const eventDateTime = event.startTime
          ? new Date(`${event.startDate}T${event.startTime}`)
          : new Date(`${event.startDate}T00:00`);

        if (eventDateTime > new Date()) {
          const triggerTime = new Date(eventDateTime.getTime() - event.alarm.before * 60 * 1000);
          alarmService.createAlarmForEvent(
            event.id,
            triggerTime.toISOString(),
            event.title,
            event.alarm.sound
          );
        }
      }

      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  });

  ipcMain.handle('event:update', async (_, id: string, input: EventInput) => {
    try {
      const event = await storageService.updateEvent(id, input);

      if (event) {
        alarmService.deleteAlarmForEvent(id);

        if (event.alarm?.isEnabled && event.alarm.before > 0) {
          const eventDateTime = event.startTime
            ? new Date(`${event.startDate}T${event.startTime}`)
            : new Date(`${event.startDate}T00:00`);

          if (eventDateTime > new Date()) {
            const triggerTime = new Date(eventDateTime.getTime() - event.alarm.before * 60 * 1000);
            alarmService.createAlarmForEvent(
              event.id,
              triggerTime.toISOString(),
              event.title,
              event.alarm.sound
            );
          }
        }
      }

      return event;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  });

  ipcMain.handle('event:delete', async (_, id: string) => {
    try {
      alarmService.deleteAlarmForEvent(id);
      return await storageService.deleteEvent(id);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  });

  ipcMain.handle('event:deleteMany', async (_, ids: string[]) => {
    try {
      ids.forEach(id => alarmService.deleteAlarmForEvent(id));
      return await storageService.deleteEvents(ids);
    } catch (error) {
      console.error('Error deleting events:', error);
      throw error;
    }
  });

  ipcMain.handle('event:search', async (_, keyword: string) => {
    try {
      return await storageService.searchEvents(keyword);
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  });

  ipcMain.handle('event:getByDateRange', async (_, startDate: string, endDate: string) => {
    try {
      return await storageService.getEventsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error getting events by date range:', error);
      throw error;
    }
  });

  ipcMain.handle('event:getByCategory', async (_, category: string) => {
    try {
      return await storageService.getEventsByCategory(category);
    } catch (error) {
      console.error('Error getting events by category:', error);
      throw error;
    }
  });

  ipcMain.handle('event:getStats', async () => {
    try {
      return await storageService.getEventStats();
    } catch (error) {
      console.error('Error getting event stats:', error);
      throw error;
    }
  });

  ipcMain.handle('event:getBackups', async () => {
    try {
      return await storageService.getBackupList();
    } catch (error) {
      console.error('Error getting backups:', error);
      throw error;
    }
  });

  ipcMain.handle('event:restoreBackup', async (_, backupFile?: string) => {
    try {
      return await storageService.restoreFromBackup(backupFile);
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  });
}
