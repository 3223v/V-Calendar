import { ipcRenderer } from 'electron'
import type { ConversationAPI, ConversationSession } from '../types'

export const conversationAPI: ConversationAPI = {
  getAllSessions: () => {
    return ipcRenderer.invoke('conversation:getAllSessions')
  },
  saveSession: (session: ConversationSession) => {
    return ipcRenderer.invoke('conversation:saveSession', session)
  },
  updateSession: (id: string, updates: Partial<ConversationSession>) => {
    return ipcRenderer.invoke('conversation:updateSession', id, updates)
  },
  deleteSession: (id: string) => {
    return ipcRenderer.invoke('conversation:deleteSession', id)
  },
  clearHistory: () => {
    return ipcRenderer.invoke('conversation:clearHistory')
  }
}
