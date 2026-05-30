<template>
  <div class="conversation-panel">
    <div class="panel-header">
      <h3 class="panel-title">语音助手</h3>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="currentSession && currentSession.messages.length === 0" class="empty-chat">
        <div class="empty-icon">🎙️</div>
        <p class="empty-text">开始语音或文字输入</p>
        <p class="empty-hint">描述您想要创建的事件</p>
      </div>

      <TransitionGroup name="message" tag="div" class="messages-list">
        <div
          v-for="msg in currentSession?.messages"
          :key="msg.id"
          class="message-bubble"
          :class="[msg.role, msg.source]"
        >
          <div class="message-source">
            {{ sourceLabel(msg.source) }}
          </div>
          <div class="message-content">{{ msg.content }}</div>
        </div>
      </TransitionGroup>
    </div>

    <div class="processing-indicator" v-if="isProcessing">
      <div class="spinner"></div>
      <span>正在处理...</span>
    </div>

    <VoiceInput />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { useConversationStore } from '../../stores/conversation.store'
import VoiceInput from './VoiceInput.vue'

const conversationStore = useConversationStore()
const currentSession = computed(() => conversationStore.currentSession)
const isProcessing = computed(() => conversationStore.isProcessing)

const messagesContainer = ref<HTMLDivElement | null>(null)

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'voice-online': '语音',
    text: '文字'
  }
  return labels[source] || ''
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
}

.message-source {
  font-size: var(--text-xs);
  opacity: 0.7;
  margin-bottom: var(--spacing-1);
}

.message-content {
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
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

.processing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
