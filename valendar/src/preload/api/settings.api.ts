import type { Settings } from '../../main/types';
import type { SettingsAPI } from '../types';

export const settingsAPI: SettingsAPI = {
  get: () => {
    return window.electron.ipcRenderer.invoke('settings:get');
  },
  update: (settings: Partial<Settings>) => {
    return window.electron.ipcRenderer.invoke('settings:update', settings);
  }
};
