import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CalendarEvent, EventInput, EventQueryParams } from '../types';

export const useEventStore = defineStore('event', () => {
  const events = ref<CalendarEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchEvents(params?: EventQueryParams): Promise<void> {
    console.log('[EventStore] fetchEvents called');
    loading.value = true;
    error.value = null;
    try {
      if (!window.api?.event?.getAll) {
        console.warn('[EventStore] window.api.event.getAll 不可用');
        return;
      }
      events.value = await window.api.event.getAll(params);
      console.log('[EventStore] fetchEvents loaded', events.value.length, 'events');
    } catch (err) {
      error.value = String(err);
      console.error('[EventStore] fetchEvents failed:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createEvent(input: EventInput): Promise<CalendarEvent | null> {
    console.log('[EventStore] createEvent called:', input.title);
    loading.value = true;
    error.value = null;
    try {
      if (!window.api?.event?.create) {
        throw new Error('window.api.event.create 不可用，请确保在 Electron 环境中运行');
      }
      console.log('[EventStore] Calling IPC event:create...');
      const event = await window.api.event.create(input);
      console.log('[EventStore] IPC returned:', event?.id, event?.title);
      events.value.push(event);
      return event;
    } catch (err) {
      const errMsg = String(err);
      console.error('[EventStore] createEvent failed:', errMsg);
      error.value = errMsg;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateEvent(id: string, input: EventInput): Promise<CalendarEvent | null> {
    loading.value = true;
    error.value = null;
    try {
      const event = await window.api.event.update(id, input);
      if (event) {
        const index = events.value.findIndex(e => e.id === id);
        if (index !== -1) {
          events.value[index] = event;
        }
      }
      return event;
    } catch (err) {
      error.value = String(err);
      console.error('Failed to update event:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteEvent(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const success = await window.api.event.delete(id);
      if (success) {
        events.value = events.value.filter(e => e.id !== id);
      }
      return success;
    } catch (err) {
      error.value = String(err);
      console.error('Failed to delete event:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteEvents(ids: string[]): Promise<number> {
    loading.value = true;
    error.value = null;
    try {
      const count = await window.api.event.deleteMany(ids);
      events.value = events.value.filter(e => !ids.includes(e.id));
      return count;
    } catch (err) {
      error.value = String(err);
      console.error('Failed to delete events:', err);
      return 0;
    } finally {
      loading.value = false;
    }
  }

  async function searchEvents(keyword: string): Promise<CalendarEvent[]> {
    loading.value = true;
    error.value = null;
    try {
      return await window.api.event.search(keyword);
    } catch (err) {
      error.value = String(err);
      console.error('Failed to search events:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function getEventsByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    loading.value = true;
    error.value = null;
    try {
      return await window.api.event.getByDateRange(startDate, endDate);
    } catch (err) {
      error.value = String(err);
      console.error('Failed to get events by date range:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function getEventsByCategory(category: string): Promise<CalendarEvent[]> {
    loading.value = true;
    error.value = null;
    try {
      return await window.api.event.getByCategory(category);
    } catch (err) {
      error.value = String(err);
      console.error('Failed to get events by category:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  function getEventsByDate(date: string): CalendarEvent[] {
    return events.value.filter(event => {
      return date >= event.startDate && date <= event.endDate;
    });
  }

  function getEventsByDateRangeLocal(startDate: string, endDate: string): CalendarEvent[] {
    return events.value.filter(event => {
      return event.endDate >= startDate && event.startDate <= endDate;
    });
  }

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    deleteEvents,
    searchEvents,
    getEventsByDateRange,
    getEventsByCategory,
    getEventsByDate,
    getEventsByDateRangeLocal
  };
});
