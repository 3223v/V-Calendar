import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CalendarEvent, EventInput, EventQueryParams } from '../types';

export const useEventStore = defineStore('event', () => {
  const events = ref<CalendarEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchEvents(params?: EventQueryParams): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      events.value = await window.api.event.getAll(params);
    } catch (err) {
      error.value = String(err);
      console.error('Failed to fetch events:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createEvent(input: EventInput): Promise<CalendarEvent | null> {
    loading.value = true;
    error.value = null;
    try {
      const event = await window.api.event.create(input);
      events.value.push(event);
      return event;
    } catch (err) {
      error.value = String(err);
      console.error('Failed to create event:', err);
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

  function getEventsByDate(date: string): CalendarEvent[] {
    return events.value.filter(event => {
      return date >= event.startDate && date <= event.endDate;
    });
  }

  function getEventsByDateRange(startDate: string, endDate: string): CalendarEvent[] {
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
    getEventsByDate,
    getEventsByDateRange
  };
});
