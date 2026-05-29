import type { Alarm, AlarmInput } from '../../main/types';
import type { AlarmAPI } from '../types';

export const alarmAPI: AlarmAPI = {
  getAll: () => {
    return window.electron.ipcRenderer.invoke('alarm:getAll');
  },
  create: (input: AlarmInput) => {
    return window.electron.ipcRenderer.invoke('alarm:create', input);
  },
  snooze: (id: string, minutes?: number) => {
    return window.electron.ipcRenderer.invoke('alarm:snooze', id, minutes);
  },
  dismiss: (id: string) => {
    return window.electron.ipcRenderer.invoke('alarm:dismiss', id);
  },
  delete: (id: string) => {
    return window.electron.ipcRenderer.invoke('alarm:delete', id);
  },
  onTriggered: (callback: (alarm: Alarm) => void) => {
    window.electron.ipcRenderer.on('alarm-triggered', (_, alarm) => {
      callback(alarm);
    });
  }
};
