<template>
  <ModalBox :title="isEdit ? '编辑事件' : '新建事件'" @close="handleClose">
    <form @submit.prevent="handleSubmit" class="event-form">
      <div class="form-group">
        <label>标题 *</label>
        <input
          ref="titleInputRef"
          v-model="formData.title"
          type="text"
          class="input"
          required
          placeholder="输入事件标题"
        />
      </div>

      <div class="form-group">
        <label>描述</label>
        <textarea
          v-model="formData.description"
          class="input"
          rows="3"
          placeholder="输入事件描述"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>开始日期 *</label>
          <input v-model="formData.startDate" type="date" class="input" required />
        </div>
        <div class="form-group">
          <label>结束日期 *</label>
          <input v-model="formData.endDate" type="date" class="input" required />
        </div>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input v-model="formData.isAllDay" type="checkbox" />
          <span>全天事件</span>
        </label>
      </div>

      <div v-if="!formData.isAllDay" class="form-row">
        <div class="form-group">
          <label>开始时间</label>
          <input v-model="formData.startTime" type="time" class="input" />
        </div>
        <div class="form-group">
          <label>结束时间</label>
          <input v-model="formData.endTime" type="time" class="input" />
        </div>
      </div>

      <div class="form-group">
        <label>分类</label>
        <select v-model="formData.category" class="input">
          <option value="work">工作</option>
          <option value="personal">个人</option>
          <option value="important">重要</option>
          <option value="holiday">节假日</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div class="form-group">
        <label>地点</label>
        <input v-model="formData.location" type="text" class="input" placeholder="输入地点" />
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input v-model="alarmEnabled" type="checkbox" />
          <span>设置提醒</span>
        </label>
      </div>

      <div v-if="alarmEnabled" class="form-group">
        <label>提前提醒</label>
        <select v-model="formData.alarmBefore" class="input">
          <option :value="5">5 分钟</option>
          <option :value="10">10 分钟</option>
          <option :value="15">15 分钟</option>
          <option :value="30">30 分钟</option>
          <option :value="60">1 小时</option>
          <option :value="120">2 小时</option>
          <option :value="1440">1 天</option>
        </select>
      </div>

      <div v-if="submitError" class="form-error">{{ submitError }}</div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="handleClose">取消</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '保存中...' : isEdit ? '保存' : '创建' }}
        </button>
      </div>
    </form>
  </ModalBox>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import type { CalendarEvent, EventInput, EventCategory } from '../../types'
import { useEventStore } from '../../stores/event.store'
import { createLogger } from '../../utils/logger'
import ModalBox from '../common/ModalBox.vue'

const log = createLogger('EventForm')

const props = defineProps<{
  event?: CalendarEvent | null
  defaultDate?: string
  defaultStartTime?: string
  defaultEndTime?: string
}>()

const emit = defineEmits<{
  (e: 'submit', event: EventInput): void
  (e: 'close'): void
}>()

const eventStore = useEventStore()
const isEdit = computed(() => !!props.event)
const submitError = ref('')
const submitting = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)

const formData = ref({
  title: '',
  description: '',
  startDate: props.defaultDate || dayjs().format('YYYY-MM-DD'),
  endDate: props.defaultDate || dayjs().format('YYYY-MM-DD'),
  startTime: props.defaultStartTime || '',
  endTime: props.defaultEndTime || '',
  isAllDay: !props.defaultStartTime,
  category: 'personal' as EventCategory,
  location: '',
  alarmBefore: 15
})

const alarmEnabled = ref(false)

onMounted(() => {
  if (props.event) {
    formData.value = {
      title: props.event.title,
      description: props.event.description || '',
      startDate: props.event.startDate,
      endDate: props.event.endDate,
      startTime: props.event.startTime || '',
      endTime: props.event.endTime || '',
      isAllDay: props.event.isAllDay,
      category: props.event.category,
      location: props.event.location || '',
      alarmBefore: props.event.alarm?.before || 15
    }
    alarmEnabled.value = props.event.alarm?.isEnabled || false
  }
  focusTitleInput()
})

async function focusTitleInput(): Promise<void> {
  await nextTick()
  if (titleInputRef.value) {
    titleInputRef.value.focus()
    log.debug('Title input focused')
  }
}

function handleSubmit(): void {
  log.info('handleSubmit called')
  submitError.value = ''

  if (!formData.value.title.trim()) {
    submitError.value = '请输入事件标题'
    focusTitleInput()
    return
  }

  if (!formData.value.startDate || !formData.value.endDate) {
    submitError.value = '请选择开始和结束日期'
    return
  }

  submitting.value = true

  const eventInput: EventInput = {
    title: formData.value.title.trim(),
    description: formData.value.description || undefined,
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    startTime: formData.value.isAllDay ? undefined : formData.value.startTime || undefined,
    endTime: formData.value.isAllDay ? undefined : formData.value.endTime || undefined,
    isAllDay: formData.value.isAllDay,
    category: formData.value.category,
    location: formData.value.location || undefined,
    alarm: alarmEnabled.value
      ? {
          id: props.event?.alarm?.id || '',
          before: formData.value.alarmBefore,
          isEnabled: true
        }
      : undefined
  }

  log.info('Emitting submit:', eventInput.title)
  emit('submit', eventInput)
}

watch(
  () => eventStore.error,
  (newError) => {
    if (newError) {
      log.error('Store error:', newError)
      submitError.value = newError
      submitting.value = false
    }
  }
)

watch(
  () => eventStore.loading,
  (isLoading) => {
    if (!isLoading) {
      submitting.value = false
    }
  }
)

function handleClose(): void {
  emit('close')
}
</script>

<style scoped>
.event-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-group label {
  font-size: var(--text-md);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.checkbox-group {
  flex-direction: row;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.checkbox-label:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary-focus);
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label span {
  font-size: var(--text-md);
  font-weight: var(--font-medium);
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.form-actions .btn {
  min-width: 100px;
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--text-md);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-lg);
}

.form-actions .btn-primary {
  box-shadow: var(--shadow-md);
}

.form-actions .btn-primary:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.form-actions .btn-secondary {
  background-color: transparent;
  border: 1px solid var(--color-border);
}

.form-actions .btn-secondary:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-text-light);
}

.form-error {
  padding: var(--spacing-3) var(--spacing-4);
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-lg);
  color: #dc2626;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

textarea.input {
  resize: vertical;
  min-height: 80px;
  line-height: var(--leading-relaxed);
}

.form-group .input {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  transition: all var(--transition-base);
  border: 1.5px solid var(--color-border);
}

.form-group .input:hover {
  border-color: var(--color-text-light);
  box-shadow: var(--shadow-xs);
}

.form-group .input:focus {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 3px var(--color-primary-focus),
    var(--shadow-sm);
  transform: translateY(-1px);
}

.form-group .input::placeholder {
  color: var(--color-text-light);
  font-weight: var(--font-normal);
}

.form-group select.input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237F8C8D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--spacing-3) center;
  padding-right: var(--spacing-10);
}
</style>
