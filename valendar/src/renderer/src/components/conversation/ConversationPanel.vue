<template>
  <div class="conversation-panel">
    <div class="panel-header">
      <h3 class="panel-title">语音助手</h3>
      <button class="btn-new-session" @click="newSession" title="开始新会话">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="currentMessages.length === 0" class="empty-chat">
        <div class="empty-icon">🎙️</div>
        <p class="empty-text">开始语音或文字输入</p>
        <p class="empty-hint">描述您想要创建的事件</p>
      </div>

      <TransitionGroup name="message" tag="div" class="messages-list">
        <div
          v-for="msg in currentMessages"
          :key="msg.id"
          class="message-bubble"
          :class="[msg.role, msg.type]"
        >
          <div class="message-avatar">
            <span v-if="msg.role === 'user'">👤</span>
            <span v-else>🤖</span>
          </div>

          <div class="message-wrapper">
            <div class="message-header">
              <span class="message-role">
                {{ msg.role === 'user' ? '你' : '助手' }}
              </span>
              <span class="message-time">
                {{ formatTime(msg.timestamp) }}
              </span>
            </div>

            <div class="message-content">
              <span v-if="msg.type === 'thinking'" class="thinking-dots">
                {{ msg.content }}
              </span>
              <template v-else>
                {{ msg.content }}
              </template>

              <template v-if="msg.crudOperations && msg.crudOperations.length > 0">
                <div class="operations-container">
                  <div
                    v-for="op in msg.crudOperations"
                    :key="op.id"
                    class="operation-card"
                    :class="[op.type, { selected: selectedOpId === op.id }]"
                    @click="selectedOpId = op.id"
                  >
                    <div class="operation-header">
                      <span class="operation-type" :class="op.type">
                        {{ getOperationLabel(op.type) }}
                      </span>
                      <span v-if="op.confidence" class="confidence-badge">
                        {{ Math.round(op.confidence * 100) }}%
                      </span>
                    </div>
                    <div class="operation-details">
                      <div class="detail-item">
                        <span class="detail-label">标题:</span>
                        <span class="detail-value">{{ op.event.title }}</span>
                      </div>
                      <div class="detail-item" v-if="op.event.description">
                        <span class="detail-label">描述:</span>
                        <span class="detail-value">{{ op.event.description }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">日期:</span>
                        <span class="detail-value">{{ op.event.startDate }} ~ {{ op.event.endDate }}</span>
                      </div>
                      <div v-if="op.event.startTime" class="detail-item">
                        <span class="detail-label">时间:</span>
                        <span class="detail-value">
                          {{ op.event.startTime }}{{ op.event.endTime ? ' - ' + op.event.endTime : '' }}
                        </span>
                      </div>
                      <div v-if="op.event.location" class="detail-item">
                        <span class="detail-label">地点:</span>
                        <span class="detail-value">{{ op.event.location }}</span>
                      </div>
                    </div>
                    <div v-if="op.executed" class="execution-status">
                      <span :class="op.error ? 'error' : 'success'">
                        {{ op.error ? '❌ ' + op.error : '✅ 已执行' }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="showActions" class="action-buttons">
      <button class="btn btn-secondary" @click="handleAbandon">
        放弃
      </button>
      <button
        class="btn btn-primary"
        @click="handleExecuteAll"
        :disabled="isProcessing"
      >
        {{ countdown > 0 ? `全部执行 (${countdown}s)` : '全部执行' }}
      </button>
    </div>

    <VoiceInput />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useConversationStore } from '../../stores/conversation.store'
import VoiceInput from './VoiceInput.vue'

const conversationStore = useConversationStore()
const currentMessages = computed(() => conversationStore.currentMessages)
const currentSession = computed(() => conversationStore.currentSession)
const isProcessing = computed(() => conversationStore.isProcessing)
const selectedOpId = ref<string | null>(null)

const countdown = computed(() => currentSession.value?.countdownSeconds || 0)
const showActions = computed(() => {
  return (
    currentSession.value?.status === 'waiting-decision' &&
    currentSession.value.crudOperations.length > 0
  )
})

const messagesContainer = ref<HTMLDivElement | null>(null)

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function getOperationLabel(type: string): string {
  switch (type) {
    case 'create':
      return '创建'
    case 'update':
      return '更新'
    case 'delete':
      return '删除'
    default:
      return type
  }
}

function handleExecuteAll(): void {
  conversationStore.executeAllCRUD()
}

function handleAbandon(): void {
  conversationStore.abandonCRUD()
}

function newSession(): void {
  conversationStore.newSession()
  selectedOpId.value = null
}

// Auto scroll to bottom when messages change
watch(
  () => currentMessages.value.length,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
)

// Auto select first operation when operations come in
watch(
  () => currentSession.value?.crudOperations,
  (ops) => {
    if (ops && ops.length > 0 && !selectedOpId.value) {
      selectedOpId.value = ops[0].id
    } else if (!ops || ops.length === 0) {
      selectedOpId.value = null
    }
  }
)
</script>

<style scoped>
.conversation-panel {
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

.btn-new-session {
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-new-session:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-4);
  min-height: 0;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-light);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-3);
  opacity: 0.6;
}

.empty-text {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-1);
}

.empty-hint {
  font-size: var(--text-sm);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.message-bubble {
  display: flex;
  gap: var(--spacing-3);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background-color: var(--color-surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.message-bubble.user .message-avatar {
  order: 2;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.message-wrapper {
  flex: 1;
  min-width: 0;
}

.message-bubble.user .message-wrapper {
  order: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.message-bubble.user .message-header {
  flex-direction: row-reverse;
}

.message-role {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.message-time {
  font-size: var(--text-xs);
  color: var(--color-text-light);
}

.message-content {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  max-width: 100%;
  line-height: var(--leading-relaxed);
  word-break: break-word;
}

.message-bubble.user .message-content {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border-bottom-right-radius: var(--radius-sm);
}

.message-bubble.assistant .message-content {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
  border-bottom-left-radius: var(--radius-sm);
}

.message-bubble.error .message-content {
  background-color: #fff5f5;
  color: #c53030;
  border-left: 3px solid #fc8181;
}

.message-bubble.completed .message-content {
  background-color: #f0fff4;
  color: #22543d;
  border-left: 3px solid #68d391;
}

.message-bubble.abandoned .message-content {
  background-color: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border-left: 3px solid var(--color-border);
}

.thinking-dots {
  display: inline-block;
}

.operations-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-top: var(--spacing-3);
}

.operation-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.operation-card:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-xs);
}

.operation-card.selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-focus);
}

.operation-card.create {
  border-left: 4px solid #48bb78;
}

.operation-card.update {
  border-left: 4px solid #ed8936;
}

.operation-card.delete {
  border-left: 4px solid #f56565;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2);
}

.operation-type {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: white;
}

.operation-type.create {
  background-color: #48bb78;
}

.operation-type.update {
  background-color: #ed8936;
}

.operation-type.delete {
  background-color: #f56565;
}

.confidence-badge {
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.operation-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.detail-item {
  display: flex;
  gap: var(--spacing-2);
  font-size: var(--text-sm);
}

.detail-label {
  color: var(--color-text-light);
  flex-shrink: 0;
}

.detail-value {
  color: var(--color-text);
  font-weight: var(--font-medium);
}

.execution-status {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border-light);
  font-size: var(--text-sm);
}

.execution-status .success {
  color: #22543d;
}

.execution-status .error {
  color: #c53030;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.action-buttons .btn {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-lg);
}

.message-enter-active {
  animation: messageIn 0.3s ease-out;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
