<template>
  <div class="crud-panel">
    <div class="panel-header">
      <h3 class="panel-title">待执行操作</h3>
      <span v-if="countdown > 0 && !isEditing" class="countdown"> {{ countdown }}s </span>
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
          :class="[op.type, op.status, { best: selectedOpId === op.id, highlighted: isHighlighted(op.id) }]"
          @click="selectedOpId = op.id"
        >
          <div class="crud-header">
            <div class="crud-header-left">
              <span class="crud-type-badge" :class="op.type">
                {{ typeLabel(op.type) }}
              </span>
              <span class="crud-status-badge" :class="op.status">{{ statusLabel(op.status) }}</span>
            </div>
            <div class="crud-header-right">
              <button
                v-if="op.status === 'pending' && editingOpId !== op.id"
                class="card-btn edit-btn"
                @click.stop="startEdit(op)"
                title="编辑"
              >
                ✎
              </button>
              <button
                v-if="editingOpId === op.id"
                class="card-btn cancel-btn"
                @click.stop="cancelEdit"
                title="取消编辑"
              >
                ✕
              </button>
              <button
                v-if="op.status === 'executed' && op.type === 'create' && op.executedEventId"
                class="card-btn rollback-btn"
                @click.stop="handleRollback(op.id)"
                title="撤销创建"
              >
                ↩
              </button>
              <button
                v-if="op.status === 'pending'"
                class="card-btn exec-btn"
                @click.stop="handleExecuteOne(op.id)"
                title="执行"
              >
                ▶
              </button>
              <span class="crud-source">{{ sourceLabel(op.source) }}</span>
            </div>
          </div>
          <div class="crud-body">
            <div class="crud-field" v-if="editingOpId !== op.id">
              <span class="field-label">标题</span>
              <span class="field-value">{{ op.event.title }}</span>
            </div>
            <div class="crud-field" v-else>
              <span class="field-label">标题</span>
              <input v-model="editData.title" class="edit-input" />
            </div>

            <div v-if="op.event.description || editingOpId === op.id" class="crud-field">
              <span class="field-label">描述</span>
              <span v-if="editingOpId !== op.id" class="field-value">{{ op.event.description }}</span>
              <input v-else v-model="editData.description" class="edit-input" />
            </div>

            <div class="crud-field" v-if="editingOpId !== op.id">
              <span class="field-label">日期</span>
              <span class="field-value">{{ op.event.startDate }} ~ {{ op.event.endDate }}</span>
            </div>
            <div class="crud-field edit-row" v-else>
              <div>
                <span class="field-label">开始日期</span>
                <input v-model="editData.startDate" type="date" class="edit-input" />
              </div>
              <div>
                <span class="field-label">结束日期</span>
                <input v-model="editData.endDate" type="date" class="edit-input" />
              </div>
            </div>

            <div v-if="op.event.startTime || editingOpId === op.id" class="crud-field">
              <span class="field-label">时间</span>
              <span v-if="editingOpId !== op.id" class="field-value">{{ op.event.startTime }} - {{ op.event.endTime || '' }}</span>
              <div v-else class="edit-row">
                <input v-model="editData.startTime" type="time" class="edit-input" />
                <span>-</span>
                <input v-model="editData.endTime" type="time" class="edit-input" />
              </div>
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

          <div v-if="editingOpId === op.id" class="crud-edit-actions">
            <button class="btn btn-primary btn-sm" @click.stop="handleExecuteEdit">
              执行修改
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="hasOperations && hasPendingOps && !isEditing" class="crud-actions">
      <button class="btn btn-secondary" @click="handleAbandon">放弃</button>
      <button class="btn btn-primary" @click="handleExecute" :disabled="!selectedOpId">
        {{ countdown > 0 ? `执行 (${countdown}s)` : '执行' }}
      </button>
    </div>

    <div v-else-if="hasOperations && allOpsDone" class="crud-status">
      <span class="status-done">✓ 全部完成</span>
    </div>

    <div v-else-if="hasOperations && sessionStatus === 'abandoned'" class="crud-status">
      <span class="status-abandoned">✗ 已放弃</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useConversationStore } from '../../stores/conversation.store'
import type { CRUDOperation } from '../../types/conversation'

const conversationStore = useConversationStore()

const selectedOpId = ref<string | null>(null)
const editingOpId = ref<string | null>(null)
const editData = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: ''
})

const currentSession = computed(() => conversationStore.currentSession)
const countdown = computed(() => currentSession.value?.countdownSeconds || 0)
const operations = computed(() => currentSession.value?.crudOperations || [])
const sessionStatus = computed(() => currentSession.value?.status || 'listening')
const hasOperations = computed(() => operations.value.length > 0)
const isEditing = computed(() => editingOpId.value !== null)
const highlightedOps = computed(() => conversationStore.highlightedOps)

