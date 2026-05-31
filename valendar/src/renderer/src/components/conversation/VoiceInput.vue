<template>
  <div class="voice-input">
    <div class="input-row">
      <button
        class="mic-btn"
        :class="{ listening: isListening }"
        :disabled="isProcessing"
        @click="toggleListening"
        :title="isListening ? '停止录音' : '开始录音'"
      >
        <svg
          v-if="!isListening"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        <div v-else class="listening-indicator">
          <span class="pulse-dot"></span>
        </div>
      </button>
      <textarea
        ref="inputRef"
        v-model="inputText"
        class="input"
        rows="1"
        :placeholder="
          isListening
            ? '正在录音...'
            : isProcessing
            ? '处理中...'
            : '输入指令或点击麦克风语音输入'
        "
        @input="onInputEdit"
        @keydown.enter.exact.prevent="handleSend"
        :disabled="isProcessing"
      />
      <span v-if="inputCountdown > 0 && transcribedText" class="countdown-badge">
        {{ inputCountdown }}s
      </span>
      <button
        v-if="inputCountdown > 0 && transcribedText"
        class="btn btn-ghost abandon-btn"
        @click="handleAbandon"
        title="放弃"
      >
        放弃
      </button>
      <button
        class="btn btn-primary send-btn"
        @click="handleSend"
        :disabled="!inputText.trim() || isProcessing || isListening"
      >
        {{ isProcessing ? '...' : '发送' }}
      </button>
    </div>
    <p v-if="speechError" class="speech-error">{{ speechError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useConversationStore } from '../../stores/conversation.store'

const conversationStore = useConversationStore()
const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const isListening = computed(() => conversationStore.isListening)
const isProcessing = computed(() => conversationStore.isProcessing)
const transcribedText = computed(() => conversationStore.transcribedText)
const speechError = computed(() => conversationStore.speechError)
const inputCountdown = computed(() => conversationStore.inputCountdown)

function autoResize(): void {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function insertTextAtCursor(text: string): void {
  const el = inputRef.value
  if (!el) {
    inputText.value += text
    return
  }

  const start = el.selectionStart || 0
  const end = el.selectionEnd || 0
  const before = inputText.value.substring(0, start)
  const after = inputText.value.substring(end)

  inputText.value = before + text + after

  nextTick(() => {
    const newPos = start + text.length
    el.selectionStart = newPos
    el.selectionEnd = newPos
    el.focus()
    autoResize()
  })
}

watch(transcribedText, (newText) => {
  if (newText) {
    insertTextAtCursor(newText)
    conversationStore.clearTranscribedText()
  }
})

watch(inputText, () => {
  nextTick(() => autoResize())
})

onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})

function onInputEdit(): void {
  if (conversationStore.inputCountdown > 0) {
    conversationStore.stopInputCountdown()
  }
}

async function toggleListening(): Promise<void> {
  if (isListening.value) {
    await conversationStore.stopListening()
  } else {
    inputText.value = ''
    await conversationStore.startListening()
  }
}

async function handleSend(): Promise<void> {
  const text = inputText.value.trim()
  if (!text || isProcessing.value || isListening.value) return

  conversationStore.stopInputCountdown()
  const textToSend = inputText.value.trim()
  inputText.value = ''
  await conversationStore.processTextInput(textToSend)
  inputRef.value?.focus()
}

function handleAbandon(): void {
  conversationStore.stopInputCountdown()
  inputText.value = ''
  conversationStore.clearTranscribedText()
  inputRef.value?.focus()
}
</script>

<style scoped>
.voice-input {
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--color-border-light);
  background-color: var(--color-surface);
  flex-shrink: 0;
}

.input-row {
  display: flex;
  gap: var(--spacing-3);
  align-items: flex-end;
}

.mic-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-border-light);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.mic-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.mic-btn.listening {
  border-color: #f56565;
  color: #f56565;
  background-color: #fff5f5;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 101, 101, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 101, 101, 0);
  }
}

.listening-indicator {
  width: 16px;
  height: 16px;
  position: relative;
}

.pulse-dot {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #f56565;
  border-radius: 50%;
  animation: bounce 1s infinite ease-in-out;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.7);
  }
  40% {
    transform: scale(1);
  }
}

.input {
  flex: 1;
  padding: var(--spacing-3);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
  resize: none;
  outline: none;
  transition: all var(--transition-fast);
  font-family: inherit;
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-focus);
}

.input::placeholder {
  color: var(--color-text-light);
}

.countdown-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
  background-color: var(--color-primary-focus);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
  animation: pulse-badge 1s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.abandon-btn {
  font-size: var(--text-xs);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.abandon-btn:hover {
  background-color: var(--color-surface-hover);
  color: #f56565;
  border-color: #f56565;
}

.send-btn {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  flex-shrink: 0;
}

.speech-error {
  margin-top: var(--spacing-2);
  font-size: var(--text-sm);
  color: #c53030;
  text-align: center;
}
</style>
