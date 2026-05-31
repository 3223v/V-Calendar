<template>
  <div class="settings-page">
    <div class="settings-container">
      <h2 class="settings-title">设置</h2>

      <!-- General Settings -->
      <section class="settings-section">
        <h3 class="section-title">通用</h3>
        <div class="form-row">
          <div class="form-group">
            <label>语言</label>
            <select v-model="localSettings.language" class="input" @change="handleSave">
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div class="form-group">
            <label>主题</label>
            <select v-model="localSettings.theme" class="input" @change="handleSave">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="system">跟随系统</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>每周起始日</label>
            <select v-model="localSettings.weekStartDay" class="input" @change="handleSave">
              <option :value="0">周日</option>
              <option :value="1">周一</option>
            </select>
          </div>
          <div class="form-group">
            <label>默认视图</label>
            <select v-model="localSettings.defaultView" class="input" @change="handleSave">
              <option value="month">月视图</option>
              <option value="week">周视图</option>
              <option value="day">日视图</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Display Settings -->
      <section class="settings-section">
        <h3 class="section-title">显示</h3>
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="localSettings.showLunar" type="checkbox" @change="handleSave" />
            <span>显示农历</span>
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="localSettings.showHoliday" type="checkbox" @change="handleSave" />
            <span>显示节假日</span>
          </label>
        </div>
      </section>

      <!-- Alarm Settings -->
      <section class="settings-section">
        <h3 class="section-title">提醒</h3>
        <div class="form-row">
          <div class="form-group">
            <label>提醒音量</label>
            <input
              v-model.number="localSettings.alarmVolume"
              type="range"
              min="0"
              max="100"
              class="input-range"
              @change="handleSave"
            />
            <span class="range-value">{{ localSettings.alarmVolume }}%</span>
          </div>
          <div class="form-group">
            <label>延迟提醒（分钟）</label>
            <div class="input-with-suffix">
              <input
                v-model.number="localSettings.snoozeMinutes"
                type="number"
                min="1"
                max="120"
                class="input"
                @change="handleSave"
              />
              <span class="input-suffix">分钟</span>
            </div>
          </div>
        </div>
      </section>

      <!-- NLU Settings -->
      <section class="settings-section">
        <h3 class="section-title">NLU 系统</h3>
        <div class="form-group">
          <label>API 地址</label>
          <input
            v-model="localSettings.aiApiUrl"
            type="text"
            class="input"
            placeholder="https://api.openai.com/v1"
            @blur="handleSave"
          />
          <p class="form-hint">OpenAI 兼容接口地址，如智谱、DeepSeek、月之暗面等</p>
        </div>
        <div class="form-group" style="margin-top: var(--spacing-3)">
          <label>API Key</label>
          <input
            v-model="localSettings.aiApiKey"
            type="password"
            class="input"
            placeholder="sk-..."
            @blur="handleSave"
          />
        </div>
        <div class="form-group" style="margin-top: var(--spacing-3)">
          <label>模型名称</label>
          <input
            v-model="localSettings.aiModel"
            type="text"
            class="input"
            placeholder="gpt-4o"
            @blur="handleSave"
          />
        </div>
      </section>

      <!-- Conversation Settings -->
      <section class="settings-section">
        <h3 class="section-title">对话</h3>
        <div class="form-row">
          <div class="form-group">
            <label>自动执行倒计时（秒）</label>
            <select v-model="localSettings.crudCountdown" class="input" @change="handleSave">
              <option :value="3">3 秒</option>
              <option :value="5">5 秒</option>
              <option :value="10">10 秒</option>
              <option :value="15">15 秒</option>
              <option :value="30">30 秒</option>
            </select>
          </div>
          <div class="form-group">
            <label>默认执行策略</label>
            <select v-model="localSettings.crudAutoExecute" class="input" @change="handleSave">
              <option value="best">自动执行最高置信度方案</option>
              <option value="manual">手动选择后执行</option>
              <option value="abandon">超时自动放弃</option>
            </select>
          </div>
        </div>
      </section>

      <!-- ASR Settings -->
      <section class="settings-section">
        <h3 class="section-title">语音识别</h3>
        <div class="form-group">
          <label>智谱 API Key（在线，可选）</label>
          <input
            v-model="localSettings.asrOnlineKey"
            type="password"
            class="input"
            placeholder="输入智谱 API Key"
            @blur="handleSave"
          />
          <p class="form-hint">
            使用 GLM-ASR-2512，需
            <a href="https://open.bigmodel.cn/" target="_blank">注册智谱开放平台</a>
            获取 API Key
          </p>
        </div>
      </section>

      <div v-if="saveMessage" class="save-toast" :class="saveMessageType">
        {{ saveMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useSettingsStore } from '../../stores/settings.store'
import { onlineASR } from '../../services/asr/online-asr'
import { nluManager } from '../../services/nlu/nlu-manager'
import { createLogger } from '../../utils/logger'

const log = createLogger('SettingsPage')

const settingsStore = useSettingsStore()
const saveMessage = ref('')
const saveMessageType = ref<'success' | 'error'>('success')

interface LocalSettings {
  language: string
  theme: string
  weekStartDay: number
  defaultView: string
  showLunar: boolean
  showHoliday: boolean
  alarmVolume: number
  snoozeMinutes: number
  aiApiUrl: string
  aiApiKey: string
  aiModel: string
  crudCountdown: number
  crudAutoExecute: string
  asrOnlineKey: string
}

const localSettings = reactive<LocalSettings>({
  language: 'zh-CN',
  theme: 'system',
  weekStartDay: 0,
  defaultView: 'month',
  showLunar: true,
  showHoliday: true,
  alarmVolume: 80,
  snoozeMinutes: 5,
  aiApiUrl: 'https://api.deepseek.com',
  aiApiKey: 'sk-1362e0bb054d48c288e6a70cff613c19',
  aiModel: 'deepseek-v4-pro',
  crudCountdown: 10,
  crudAutoExecute: 'best',
  asrOnlineKey: '9b36f0044c8a4d2eb486e3b037749361.3oTwpnahTWQvSp4w'
})

onMounted(async () => {
  await settingsStore.fetchSettings()
  const s = settingsStore.settings
  localSettings.language = s.language
  localSettings.theme = s.theme
  localSettings.weekStartDay = s.weekStartDay
  localSettings.defaultView = s.defaultView
  localSettings.showLunar = s.showLunar
  localSettings.showHoliday = s.showHoliday
  localSettings.alarmVolume = s.alarmVolume
  localSettings.snoozeMinutes = s.snoozeMinutes
  localSettings.aiApiUrl = s.aiBaseUrl || 'https://api.deepseek.com'
  localSettings.aiApiKey = s.aiApiKey || 'sk-1362e0bb054d48c288e6a70cff613c19'
  localSettings.aiModel = s.aiModel || 'deepseek-v4-pro'
  localSettings.crudCountdown = s.crudCountdown || 10
  localSettings.crudAutoExecute = s.crudAutoExecute || 'best'
  localSettings.asrOnlineKey = s.asrOnlineKey || '9b36f0044c8a4d2eb486e3b037749361.3oTwpnahTWQvSp4w'
})

let saveTimeout: ReturnType<typeof setTimeout> | null = null

async function handleSave(): Promise<void> {
  try {
    await settingsStore.updateSettings({
      language: localSettings.language as 'zh-CN' | 'en-US',
      theme: localSettings.theme as 'light' | 'dark' | 'system',
      weekStartDay: localSettings.weekStartDay as 0 | 1,
      defaultView: localSettings.defaultView as 'month' | 'week' | 'day',
      showLunar: localSettings.showLunar,
      showHoliday: localSettings.showHoliday,
      alarmVolume: localSettings.alarmVolume,
      snoozeMinutes: localSettings.snoozeMinutes,
      aiBaseUrl: localSettings.aiApiUrl || undefined,
      aiApiKey: localSettings.aiApiKey || undefined,
      aiModel: localSettings.aiModel || undefined,
      crudCountdown: localSettings.crudCountdown,
      crudAutoExecute: localSettings.crudAutoExecute,
      asrOnlineKey: localSettings.asrOnlineKey || undefined
    })

    // Update online ASR engine at runtime (no restart needed)
    onlineASR.configure(localSettings.asrOnlineKey || '9b36f0044c8a4d2eb486e3b037749361.3oTwpnahTWQvSp4w')

    // Update NLU engine at runtime (no restart needed)
    nluManager.configure(
      localSettings.aiApiUrl || 'https://api.deepseek.com',
      localSettings.aiApiKey || 'sk-1362e0bb054d48c288e6a70cff613c19',
      localSettings.aiModel || 'deepseek-v4-pro'
    )

    settingsStore.applyTheme(localSettings.theme as 'light' | 'dark' | 'system')
    showSaveMessage('设置已保存', 'success')
  } catch (err) {
    log.error('Save settings error:', err)
    showSaveMessage('保存失败', 'error')
  }
}

function showSaveMessage(msg: string, type: 'success' | 'error'): void {
  saveMessage.value = msg
  saveMessageType.value = type
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveMessage.value = ''
  }, 2000)
}
</script>

