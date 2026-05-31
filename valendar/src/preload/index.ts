import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { eventAPI } from './api/event.api'
import { alarmAPI } from './api/alarm.api'
import { settingsAPI } from './api/settings.api'
import { dataAPI } from './api/data.api'
import { conversationAPI } from './api/conversation.api'

const api = {
  event: eventAPI,
  alarm: alarmAPI,
  settings: settingsAPI,
  data: dataAPI,
  conversation: conversationAPI
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
