import { ipcRenderer } from 'electron'
import type { ConversationHistoryEntry } from '../../main/types'

export interface ConversationAPI {
  getAll: () => Promise<ConversationHistoryEntry[]>
  save: (entry: ConversationHistoryEntry) => Promise<ConversationHistoryEntry>
  delete: (id: string) => Promise<boolean>
  clear: () => Promise<void>
}

export const conversationAPI: ConversationAPI = {
  getAll: () => ipcRenderer.invoke('conversation:getAll'),
  save: (entry) => ipcRenderer.invoke('conversation:save', entry),
  delete: (id) => ipcRenderer.invoke('conversation:delete', id),
  clear: () => ipcRenderer.invoke('conversation:clear')
}
