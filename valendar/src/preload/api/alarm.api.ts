import { ipcRenderer } from 'electron';
import type { Alarm, AlarmInput } from '../../main/types';
import type { AlarmAPI } from '../types';

export const alarmAPI: AlarmAPI = {
  getAll: () => {
    return ipcRenderer.invoke('alarm:getAll');
  },
  create: (input: AlarmInput) => {
    return ipcRenderer.invoke('alarm:create', input);
  },
  snooze: (id: string, minutes?: number) => {
    return ipcRenderer.invoke('alarm:snooze', id, minutes);
  },
  dismiss: (id: string) => {
    return ipcRenderer.invoke('alarm:dismiss', id);
  },
  delete: (id: string) => {
    return ipcRenderer.invoke('alarm:delete', id);
  },
  onTriggered: (callback: (alarm: Alarm) => void) => {
    ipcRenderer.on('alarm-triggered', (_, alarm) => {
      callback(alarm);
    });
  }
};
