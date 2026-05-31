import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '../types'
import { createLogger } from '../utils/logger'

const log = createLogger('SettingsStore')

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    language: 'zh-CN',
    theme: 'system',
    weekStartDay: 0,
    defaultView: 'month',
    showLunar: true,
    showHoliday: true,
    holidayRegions: ['CN'],
    alarmSound: 'default',
    alarmVolume: 80,
    snoozeMinutes: 5,
    crudCountdown: 10,
    crudAutoExecute: 'best',
    aiSupportsImage: false
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSettings(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      settings.value = await window.api.settings.get()
    } catch (err) {
      error.value = String(err)
      log.error('Failed to fetch settings:', err)
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(updates: Partial<Settings>): Promise<Settings | null> {
    loading.value = true
    error.value = null
    try {
      const newSettings = await window.api.settings.update(updates)
      settings.value = newSettings
      return newSettings
    } catch (err) {
      error.value = String(err)
      log.error('Failed to update settings:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  function applyTheme(theme: Settings['theme']): void {
    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    applyTheme
  }
})
