import { ipcRenderer } from 'electron'
import type { EventInput, EventQueryParams } from '../../main/types'
import type { EventAPI } from '../types'

export const eventAPI: EventAPI = {
  getAll: (params?: EventQueryParams) => {
    return ipcRenderer.invoke('event:getAll', params)
  },
  get: (id: string) => {
    return ipcRenderer.invoke('event:get', id)
  },
  create: (input: EventInput) => {
    return ipcRenderer.invoke('event:create', input)
  },
  update: (id: string, input: EventInput) => {
    return ipcRenderer.invoke('event:update', id, input)
  },
  delete: (id: string) => {
    return ipcRenderer.invoke('event:delete', id)
  },
  deleteMany: (ids: string[]) => {
    return ipcRenderer.invoke('event:deleteMany', ids)
  },
  search: (keyword: string) => {
    return ipcRenderer.invoke('event:search', keyword)
  },
  getByDateRange: (startDate: string, endDate: string) => {
    return ipcRenderer.invoke('event:getByDateRange', startDate, endDate)
  },
  getByCategory: (category: string) => {
    return ipcRenderer.invoke('event:getByCategory', category)
  },
  getStats: () => {
    return ipcRenderer.invoke('event:getStats')
  },
  getBackups: () => {
    return ipcRenderer.invoke('event:getBackups')
  },
  restoreBackup: (backupFile?: string) => {
    return ipcRenderer.invoke('event:restoreBackup', backupFile)
  }
}
