<template>
  <div class="voice-input">
    <div class="input-area">
      <div class="input-row">
        <button
          class="image-btn"
          :class="{ disabled: !supportsImages }"
          :disabled="!supportsImages"
          @click="triggerImageUpload"
          :title="supportsImages ? '上传图片' : '当前模型不支持图片'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          multiple
          hidden
          @change="handleImageUpload"
        />
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="input"
          rows="2"
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
      </div>
      <div v-if="pendingImages.length > 0" class="image-preview">
        <div v-for="(img, idx) in pendingImages" :key="idx" class="image-thumb">
          <img :src="img" alt="upload" />
          <button class="remove-btn" @click="removeImage(idx)">×</button>
        </div>
      </div>
      <div class="action-row">
        <div class="action-left">
          <span v-if="inputCountdown > 0" class="countdown-badge">
            {{ inputCountdown }}s 后发送
          </span>
          <button
            v-if="inputCountdown > 0"
            class="btn btn-secondary giveup-btn"
            @click="handleGiveUp"
          >
            放弃
          </button>
        </div>
        <div class="action-right">
          <button
            class="icon-btn mic-btn"
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
          <button
            class="icon-btn send-btn"
            @click="handleSend"
            :disabled="(!inputText.trim() && pendingImages.length === 0) || isProcessing || isListening"
            title="发送"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
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
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingImages = ref<string[]>([])
const isListening = computed(() => conversationStore.isListening)
const isProcessing = computed(() => conversationStore.isProcessing)
const transcribedText = computed(() => conversationStore.transcribedText)
const speechError = computed(() => conversationStore.speechError)
const inputCountdown = computed(() => conversationStore.inputCountdown)
const supportsImages = computed(() => conversationStore.supportsImages)

function autoResize(): void {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

// When ASR transcription arrives, insert at cursor position
watch(transcribedText, (newText) => {
  if (newText) {
    const el = inputRef.value
    if (el) {
      const start = el.selectionStart
      const end = el.selectionEnd
      const before = inputText.value.substring(0, start)
      const after = inputText.value.substring(end)
      inputText.value = before + newText + after
      nextTick(() => {
        autoResize()
        const newPos = start + newText.length
        el.setSelectionRange(newPos, newPos)
      })
    } else {
      inputText.value = newText
      nextTick(() => autoResize())
    }
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
    pendingImages.value = []
    await conversationStore.startListening()
  }
}

function triggerImageUpload(): void {
  if (!supportsImages.value) return
  fileInputRef.value?.click()
}

function handleImageUpload(event: Event): void {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        pendingImages.value.push(result)
      }
    }
    reader.readAsDataURL(file)
  }
  // Reset file input
  target.value = ''
}

function removeImage(idx: number): void {
  pendingImages.value.splice(idx, 1)
}

function handleGiveUp(): void {
  conversationStore.cancelInputCountdown()
  inputText.value = ''
  pendingImages.value = []
}

async function handleSend(): Promise<void> {
  const value = inputText.value.trim()
  if ((!value && pendingImages.value.length === 0) || isProcessing.value || isListening.value) return

  conversationStore.stopInputCountdown()
  const images = pendingImages.value.length > 0 ? [...pendingImages.value] : undefined
  inputText.value = ''
  pendingImages.value = []
  await conversationStore.processTextInput(value, images)
  inputRef.value?.focus()
}
</script>

<style scoped>
.voice-input {
  padding: var(--spacing-4);
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.input-row {
  display: flex;
  gap: var(--spacing-2);
  align-items: flex-start;
}

.image-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-hover);
  border: 1.5px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 3px;
}

.image-btn:hover:not(.disabled) {
  background-color: var(--color-surface-active);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.image-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  color: var(--color-text-light);
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
  min-height: 60px;
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

.image-preview {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  padding: 0 var(--spacing-1);
}

.image-thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 18px;
  height: 18px;
  border-radius: 0 0 0 var(--radius-md);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.action-right {
  display: flex;
  gap: var(--spacing-2);
}

.icon-btn {
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

.icon-btn:hover {
  background-color: var(--color-surface-active);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mic-btn.listening {
  background-color: #e74c3c;
  border-color: #e74c3c;
  color: white;
  animation: pulse-ring 1.5s ease-in-out infinite;
}

.send-btn:hover:not(:disabled) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
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
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
  100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
}

.countdown-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
  background-color: var(--color-primary-focus);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  animation: pulse-badge 1s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.giveup-btn {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-full);
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.giveup-btn:hover {
  background-color: #fef2f2;
  border-color: #e74c3c;
  color: #e74c3c;
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
