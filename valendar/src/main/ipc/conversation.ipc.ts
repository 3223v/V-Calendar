import { ipcMain } from 'electron'
import { storageService } from '../services/storage.service'
import type { ConversationSession } from '../types'

export function registerConversationHandlers(): void {
  ipcMain.handle('conversation:getAllSessions', async () => {
    try {
      return await storageService.getConversationHistory()
    } catch (error) {
      console.error('Error getting conversation history:', error)
      throw error
    }
  })

  ipcMain.handle('conversation:saveSession', async (_, session: ConversationSession) => {
    try {
      return await storageService.saveConversationSession(session)
    } catch (error) {
      console.error('Error saving conversation session:', error)
      throw error
    }
  })

  ipcMain.handle('conversation:updateSession', async (_, id: string, updates: Partial<ConversationSession>) => {
    try {
      return await storageService.updateConversationSession(id, updates)
    } catch (error) {
      console.error('Error updating conversation session:', error)
      throw error
    }
  })

  ipcMain.handle('conversation:deleteSession', async (_, id: string) => {
    try {
      return await storageService.deleteConversationSession(id)
    } catch (error) {
      console.error('Error deleting conversation session:', error)
      throw error
    }
  })

  ipcMain.handle('conversation:clearHistory', async () => {
    try {
      await storageService.clearConversationHistory()
    } catch (error) {
      console.error('Error clearing conversation history:', error)
      throw error
    }
  })
}
