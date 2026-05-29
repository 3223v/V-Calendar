import type { EventInput, EventQueryParams } from '../../main/types';
import type { EventAPI } from '../types';

export const eventAPI: EventAPI = {
  getAll: (params?: EventQueryParams) => {
    return window.electron.ipcRenderer.invoke('event:getAll', params);
  },
  get: (id: string) => {
    return window.electron.ipcRenderer.invoke('event:get', id);
  },
  create: (input: EventInput) => {
    return window.electron.ipcRenderer.invoke('event:create', input);
  },
  update: (id: string, input: EventInput) => {
    return window.electron.ipcRenderer.invoke('event:update', id, input);
  },
  delete: (id: string) => {
    return window.electron.ipcRenderer.invoke('event:delete', id);
  },
  deleteMany: (ids: string[]) => {
    return window.electron.ipcRenderer.invoke('event:deleteMany', ids);
  }
};
