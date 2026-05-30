import type { CalendarEvent, EventCategory } from '../types'

const EVENT_COLORS: Record<EventCategory, string> = {
  work: 'var(--color-event-work)',
  personal: 'var(--color-event-personal)',
  holiday: 'var(--color-event-holiday)',
  important: 'var(--color-event-important)',
  custom: 'var(--color-primary)'
}

export function getEventColor(category: EventCategory): string {
  return EVENT_COLORS[category] || EVENT_COLORS.personal
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

export function getEventTop(event: CalendarEvent): string {
  if (!event.startTime) return '0px'
  const [hours, minutes] = event.startTime.split(':').map(Number)
  return `${((hours * 60 + minutes) / 60) * 60}px`
}

export function getEventHeight(event: CalendarEvent): string {
  if (!event.startTime || !event.endTime) return '60px'
  const [startHours, startMinutes] = event.startTime.split(':').map(Number)
  const [endHours, endMinutes] = event.endTime.split(':').map(Number)
  const startMinutesTotal = startHours * 60 + startMinutes
  const endMinutesTotal = endHours * 60 + endMinutes
  const duration = Math.max(endMinutesTotal - startMinutesTotal, 30)
  return `${(duration / 60) * 60}px`
}

export function getEventForHour(events: CalendarEvent[], hour: number): CalendarEvent[] {
  return events.filter((e) => {
    if (!e.startTime) return false
    const eventHour = parseInt(e.startTime.split(':')[0], 10)
    return eventHour === hour
  })
}