<style scoped>
.settings-page {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-6);
  display: flex;
  justify-content: center;
}

.settings-container {
  max-width: 640px;
  width: 100%;
}

.settings-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  margin-bottom: var(--spacing-6);
  letter-spacing: -0.02em;
}

.settings-section {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  padding: var(--spacing-5) var(--spacing-6);
  margin-bottom: var(--spacing-4);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-border-light);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  flex: 1;
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-3);
}

.checkbox-group {
  flex-direction: row;
  margin-bottom: var(--spacing-3);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  width: 100%;
}

.checkbox-label:hover {
  border-color: var(--color-primary);
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

.input {
  width: 100%;
  padding: var(--spacing-2\.5) var(--spacing-3\.5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: var(--text-md);
  transition: all var(--transition-fast);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-focus);
  outline: none;
}

select.input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237F8C8D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--spacing-3) center;
  padding-right: var(--spacing-8);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-text-light);
  margin-top: var(--spacing-1);
}

.form-hint a {
  color: var(--color-primary);
  text-decoration: underline;
}

.input-range {
  width: 100%;
  accent-color: var(--color-primary);
}

.range-value {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  text-align: center;
}

.input-with-suffix {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.input-with-suffix .input {
  width: 80px;
}

.input-suffix {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.save-toast {
  position: fixed;
  bottom: var(--spacing-6);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-lg);
  font-size: var(--text-md);
  font-weight: var(--font-medium);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: toast-in var(--transition-base) ease-out;
}

.save-toast.success {
  background-color: #27ae60;
  color: white;
}

.save-toast.error {
  background-color: #e74c3c;
  color: white;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
