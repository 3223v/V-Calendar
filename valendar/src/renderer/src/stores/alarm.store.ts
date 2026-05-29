import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Alarm } from '../types';

export const useAlarmStore = defineStore('alarm', () => {
  const alarms = ref<Alarm[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const activeAlarm = ref<Alarm | null>(null);
  let listenerSetup = false;

  async function fetchAlarms(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      alarms.value = await window.api.alarm.getAll();
    } catch (err) {
      error.value = String(err);
      console.error('Failed to fetch alarms:', err);
    } finally {
      loading.value = false;
    }
  }

  async function snoozeAlarm(id: string, minutes?: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const success = await window.api.alarm.snooze(id, minutes);
      if (success) {
        activeAlarm.value = null;
        await fetchAlarms();
      }
      return success;
    } catch (err) {
      error.value = String(err);
      console.error('Failed to snooze alarm:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function dismissAlarm(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const success = await window.api.alarm.dismiss(id);
      if (success) {
        activeAlarm.value = null;
        await fetchAlarms();
      }
      return success;
    } catch (err) {
      error.value = String(err);
      console.error('Failed to dismiss alarm:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function setupAlarmListener(): void {
    if (listenerSetup) return;
    listenerSetup = true;
    window.api.alarm.onTriggered((alarm: Alarm) => {
      activeAlarm.value = alarm;
    });
  }

  return {
    alarms,
    loading,
    error,
    activeAlarm,
    fetchAlarms,
    snoozeAlarm,
    dismissAlarm,
    setupAlarmListener
  };
});
