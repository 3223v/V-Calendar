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
        <select v-model="alarmBeforeSelect" class="input" @change="handleAlarmBeforeChange">
          <option :value="5">5 分钟</option>
          <option :value="10">10 分钟</option>
          <option :value="15">15 分钟</option>
          <option :value="30">30 分钟</option>
          <option :value="60">1 小时</option>
          <option :value="120">2 小时</option>
          <option :value="1440">1 天</option>
          <option :value="-1">自定义</option>
        </select>
        <input
          v-if="alarmBeforeSelect === -1"
          v-model.number="customAlarmMinutes"
          type="number"
          min="1"
          class="input"
          style="margin-top: var(--spacing-2)"
          placeholder="输入分钟数"
        />
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input v-model="repeatEnabled" type="checkbox" />
          <span>设置重复</span>
        </label>
      </div>

      <div v-if="repeatEnabled" class="repeat-section">
        <div class="form-group">
          <label>重复频率</label>
          <select v-model="formData.repeatFrequency" class="input">
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
            <option value="yearly">每年</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div v-if="formData.repeatFrequency === 'custom'" class="form-group" style="margin-top: var(--spacing-3)">
          <label>每隔多少天重复</label>
          <input v-model.number="formData.repeatInterval" type="number" min="1" class="input" placeholder="天数" />
        </div>

        <div v-if="formData.repeatFrequency === 'weekly'" class="form-group" style="margin-top: var(--spacing-3)">
          <label>重复日</label>
          <div class="weekday-checks">
            <label v-for="(day, idx) in weekdayLabels" :key="idx" class="weekday-check">
              <input type="checkbox" :value="idx" v-model="formData.repeatWeekdays" />
              <span>{{ day }}</span>
            </label>
          </div>
        </div>

        <div v-if="formData.repeatFrequency === 'monthly'" class="form-group" style="margin-top: var(--spacing-3)">
          <label>每月几号</label>
          <input v-model.number="formData.repeatMonthDay" type="number" min="1" max="31" class="input" placeholder="日期" />
        </div>

        <div class="form-group" style="margin-top: var(--spacing-3)">
          <label>结束条件</label>
          <select v-model="repeatEndType" class="input">
            <option value="never">永不结束</option>
            <option value="date">到指定日期</option>
            <option value="count">重复指定次数</option>
          </select>
        </div>

        <div v-if="repeatEndType === 'date'" class="form-group" style="margin-top: var(--spacing-3)">
          <label>结束日期</label>
          <input v-model="formData.repeatEndDate" type="date" class="input" />
        </div>

        <div v-if="repeatEndType === 'count'" class="form-group" style="margin-top: var(--spacing-3)">
          <label>重复次数</label>
          <input v-model.number="formData.repeatCount" type="number" min="1" class="input" placeholder="次数" />
        </div>
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
import type { CalendarEvent, EventInput, EventCategory, RepeatRule } from '../../types'
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
  alarmBefore: 15,
  repeatFrequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  repeatInterval: 1,
  repeatEndDate: '',
  repeatCount: 0,
  repeatWeekdays: [] as number[],
  repeatMonthDay: 0
})

const alarmEnabled = ref(false)
const alarmBeforeSelect = ref(15)
const customAlarmMinutes = ref(15)
const repeatEnabled = ref(false)
const repeatEndType = ref<'never' | 'date' | 'count'>('never')
const defaultAlarmOptions = [5, 10, 15, 30, 60, 120, 1440]
const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

function handleAlarmBeforeChange(): void {
  if (alarmBeforeSelect.value !== -1) {
    formData.value.alarmBefore = alarmBeforeSelect.value
  }
}

onMounted(() => {
  if (props.event) {
    const before = props.event.alarm?.before || 15
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
      alarmBefore: before,
      repeatFrequency: props.event.repeat?.frequency || 'daily',
      repeatInterval: props.event.repeat?.interval || 1,
      repeatEndDate: props.event.repeat?.endDate || '',
      repeatCount: props.event.repeat?.count || 0,
      repeatWeekdays: props.event.repeat?.weekdays || [],
      repeatMonthDay: props.event.repeat?.monthDay || 0
    }
    alarmEnabled.value = props.event.alarm?.isEnabled || false
    alarmBeforeSelect.value = defaultAlarmOptions.includes(before) ? before : -1
    if (alarmBeforeSelect.value === -1) {
      customAlarmMinutes.value = before
    }
    repeatEnabled.value = !!props.event.repeat
    if (props.event.repeat?.endDate) {
      repeatEndType.value = 'date'
    } else if (props.event.repeat?.count) {
      repeatEndType.value = 'count'
    } else {
      repeatEndType.value = 'never'
    }
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

  const alarmBeforeValue = alarmBeforeSelect.value === -1
    ? customAlarmMinutes.value
    : formData.value.alarmBefore

  let repeatRule: RepeatRule | undefined
  if (repeatEnabled.value) {
    repeatRule = {
      frequency: formData.value.repeatFrequency === 'custom' ? 'daily' : formData.value.repeatFrequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
      interval: formData.value.repeatFrequency === 'custom' ? formData.value.repeatInterval : 1
    }
    if (formData.value.repeatFrequency === 'weekly' && formData.value.repeatWeekdays.length > 0) {
      repeatRule.weekdays = formData.value.repeatWeekdays
    }
    if (formData.value.repeatFrequency === 'monthly' && formData.value.repeatMonthDay > 0) {
      repeatRule.monthDay = formData.value.repeatMonthDay
    }
    if (repeatEndType.value === 'date' && formData.value.repeatEndDate) {
      repeatRule.endDate = formData.value.repeatEndDate
    }
    if (repeatEndType.value === 'count' && formData.value.repeatCount > 0) {
      repeatRule.count = formData.value.repeatCount
    }
  }

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
    repeat: repeatRule,
    alarm: alarmEnabled.value
      ? {
          id: props.event?.alarm?.id || '',
          before: alarmBeforeValue,
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

.repeat-section {
  padding: var(--spacing-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
}

.weekday-checks {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.weekday-check {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.weekday-check:has(input:checked) {
  background-color: var(--color-primary-focus);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.weekday-check input {
  width: 14px;
  height: 14px;
  accent-color: var(--color-primary);
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
