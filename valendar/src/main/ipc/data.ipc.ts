import { ipcMain, dialog } from 'electron';
import { storageService } from '../services/storage.service';
import { writeFileSync, readFileSync } from 'fs';

export function registerDataHandlers(): void {
  ipcMain.handle('data:export', async (_, format: 'json' | 'csv') => {
    try {
      const result = await dialog.showSaveDialog({
        title: '导出数据',
        defaultPath: `valendar-export-${Date.now()}.${format}`,
        filters: [
          { name: format.toUpperCase(), extensions: [format] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      const data = await storageService.exportData();

      if (format === 'json') {
        writeFileSync(result.filePath, data, 'utf-8');
      } else {
        const events = await storageService.getEvents();
        const csv = convertToCSV(events);
        writeFileSync(result.filePath, csv, 'utf-8');
      }

      const allEvents = await storageService.getEvents();
      return {
        success: true,
        recordCount: allEvents.length
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        error: String(error),
        recordCount: 0
      };
    }
  });

  ipcMain.handle('data:import', async (_, format: 'json' | 'csv') => {
    try {
      const result = await dialog.showOpenDialog({
        title: '导入数据',
        filters: [
          { name: format.toUpperCase(), extensions: [format] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, imported: 0, skipped: 0, errors: [] };
      }

      const filePath = result.filePaths[0];
      const content = readFileSync(filePath, 'utf-8');

      if (format === 'json') {
        const importResult = await storageService.importData(content);
        return {
          success: true,
          ...importResult
        };
      } else {
        const events = parseCSV(content);
        let imported = 0;
        const errors: Array<{ index: number; error: string }> = [];

        for (let i = 0; i < events.length; i++) {
          try {
            await storageService.createEvent(events[i]);
            imported++;
          } catch (err) {
            errors.push({ index: i, error: String(err) });
          }
        }

        return {
          success: true,
          imported,
          skipped: events.length - imported,
          errors
        };
      }
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ index: -1, error: String(error) }]
      };
    }
  });
}

function convertToCSV(events: any[]): string {
  const headers = ['title', 'description', 'startDate', 'endDate', 'startTime', 'endTime', 'isAllDay', 'category', 'location'];
  const rows = events.map(event =>
    headers.map(header => {
      const value = event[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function parseCSV(content: string): any[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const events: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map(v => {
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        return v.slice(1, -1).replace(/""/g, '"');
      }
      return v;
    });

    const event: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (header === 'isAllDay') {
        event[header] = value === 'true';
      } else if (header === 'startDate' || header === 'endDate') {
        event[header] = value;
      } else if (value) {
        event[header] = value;
      }
    });

    if (event.title && event.startDate) {
      event.category = event.category || 'personal';
      event.isAllDay = event.isAllDay ?? true;
      events.push(event);
    }
  }

  return events;
}
