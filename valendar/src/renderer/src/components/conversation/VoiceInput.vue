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
      <span v-if="inputCountdown > 0" class="countdown-badge">
        {{ inputCountdown }}s
      </span>
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

// When ASR transcription arrives, fill the input box
watch(transcribedText, (newText) => {
  if (newText) {
    inputText.value = newText
    nextTick(() => autoResize())
  }
})

watch(inputText, () => {
  nextTick(() => autoResize())
})

onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})

function onInputEdit(): void {
  // User is editing — cancel the auto-send countdown
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
  const value = inputText.value.trim()
  if (!value || isProcessing.value || isListening.value) return

  conversationStore.stopInputCountdown()
  inputText.value = ''
  await conversationStore.processTextInput(value)
  inputRef.value?.focus()
}
</script>

<style scoped>
.voice-input {
  padding: var(--spacing-4);
}

.input-row {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.mic-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background-color: var(--color-surface-hover);
  border: 2px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mic-btn:hover {
  background-color: var(--color-surface-active);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.mic-btn.listening {
  background-color: #e74c3c;
  border-color: #e74c3c;
  color: white;
  animation: pulse-ring 1.5s ease-in-out infinite;
}

.mic-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.listening-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background-color: currentColor;
  border-radius: var(--radius-full);
  animation: pulse-scale 1s ease-in-out infinite;
}

@keyframes pulse-scale {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.5;
  }
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
  }
}

.input-row .input {
  flex: 1;
  padding: var(--spacing-2\.5) var(--spacing-3\.5);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-md);
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  min-height: 42px;
  max-height: 120px;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.input-row .input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-focus);
  outline: none;
}

.input-row .input::placeholder {
  color: var(--color-text-light);
}

.input-row .input:disabled {
  opacity: 0.7;
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
  50% { opacity: 0.6; }
}

.send-btn {
  border-radius: var(--radius-lg);
  padding: var(--spacing-2\.5) var(--spacing-5);
  font-weight: var(--font-medium);
  white-space: nowrap;
  flex-shrink: 0;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speech-error {
  margin-top: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: #dc2626;
  font-size: var(--text-sm);
}
</style>
