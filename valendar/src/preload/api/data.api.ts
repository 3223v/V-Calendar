import type { DataAPI } from '../types';

export const dataAPI: DataAPI = {
  export: (format: 'json' | 'csv') => {
    return window.electron.ipcRenderer.invoke('data:export', format);
  },
  import: (format: 'json' | 'csv') => {
    return window.electron.ipcRenderer.invoke('data:import', format);
  }
};
