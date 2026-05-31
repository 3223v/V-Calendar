<template>
  <div class="app">
    <AppHeader
      :formatted-current-date="formattedCurrentDate"
      :view-mode="viewMode"
      :show-view-switcher="currentPage === 'calendar'"
      :is-conversation="currentPage === 'conversation'"
      :is-settings="currentPage === 'settings'"
      :today-date-str="todayDateStr"
      :today-weekday="todayWeekday"
      @prev="handlePrev"
      @next="handleNext"
      @today="goToToday"
      @change-view="setViewMode"
      @settings="currentPage = currentPage === 'settings' ? 'calendar' : 'settings'"
      @toggle-conversation="toggleConversation"
    />

    <template v-if="currentPage === 'calendar'">
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
    </template>

    <ConversationPage v-else-if="currentPage === 'conversation'" />

    <SettingsPage v-else-if="currentPage === 'settings'" />

    <Transition name="fade">
      <EventForm
        v-if="showEventForm"
        :event="editingEvent"
        :default-date="defaultEventDate"
        :default-start-time="defaultEventStartTime"
        :default-end-time="defaultEventEndTime"
        @submit="handleFormSubmit"
        @close="closeEventForm"
      />
    </Transition>

    <AlarmPopup />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useCalendarStore } from './stores/calendar.store'
import { useEventStore } from './stores/event.store'
import { useSettingsStore } from './stores/settings.store'
import { useAlarmStore } from './stores/alarm.store'
import { useConversationStore } from './stores/conversation.store'
import { useCalendar } from './composables/useCalendar'
import { createLogger } from './utils/logger'
import { onlineASR } from './services/asr/online-asr'
import { nluManager } from './services/nlu/nlu-manager'
import AppHeader from './components/layout/AppHeader.vue'
import MonthView from './components/calendar/MonthView.vue'
import WeekView from './components/calendar/WeekView.vue'
import DayView from './components/calendar/DayView.vue'
import EventList from './components/event/EventList.vue'
import EventForm from './components/event/EventForm.vue'
import AlarmPopup from './components/alarm/AlarmPopup.vue'
import ConversationPage from './components/conversation/ConversationPage.vue'
import SettingsPage from './components/settings/SettingsPage.vue'
import type { CalendarEvent, EventInput, ViewMode } from './types'

const log = createLogger('App')

const calendarStore = useCalendarStore()
const eventStore = useEventStore()
const settingsStore = useSettingsStore()
const alarmStore = useAlarmStore()
const conversationStore = useConversationStore()
const { formattedCurrentDate, selectedDate, selectedTimeSlot } = useCalendar()

const viewMode = ref<ViewMode>('month')
const showEventForm = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const currentPage = ref<'calendar' | 'conversation' | 'settings'>('calendar')

const todayDateStr = computed(() => dayjs().format('M月D日'))
const todayWeekday = computed(() => dayjs().format('dddd'))

const selectedDateEvents = computed(() => {
  const dateStr = selectedDate.value.format('YYYY-MM-DD')
  return eventStore.getEventsByDate(dateStr)
})

const defaultEventDate = computed(() => {
  return selectedTimeSlot.value?.date || selectedDate.value.format('YYYY-MM-DD')
})

const defaultEventStartTime = computed(() => {
  return selectedTimeSlot.value?.startTime || ''
})

const defaultEventEndTime = computed(() => {
  return selectedTimeSlot.value?.endTime || ''
})

onMounted(async () => {
  log.info('App mounted, fetching initial data...')
  await settingsStore.fetchSettings()
  await eventStore.fetchEvents()
  await alarmStore.fetchAlarms()
  alarmStore.setupAlarmListener()
  settingsStore.applyTheme(settingsStore.settings.theme)
  viewMode.value = settingsStore.settings.defaultView

  // Always configure ASR with default key if not set
  const asrKey = settingsStore.settings.asrOnlineKey
  onlineASR.configure(asrKey || '9b36f0044c8a4d2eb486e3b037749361.3oTwpnahTWQvSp4w')
  log.info('ASR configured')

  // Always configure NLU with defaults if not set
  nluManager.configure(
    settingsStore.settings.aiBaseUrl || 'https://api.deepseek.com',
    settingsStore.settings.aiApiKey || 'sk-1362e0bb054d48c288e6a70cff613c19',
    settingsStore.settings.aiModel || 'deepseek-v4-pro'
  )
  log.info('NLU configured')

  // Wire CRUD countdown from settings
  conversationStore.setCountdownSeconds(settingsStore.settings.crudCountdown || 3)
})

function toggleConversation(): void {
  if (currentPage.value === 'conversation') {
    currentPage.value = 'calendar'
  } else {
    currentPage.value = 'conversation'
  }
}

function handlePrev(): void {
  if (viewMode.value === 'month') {
    calendarStore.prevMonth()
  } else if (viewMode.value === 'week') {
    calendarStore.prevWeek()
  } else {
    calendarStore.prevDay()
  }
}

function handleNext(): void {
  if (viewMode.value === 'month') {
    calendarStore.nextMonth()
  } else if (viewMode.value === 'week') {
    calendarStore.nextWeek()
  } else {
    calendarStore.nextDay()
  }
}

function goToToday(): void {
  calendarStore.goToToday()
}

function setViewMode(mode: ViewMode): void {
  viewMode.value = mode
}

function handleCreate(): void {
  editingEvent.value = null
  showEventForm.value = true
}

function handleEdit(event: CalendarEvent): void {
  editingEvent.value = event
  showEventForm.value = true
}

async function handleDelete(event: CalendarEvent): Promise<void> {
  const result = await eventStore.deleteEvent(event.id)
  if (result) {
    log.info('Event deleted:', event.id)
  }
}

async function handleFormSubmit(input: EventInput): Promise<void> {
  log.info('handleFormSubmit:', input.title)
  try {
    let success = false
    if (editingEvent.value) {
      const result = await eventStore.updateEvent(editingEvent.value.id, input)
      success = !!result
    } else {
      const result = await eventStore.createEvent(input)
      success = !!result
    }
    if (success) {
      await eventStore.fetchEvents()
      closeEventForm()
    } else {
      log.warn('Operation failed, form stays open')
    }
  } catch (err) {
    log.error('handleFormSubmit error:', err)
  }
}

function closeEventForm(): void {
  showEventForm.value = false
  editingEvent.value = null
}

function handleEventClick(event: CalendarEvent): void {
  handleEdit(event)
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

@media (max-width: 1200px) {
  .events-section {
    width: 320px;
    min-width: 280px;
  }
}

@media (max-width: 1024px) {
  .events-section {
    width: 280px;
    min-width: 260px;
  }
}

@media (max-width: 768px) {
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
  .app-main {
    padding: var(--spacing-2) var(--spacing-3);
    gap: var(--spacing-3);
  }
}
</style>
