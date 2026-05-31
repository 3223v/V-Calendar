import { ipcMain } from 'electron'
import { storageService } from '../services/storage.service'
import type { ConversationHistoryEntry } from '../types'

export function registerConversationHandlers(): void {
  ipcMain.handle('conversation:getAll', async (): Promise<ConversationHistoryEntry[]> => {
    return storageService.getConversations()
  })

  ipcMain.handle(
    'conversation:save',
    async (_event, entry: ConversationHistoryEntry): Promise<ConversationHistoryEntry> => {
      return storageService.saveConversation(entry)
    }
  )

  ipcMain.handle('conversation:delete', async (_event, id: string): Promise<boolean> => {
    return storageService.deleteConversation(id)
  })

  ipcMain.handle('conversation:clear', async (): Promise<void> => {
    return storageService.clearConversations()
  })
}
