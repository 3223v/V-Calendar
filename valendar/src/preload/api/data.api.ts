import { ipcRenderer } from 'electron';
import type { DataAPI } from '../types';

export const dataAPI: DataAPI = {
  export: (format: 'json' | 'csv') => {
    return ipcRenderer.invoke('data:export', format);
  },
  import: (format: 'json' | 'csv') => {
    return ipcRenderer.invoke('data:import', format);
  }
};
