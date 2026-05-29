<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <button class="nav-btn" @click="handlePrev">←</button>
        <h1 class="current-date">{{ formattedCurrentDate }}</h1>
        <button class="nav-btn" @click="handleNext">→</button>
        <button class="btn btn-secondary" @click="goToToday">今天</button>
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
        <button class="icon-btn" @click="handleImport" title="导入">
          📥
        </button>
        <button class="icon-btn" @click="handleExport" title="导出">
          📤
        </button>
        <button class="icon-btn" @click="handleSettings" title="设置">
          ⚙️
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

    <EventForm
      v-if="showEventForm"
      :event="editingEvent"
      @submit="handleFormSubmit"
      @close="closeEventForm"
    />

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

async function handleImport(): Promise<void> {
  const result = await window.api.data.import('json');
  if (result.success) {
    await eventStore.fetchEvents();
    alert(`成功导入 ${result.imported} 个事件`);
  } else {
    alert('导入失败');
  }
}

async function handleExport(): Promise<void> {
  const result = await window.api.data.export('json');
  if (result.success) {
    alert(`成功导出 ${result.recordCount} 个事件`);
  } else {
    alert('导出失败');
  }
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
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.current-date {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 200px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  font-size: 18px;
  color: var(--color-text);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background-color: var(--color-surface-hover);
}

.header-center {
  display: flex;
  align-items: center;
}

.view-switcher {
  display: flex;
  gap: 2px;
  background-color: var(--color-background);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.view-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.view-btn:hover {
  color: var(--color-text);
}

.view-btn.active {
  background-color: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  font-size: 20px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: var(--color-surface-hover);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.calendar-section {
  flex: 1;
  overflow: hidden;
}

.events-section {
  width: 400px;
  border-left: 1px solid var(--color-border);
  overflow: hidden;
}
</style>
