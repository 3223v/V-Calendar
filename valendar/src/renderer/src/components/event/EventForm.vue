<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEdit ? '编辑事件' : '新建事件' }}</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <form @submit.prevent="handleSubmit" class="event-form">
        <div class="form-group">
          <label>标题 *</label>
          <input
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
            <input
              v-model="formData.startDate"
              type="date"
              class="input"
              required
            />
          </div>
          <div class="form-group">
            <label>结束日期 *</label>
            <input
              v-model="formData.endDate"
              type="date"
              class="input"
              required
            />
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
            <input
              v-model="formData.startTime"
              type="time"
              class="input"
            />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input
              v-model="formData.endTime"
              type="time"
              class="input"
            />
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
          <input
            v-model="formData.location"
            type="text"
            class="input"
            placeholder="输入地点"
          />
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

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="handleClose">
            取消
          </button>
          <button type="submit" class="btn btn-primary">
            {{ isEdit ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import type { CalendarEvent, EventInput, EventCategory } from '../../types';

const props = defineProps<{
  event?: CalendarEvent | null;
}>();

const emit = defineEmits<{
  (e: 'submit', event: EventInput): void;
  (e: 'close'): void;
}>();

const isEdit = computed(() => !!props.event);

const formData = ref({
  title: '',
  description: '',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  startTime: '',
  endTime: '',
  isAllDay: true,
  category: 'personal' as EventCategory,
  location: '',
  alarmBefore: 15
});

const alarmEnabled = ref(false);

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
    };
    alarmEnabled.value = props.event.alarm?.isEnabled || false;
  }
});

function handleSubmit(): void {
  const eventInput: EventInput = {
    title: formData.value.title,
    description: formData.value.description || undefined,
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    startTime: formData.value.isAllDay ? undefined : formData.value.startTime || undefined,
    endTime: formData.value.isAllDay ? undefined : formData.value.endTime || undefined,
    isAllDay: formData.value.isAllDay,
    category: formData.value.category,
    location: formData.value.location || undefined,
    alarm: alarmEnabled.value ? {
      id: props.event?.alarm?.id || '',
      before: formData.value.alarmBefore,
      isEnabled: true
    } : undefined
  };

  emit('submit', eventInput);
}

function handleClose(): void {
  emit('close');
}
</script>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  width: 32px;
  height: 32px;
  font-size: 24px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
}

.event-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.checkbox-group {
  flex-direction: row;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

textarea.input {
  resize: vertical;
  min-height: 80px;
}
</style>
