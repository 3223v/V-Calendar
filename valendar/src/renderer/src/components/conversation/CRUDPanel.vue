<template>
  <div class="crud-panel">
    <div class="panel-header">
      <h3 class="panel-title">待执行操作</h3>
      <span v-if="countdown > 0" class="countdown"> {{ countdown }}s </span>
    </div>

    <div v-if="!hasOperations" class="empty-state">
      <div class="empty-icon">📋</div>
      <p class="empty-text">暂无待执行操作</p>
      <p class="empty-hint">语音或文字输入后将在此显示</p>
    </div>

    <div v-else class="operations-list">
      <TransitionGroup name="crud">
        <div
          v-for="op in operations"
          :key="op.id"
          class="crud-card"
          :class="[op.type, { best: selectedOpId === op.id }]"
          @click="selectedOpId = op.id"
        >
          <div class="crud-header">
            <span class="crud-type-badge" :class="op.type">
              {{ typeLabel(op.type) }}
            </span>
            <span class="crud-source">{{ sourceLabel(op.source) }}</span>
          </div>
          <div class="crud-body">
            <div class="crud-field">
              <span class="field-label">标题</span>
              <span class="field-value">{{ op.event.title }}</span>
            </div>
            <div v-if="op.event.description" class="crud-field">
              <span class="field-label">描述</span>
              <span class="field-value">{{ op.event.description }}</span>
            </div>
            <div class="crud-field">
              <span class="field-label">日期</span>
              <span class="field-value">{{ op.event.startDate }} ~ {{ op.event.endDate }}</span>
            </div>
            <div v-if="op.event.startTime" class="crud-field">
              <span class="field-label">时间</span>
              <span class="field-value"
                >{{ op.event.startTime }} - {{ op.event.endTime || '' }}</span
              >
            </div>
            <div class="crud-field">
              <span class="field-label">置信度</span>
              <div class="confidence-bar">
                <div
                  class="confidence-fill"
                  :style="{ width: Math.round(op.confidence * 100) + '%' }"
                ></div>
                <span class="confidence-text">{{ Math.round(op.confidence * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="hasOperations && sessionStatus === 'waiting-decision'" class="crud-actions">
      <button class="btn btn-secondary" @click="handleAbandon">放弃</button>
      <button class="btn btn-primary" @click="handleExecute" :disabled="!selectedOpId">
        {{ countdown > 0 ? `执行 (${countdown}s)` : '执行' }}
      </button>
    </div>

    <div v-else-if="hasOperations && sessionStatus === 'completed'" class="crud-status">
      <span class="status-done">✓ 已执行</span>
    </div>

    <div v-else-if="hasOperations && sessionStatus === 'abandoned'" class="crud-status">
      <span class="status-abandoned">✗ 已放弃</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useConversationStore } from '../../stores/conversation.store'

const conversationStore = useConversationStore()

const selectedOpId = ref<string | null>(null)

const currentSession = computed(() => conversationStore.currentSession)
const countdown = computed(() => currentSession.value?.countdownSeconds || 0)
const operations = computed(() => currentSession.value?.crudOperations || [])
const sessionStatus = computed(() => currentSession.value?.status || 'listening')
const hasOperations = computed(() => operations.value.length > 0)

watch(
  () => operations.value,
  (ops) => {
    if (ops.length > 0) {
      // Auto-select highest confidence operation
      const best = ops.reduce((a, b) => (a.confidence > b.confidence ? a : b))
      selectedOpId.value = best.id
    } else {
      selectedOpId.value = null
    }
  },
  { immediate: true }
)

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除'
  }
  return labels[type] || type
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    nlu: 'NLU'
  }
  return labels[source] || ''
}

function handleExecute(): void {
  if (selectedOpId.value) {
    conversationStore.executeCRUD(selectedOpId.value)
  }
}

function handleAbandon(): void {
  conversationStore.abandonCRUD()
}
</script>

<style scoped>
.crud-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.countdown {
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
  font-family: var(--font-mono);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-6);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: var(--spacing-3);
  opacity: 0.6;
}

.empty-text {
  font-size: var(--text-md);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
  margin-bottom: var(--spacing-1);
}

.empty-hint {
  font-size: var(--text-xs);
  color: var(--color-text-light);
  text-align: center;
}

.operations-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  min-height: 0;
}

.crud-card {
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.crud-card:hover {
  border-color: var(--color-text-light);
  box-shadow: var(--shadow-xs);
}

.crud-card.best {
  border-color: var(--color-primary);
  background-color: var(--color-primary-focus);
}

.crud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2);
}

.crud-type-badge {
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  color: var(--color-text-inverse);
}

.crud-type-badge.create {
  background-color: #27ae60;
}

.crud-type-badge.update {
  background-color: #f39c12;
}

.crud-type-badge.delete {
  background-color: #e74c3c;
}

.crud-source {
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-surface-hover);
  color: var(--color-text-secondary);
}

.crud-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1\.5);
}

.crud-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: var(--text-xs);
  color: var(--color-text-light);
}

.field-value {
  font-size: var(--text-sm);
  color: var(--color-text);
  font-weight: var(--font-medium);
}

.confidence-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  position: relative;
  height: 20px;
  background-color: var(--color-surface-hover);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #27ae60);
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.confidence-text {
  position: absolute;
  right: var(--spacing-2);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text);
}

.crud-actions {
  display: flex;
  gap: var(--spacing-2);
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.crud-actions .btn {
  flex: 1;
  padding: var(--spacing-2\.5) var(--spacing-4);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-lg);
}

.crud-actions .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.crud-status {
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--color-border-light);
  text-align: center;
  font-weight: var(--font-medium);
  flex-shrink: 0;
}

.status-done {
  color: #27ae60;
}

.status-abandoned {
  color: var(--color-text-light);
}

.crud-enter-active {
  transition: all var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1);
}

.crud-leave-active {
  transition: all var(--transition-fast);
}

.crud-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.crud-leave-to {
  opacity: 0;
}
</style>
