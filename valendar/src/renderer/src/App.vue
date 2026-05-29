<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <div class="nav-group">
          <button class="btn btn-icon btn-ghost" @click="handlePrev" aria-label="上一个">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="btn btn-icon btn-ghost" @click="handleNext" aria-label="下一个">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <h1 class="current-date">{{ formattedCurrentDate }}</h1>
        <button class="btn btn-secondary btn-sm" @click="goToToday">今天</button>
      </div>
      <div class="header-center">
        <div class="view-switcher">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            class="view-btn"
            :class="{ active: viewMode === mode.value }"
            @click="setViewMode(mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-icon btn-ghost" @click="handleSettings" title="设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>

    <main class="app-main">
      <div class="calendar-section">
        <MonthView v-if="viewMode === 'month'" />
        <WeekView v-else-if="viewMode === 'week'" @event-click="handleEventClick" />
        <DayView v-else @event-click="handleEventClick" />
      </div>

      <aside class="events-section">
        <EventList
          :events="selectedDateEvents"
          @create="handleCreate"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </aside>
    </main>

    <Transition name="fade">
      <EventForm
        v-if="showEventForm"
        :event="editingEvent"
        @submit="handleFormSubmit"
        @close="closeEventForm"
      />
    </Transition>

    <AlarmPopup />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCalendarStore } from './stores/calendar.store';
import { useEventStore } from './stores/event.store';
import { useSettingsStore } from './stores/settings.store';
import { useAlarmStore } from './stores/alarm.store';
import { useCalendar } from './composables/useCalendar';
import MonthView from './components/calendar/MonthView.vue';
import WeekView from './components/calendar/WeekView.vue';
import DayView from './components/calendar/DayView.vue';
import EventList from './components/event/EventList.vue';
import EventForm from './components/event/EventForm.vue';
import AlarmPopup from './components/alarm/AlarmPopup.vue';
import type { CalendarEvent, EventInput } from './types';

const calendarStore = useCalendarStore();
const eventStore = useEventStore();
const settingsStore = useSettingsStore();
const alarmStore = useAlarmStore();
const { formattedCurrentDate, selectedDate } = useCalendar();

const viewMode = ref<'month' | 'week' | 'day'>('month');
const showEventForm = ref(false);
const editingEvent = ref<CalendarEvent | null>(null);

const viewModes = [
  { label: '月', value: 'month' as const },
  { label: '周', value: 'week' as const },
  { label: '日', value: 'day' as const }
];

const selectedDateEvents = computed(() => {
  const dateStr = selectedDate.value.format('YYYY-MM-DD');
  return eventStore.getEventsByDate(dateStr);
});

onMounted(async () => {
  await settingsStore.fetchSettings();
  await eventStore.fetchEvents();
  await alarmStore.fetchAlarms();
  alarmStore.setupAlarmListener();
  settingsStore.applyTheme(settingsStore.settings.theme);
  viewMode.value = settingsStore.settings.defaultView;
});

function handlePrev(): void {
  if (viewMode.value === 'month') {
    calendarStore.prevMonth();
  } else if (viewMode.value === 'week') {
    calendarStore.prevWeek();
  } else {
    calendarStore.prevDay();
  }
}

function handleNext(): void {
  if (viewMode.value === 'month') {
    calendarStore.nextMonth();
  } else if (viewMode.value === 'week') {
    calendarStore.nextWeek();
  } else {
    calendarStore.nextDay();
  }
}

function goToToday(): void {
  calendarStore.goToToday();
}

function setViewMode(mode: 'month' | 'week' | 'day'): void {
  viewMode.value = mode;
}

function handleCreate(): void {
  editingEvent.value = null;
  showEventForm.value = true;
}

function handleEdit(event: CalendarEvent): void {
  editingEvent.value = event;
  showEventForm.value = true;
}

async function handleDelete(event: CalendarEvent): Promise<void> {
  await eventStore.deleteEvent(event.id);
}

async function handleFormSubmit(input: EventInput): Promise<void> {
  if (editingEvent.value) {
    await eventStore.updateEvent(editingEvent.value.id, input);
  } else {
    await eventStore.createEvent(input);
  }
  closeEventForm();
}

function closeEventForm(): void {
  showEventForm.value = false;
  editingEvent.value = null;
}

function handleEventClick(event: CalendarEvent): void {
  handleEdit(event);
}

function handleSettings(): void {
  console.log('Settings clicked');
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
  overflow: hidden;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-6);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  min-height: 56px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.nav-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  padding: var(--spacing-0\.5);
}

.current-date {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: -0.025em;
  min-width: 180px;
}

.header-center {
  display: flex;
  align-items: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.view-switcher {
  display: flex;
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  padding: var(--spacing-0\.5);
  border: 1px solid var(--color-border-light);
}

.view-btn {
  padding: var(--spacing-1\.5) var(--spacing-3\.5);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
  position: relative;
}

.view-btn:hover {
  color: var(--color-text);
}

.view-btn.active {
  background-color: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
  padding: var(--spacing-4) var(--spacing-6);
  gap: var(--spacing-4);
}

.calendar-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
}

.events-section {
  width: 360px;
  min-width: 300px;
  max-width: 420px;
  overflow: hidden;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
  flex-shrink: 0;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .events-section {
    width: 320px;
    min-width: 280px;
  }
}

@media (max-width: 1024px) {
  .header-center {
    position: static;
    transform: none;
  }

  .app-header {
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }

  .events-section {
    width: 280px;
    min-width: 260px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: var(--spacing-2) var(--spacing-4);
  }

  .current-date {
    font-size: var(--text-xl);
    min-width: auto;
  }

  .app-main {
    flex-direction: column;
    padding: var(--spacing-3) var(--spacing-4);
  }

  .events-section {
    width: 100%;
    max-width: 100%;
    height: 40vh;
  }
}

@media (max-width: 640px) {
  .header-left {
    flex: 1;
  }

  .nav-group {
    order: -1;
  }

  .app-main {
    padding: var(--spacing-2) var(--spacing-3);
    gap: var(--spacing-3);
  }
}
</style>
