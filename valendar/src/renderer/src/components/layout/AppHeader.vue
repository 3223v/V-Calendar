<template>
  <header class="app-header">
    <div class="header-left">
      <div class="nav-group">
        <button class="btn btn-icon btn-ghost" @click="$emit('prev')" aria-label="上一个">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button class="btn btn-icon btn-ghost" @click="$emit('next')" aria-label="下一个">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <h1 class="current-date">{{ formattedCurrentDate }}</h1>
      <button class="btn btn-secondary btn-sm" @click="$emit('today')">今天</button>
      <span v-if="todayDateStr" class="today-detail">{{ todayDateStr }} {{ todayWeekday }}</span>
    </div>

    <div class="header-center">
      <template v-if="showViewSwitcher">
        <div class="view-switcher">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            class="view-btn"
            :class="{ active: viewMode === mode.value }"
            @click="$emit('change-view', mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </template>
    </div>

    <div class="header-right">
      <button
        class="btn btn-icon btn-ghost conversation-btn"
        :class="{ active: isConversation }"
        @click="$emit('toggle-conversation')"
        :title="isConversation ? '返回日历' : '语音助手'"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" v-if="!isConversation" />
          <line x1="9" y1="14" x2="13" y2="14" v-if="!isConversation" />
          <polyline points="15 6 19 10 15 14" v-if="isConversation" />
        </svg>
      </button>
      <button
        class="btn btn-icon btn-ghost settings-btn"
        :class="{ active: isSettings }"
        @click="$emit('settings')"
        title="设置"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { ViewMode } from '../../types'

defineProps<{
  formattedCurrentDate: string
  viewMode: ViewMode
  showViewSwitcher?: boolean
  isConversation?: boolean
  isSettings?: boolean
  todayDateStr?: string
  todayWeekday?: string
}>()

defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'today'): void
  (e: 'change-view', mode: ViewMode): void
  (e: 'settings'): void
  (e: 'toggle-conversation'): void
}>()

const viewModes = [
  { label: '月', value: 'month' as const },
  { label: '周', value: 'week' as const },
  { label: '日', value: 'day' as const }
]
</script>

<style scoped>
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
  min-width: 140px;
}

.today-detail {
  font-size: var(--text-md);
  color: var(--color-text-secondary);
  white-space: nowrap;
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

.conversation-btn.active,
.settings-btn.active {
  background-color: var(--color-primary-focus);
  color: var(--color-primary);
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
}

@media (max-width: 768px) {
  .app-header {
    padding: var(--spacing-2) var(--spacing-4);
  }

  .current-date {
    font-size: var(--text-xl);
    min-width: auto;
  }

  .today-detail {
    display: none;
  }
}

@media (max-width: 640px) {
  .header-left {
    flex: 1;
  }

  .nav-group {
    order: -1;
  }
}
</style>
