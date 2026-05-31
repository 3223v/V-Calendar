<template>
  <div class="conversation-panel">
    <div class="panel-header">
      <h3 class="panel-title">语音助手</h3>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="currentSession && currentSession.messages.length === 0" class="empty-chat">
        <div class="empty-icon">🎙️</div>
        <p class="empty-text">开始语音或文字输入</p>
        <p class="empty-hint">描述您想要创建、删除或查询的事件</p>
      </div>

      <TransitionGroup name="message" tag="div" class="messages-list">
        <template v-for="msg in currentSession?.messages" :key="msg.id">
          <!-- User message -->
          <div
            v-if="msg.role === 'user'"
            class="message-bubble user"
          >
            <div v-if="msg.images && msg.images.length > 0" class="message-images">
              <img v-for="(img, idx) in msg.images" :key="idx" :src="img" class="msg-img" />
            </div>
            <div class="message-content">{{ msg.content }}</div>
          </div>

          <!-- System message -->
          <div
            v-else
            class="message-bubble system"
            :class="[msg.status || '']"
            @click="msg.opIds && msg.opIds.length > 0 && msg.status !== 'thinking' && !isResultStatus(msg.status) ? handleBubbleClick(msg) : undefined"
          >
            <div class="system-header">
              <span v-if="msg.status === 'thinking'" class="status-icon thinking">
                <span class="spinner-small"></span>
              </span>
              <span v-else-if="msg.status === 'executed'" class="status-icon executed">✓</span>
              <span v-else-if="msg.status === 'abandoned'" class="status-icon abandoned">✗</span>
              <span v-else-if="msg.status === 'error'" class="status-icon error">✗</span>
              <span v-else-if="msg.status === 'created'" class="status-icon created">✓</span>
              <span v-else-if="msg.status === 'rolled-back'" class="status-icon rolled-back">↩</span>
            </div>
            <div class="message-content" style="white-space: pre-line">{{ msg.content }}</div>
            <div v-if="shouldShowExpand(msg)" class="expand-hint">
              点击查看待执行操作
            </div>
          </div>
        </template>
      </TransitionGroup>
    </div>

    <VoiceInput />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { useConversationStore } from '../../stores/conversation.store'
import VoiceInput from './VoiceInput.vue'
import type { ConversationMessage } from '../../types/conversation'

const conversationStore = useConversationStore()
const currentSession = computed(() => conversationStore.currentSession)

const messagesContainer = ref<HTMLDivElement | null>(null)

function isResultStatus(status?: string): boolean {
  return status === 'created' || status === 'executed' || status === 'rolled-back' || status === 'error' || status === 'abandoned'
}

function shouldShowExpand(msg: ConversationMessage): boolean {
  if (!msg.opIds || msg.opIds.length === 0) return false
  if (msg.status === 'thinking') return false
  // Don't show expand for result messages (created/executed/rolled-back/error/abandoned)
  if (isResultStatus(msg.status)) return false
  return true
}

function handleBubbleClick(msg: ConversationMessage): void {
  if (msg.opIds) {
    conversationStore.setHighlightedOps(msg.opIds)
  }
}

watch(
  () => currentSession.value?.messages.length,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
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
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
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
  gap: var(--spacing-3);
}

.message-bubble {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  max-width: 85%;
}

.message-bubble.user {
  align-self: flex-end;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.message-bubble.system {
  align-self: flex-start;
  background-color: var(--color-surface-hover);
  color: var(--color-text);
  cursor: default;
}

.message-bubble.system.thinking {
  opacity: 0.8;
}

.message-bubble.system.executed {
  border-left: 3px solid #27ae60;
}

.message-bubble.system.created {
  border-left: 3px solid #27ae60;
}

.message-bubble.system.abandoned {
  border-left: 3px solid var(--color-text-light);
  opacity: 0.7;
}

.message-bubble.system.error {
  border-left: 3px solid #e74c3c;
}

.message-bubble.system.rolled-back {
  border-left: 3px solid #f39c12;
  opacity: 0.7;
}

.system-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.status-icon {
  font-size: var(--text-sm);
  font-weight: bold;
}

.status-icon.executed,
.status-icon.created {
  color: #27ae60;
}

.status-icon.abandoned {
  color: var(--color-text-light);
}

.status-icon.error {
  color: #e74c3c;
}

.status-icon.rolled-back {
  color: #f39c12;
}

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message-content {
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
}

.message-images {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-2);
}

.msg-img {
  max-width: 120px;
  max-height: 80px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.expand-hint {
  font-size: var(--text-xs);
  color: var(--color-primary);
  margin-top: var(--spacing-2);
  cursor: pointer;
}

.message-enter-active {
  transition: all var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1);
}

.message-leave-active {
  transition: all var(--transition-fast);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}

.message-leave-to {
  opacity: 0;
}
</style>
