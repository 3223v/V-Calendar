import { computed } from 'vue'
import dayjs from 'dayjs'
import { useAlarmStore } from '../stores/alarm.store'
import { useSettingsStore } from '../stores/settings.store'

export function useAlarm() {
  const alarmStore = useAlarmStore()
  const settingsStore = useSettingsStore()

  const activeAlarm = computed(() => alarmStore.activeAlarm)
  const hasActiveAlarm = computed(() => !!alarmStore.activeAlarm)

  const snoozeMinutesOptions = computed(() => [
    {
      label: `${settingsStore.settings.snoozeMinutes} 分钟`,
      value: settingsStore.settings.snoozeMinutes
    },
    { label: '5 分钟', value: 5 },
    { label: '10 分钟', value: 10 },
    { label: '15 分钟', value: 15 },
    { label: '30 分钟', value: 30 }
  ])

  async function snooze(alarmId: string, minutes?: number): Promise<boolean> {
    return await alarmStore.snoozeAlarm(alarmId, minutes)
  }

  async function dismiss(alarmId: string): Promise<boolean> {
    return await alarmStore.dismissAlarm(alarmId)
  }

  function formatTriggerTime(triggerTime: string): string {
    return dayjs(triggerTime).format('HH:mm')
  }

  return {
    activeAlarm,
    hasActiveAlarm,
    snoozeMinutesOptions,
    snooze,
    dismiss,
    formatTriggerTime
  }
}
