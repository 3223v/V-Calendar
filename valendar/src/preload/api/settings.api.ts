import { ipcRenderer } from 'electron'
import type { Settings } from '../../main/types'
import type { SettingsAPI } from '../types'

export const settingsAPI: SettingsAPI = {
  get: () => {
    return ipcRenderer.invoke('settings:get')
  },
  update: (settings: Partial<Settings>) => {
    return ipcRenderer.invoke('settings:update', settings)
  }
}