const hasPendingOps = computed(() =>
  operations.value.some((o) => o.status === 'pending')
)

const allOpsDone = computed(() =>
  operations.value.length > 0 &&
  operations.value.every(
    (o) => o.status === 'executed' || o.status === 'abandoned' || o.status === 'error' || o.status === 'rolled-back'
  )
)

watch(
  () => operations.value,
  (ops) => {
    if (ops.length > 0 && !selectedOpId.value) {
      const best = ops.reduce((a, b) => (a.confidence > b.confidence ? a : b))
      selectedOpId.value = best.id
    } else if (ops.length === 0) {
      selectedOpId.value = null
    }
  },
  { immediate: true }
)

function isHighlighted(opId: string): boolean {
  return highlightedOps.value.includes(opId)
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    query: '查询'
  }
  return labels[type] || type
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待执行',
    executing: '执行中',
    executed: '已执行',
    abandoned: '已放弃',
    error: '失败',
    'rolled-back': '已撤销'
  }
  return labels[status] || status
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    nlu: 'NLU'
  }
  return labels[source] || ''
}

function startEdit(op: CRUDOperation): void {
  conversationStore.stopCRUDCountdown()
  editingOpId.value = op.id
  editData.title = op.event.title
  editData.description = op.event.description || ''
  editData.startDate = op.event.startDate
  editData.endDate = op.event.endDate
  editData.startTime = op.event.startTime || ''
  editData.endTime = op.event.endTime || ''
}

function cancelEdit(): void {
  editingOpId.value = null
}

function handleExecute(): void {
  if (selectedOpId.value) {
    conversationStore.executeCRUD(selectedOpId.value)
  }
}

function handleExecuteOne(opId: string): void {
  conversationStore.stopCRUDCountdown()
  conversationStore.executeCRUD(opId)
}

function handleExecuteEdit(): void {
  if (!editingOpId.value) return
  const op = operations.value.find((o) => o.id === editingOpId.value)
  if (op) {
    op.event.title = editData.title
    op.event.description = editData.description || undefined
    op.event.startDate = editData.startDate
    op.event.endDate = editData.endDate
    op.event.startTime = editData.startTime || undefined
    op.event.endTime = editData.endTime || undefined
  }
  const opId = editingOpId.value
  editingOpId.value = null
  conversationStore.executeCRUD(opId)
}

function handleAbandon(): void {
  conversationStore.abandonCRUD()
}

function handleRollback(opId: string): void {
  conversationStore.rollbackCRUD(opId)
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

.crud-card.highlighted {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-focus);
}

.crud-card.executed {
  opacity: 0.7;
  border-color: #27ae60;
}

.crud-card.abandoned {
  opacity: 0.5;
  border-color: var(--color-text-light);
}

.crud-card.error {
  border-color: #e74c3c;
}

.crud-card.rolled-back {
  opacity: 0.6;
  border-color: #f39c12;
}

.crud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2);
}

.crud-header-left {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.crud-header-right {
  display: flex;
  gap: var(--spacing-1);
  align-items: center;
}

.crud-type-badge {
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  color: var(--color-text-inverse);
}

.crud-type-badge.create { background-color: #27ae60; }
.crud-type-badge.update { background-color: #f39c12; }
.crud-type-badge.delete { background-color: #e74c3c; }
.crud-type-badge.query { background-color: #3498db; }

.crud-status-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-weight: var(--font-medium);
}

.crud-status-badge.executed { background-color: #d5f5e3; color: #27ae60; }
.crud-status-badge.abandoned { background-color: #f0f0f0; color: var(--color-text-light); }
.crud-status-badge.error { background-color: #fde8e8; color: #e74c3c; }
.crud-status-badge.rolled-back { background-color: #fef3cd; color: #f39c12; }
.crud-status-badge.pending { background-color: #ebf5fb; color: #3498db; }

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

.crud-field.edit-row {
  flex-direction: row;
  gap: var(--spacing-2);
}

.crud-field.edit-row > div {
  flex: 1;
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

.edit-input {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  width: 100%;
}

.edit-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.edit-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
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

.card-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all var(--transition-fast);
}

.card-btn:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-text-light);
}

.card-btn.edit-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.card-btn.rollback-btn {
  color: #e74c3c;
  border-color: #e74c3c;
}

.card-btn.rollback-btn:hover {
  background-color: #fef2f2;
}

.card-btn.cancel-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.card-btn.exec-btn {
  color: #27ae60;
  border-color: #27ae60;
}

.card-btn.exec-btn:hover {
  background-color: #d5f5e3;
}

.crud-edit-actions {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border-light);
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-md);
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
