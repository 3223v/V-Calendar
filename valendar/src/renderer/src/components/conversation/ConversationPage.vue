<template>
  <div class="conversation-page">
    <aside class="crud-column">
      <CRUDPanel />
    </aside>

    <main class="conversation-column">
      <ConversationPanel />
    </main>

    <aside class="events-column">
      <div class="events-content">
        <EventList
          :events="events"
          @create="handleCreate"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
    </aside>

    <Transition name="fade">
      <EventForm
        v-if="showEventForm"
        :event="editingEvent"
        :default-date="defaultDate"
        @submit="handleFormSubmit"
        @close="closeEventForm"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useEventStore } from '../../stores/event.store'
import { createLogger } from '../../utils/logger'
import EventList from '../event/EventList.vue'
import EventForm from '../event/EventForm.vue'
import ConversationPanel from './ConversationPanel.vue'
import CRUDPanel from './CRUDPanel.vue'
import type { CalendarEvent, EventInput } from '../../types'

const log = createLogger('ConversationPage')

const eventStore = useEventStore()
const showEventForm = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)

const events = computed(() => eventStore.events)
const defaultDate = computed(() => dayjs().format('YYYY-MM-DD'))

function handleCreate(): void {
  editingEvent.value = null
  showEventForm.value = true
}

function handleEdit(event: CalendarEvent): void {
  editingEvent.value = event
  showEventForm.value = true
}

async function handleDelete(event: CalendarEvent): Promise<void> {
  await eventStore.deleteEvent(event.id)
}

async function handleFormSubmit(input: EventInput): Promise<void> {
  try {
    if (editingEvent.value) {
      await eventStore.updateEvent(editingEvent.value.id, input)
    } else {
      await eventStore.createEvent(input)
    }
    await eventStore.fetchEvents()
    closeEventForm()
  } catch (err) {
    log.error('Form submit error:', err)
  }
}

function closeEventForm(): void {
  showEventForm.value = false
  editingEvent.value = null
}
</script>

<style scoped>
.conversation-page {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
  padding: var(--spacing-4) var(--spacing-6);
  gap: var(--spacing-4);
}

.events-column {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.conversation-column {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.crud-column {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.events-content {
  flex: 1;
  overflow: hidden;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
}
</style>
