import { ipcMain } from 'electron'
import { storageService } from '../services/storage.service'
import type { Settings } from '../types'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async () => {
    try {
      return await storageService.getSettings()
    } catch (error) {
      console.error('Error getting settings:', error)
      throw error
    }
  })

  ipcMain.handle('settings:update', async (_, updates: Partial<Settings>) => {
    try {
      return await storageService.updateSettings(updates)
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  })
}
