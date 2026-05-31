# 语音识别（ASR）系统

## 概述

V-Calendar 使用**智谱 GLM-ASR-2512** 模型实现语音转文字功能。用户可以通过麦克风输入语音，系统自动将语音转换为文本，然后交由 NLU 系统进行自然语言理解。

## API 详情

### 端点信息

- **API 地址**：`https://open.bigmodel.cn/api/paas/v4/audio/transcriptions`
- **模型**：`glm-asr-2512`
- **认证方式**：Bearer Token

### 请求格式

```bash
curl --request POST \
  --url https://open.bigmodel.cn/api/paas/v4/audio/transcriptions \
  --header 'Authorization: Bearer {API_KEY}' \
  --header 'Content-Type: multipart/form-data' \
  --form model=glm-asr-2512 \
  --form stream=false \
  --form file=@audio.wav
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 音频文件，支持 `.wav` / `.mp3` 格式，文件大小 ≤ 25MB，时长 ≤ 30秒 |
| model | string | 是 | 模型名称，固定为 `glm-asr-2512` |
| file_base64 | string | 否 | 音频文件 Base64 编码（与 file 二选一） |
| prompt | string | 否 | 上下文提示，用于长文本场景，建议小于8000字 |
| hotwords | string[] | 否 | 热词表，提升特定领域词汇识别率，如 `["开会","出差"]` |
| stream | boolean | 否 | 是否流式返回，设为 `false` 表示一次性返回，默认 `false` |
| request_id | string | 否 | 请求唯一标识符，建议使用 UUID 格式 |
| user_id | string | 否 | 终端用户 ID，用于行为监控 |

### 响应格式

**成功响应：**
```json
{
  "id": "<string>",
  "created": 1234567890,
  "request_id": "<string>",
  "model": "glm-asr-2512",
  "text": "明天下午三点开会"
}
```

**错误响应：**
```json
{"error":{"code":"1214","message":"file和audio参数不能同时为空"}}
```

## 本地实现

### 文件结构

```
valendar/src/renderer/src/services/asr/
├── asr.interface.ts        # ASR 接口定义
├── online-asr.ts          # ASR 管理器
└── glm-asr.ts            # 智谱 ASR 实现
```

### 核心接口

```typescript
interface ASREngine {
  readonly name: string
  configure(apiKey: string): void
  isAvailable(): boolean
  transcribe(audioBlob: Blob): Promise<ASRResult>
}

interface ASRResult {
  text: string           // 转写文本
  duration?: number     // 音频时长（秒）
  language?: string      // 检测到的语言
}
```

### 实现流程

#### 1. 音频录制

使用 Web Audio API 和 MediaRecorder 进行实时录音：

```typescript
async function startRecording(): Promise<void> {
  // 获取麦克风权限
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,      // 回声消除
      noiseSuppression: true,      // 降噪
      channelCount: 1,             // 单声道
      sampleRate: 16000            // 采样率
    }
  })

  // 创建 MediaRecorder
  const recorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm'         // 或 audio/ogg
  })

  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) {
      audioChunks.push(e.data)
    }
  }

  recorder.start()
}
```

#### 2. 音频格式转换

智谱 ASR 要求音频格式为 WAV (16kHz, 单声道)，需要转换：

```typescript
async function convertToWav(webmBlob: Blob): Promise<Blob> {
  const arrayBuffer = await webmBlob.arrayBuffer()
  const audioContext = new AudioContext({ sampleRate: 16000 })

  // 解码 WebM 音频
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // 编码为 WAV
  const wavBuffer = audioBufferToWav(audioBuffer)

  return new Blob([wavBuffer], { type: 'audio/wav' })
}
```

#### 3. API 调用

```typescript
async function transcribe(audioBlob: Blob): Promise<ASRResult> {
  const formData = new FormData()
  formData.append('model', 'glm-asr-2512')
  formData.append('stream', 'false')
  formData.append('file', audioBlob, 'audio.wav')

  const response = await fetch(ASR_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`
    },
    body: formData
  })

  const data = await response.json()

  return {
    text: data.text,
    duration: audioBlob.size / (16000 * 2)  // 估算时长
  }
}
```

## 使用配置

### 获取 API Key

1. 访问 [智谱开放平台](https://open.bigmodel.cn/)
2. 注册账号并登录
3. 进入控制台 → API Keys
4. 创建新 API Key 或使用现有 Key

### 配置方式

用户可在应用的**设置页面 → 语音识别**中配置 API Key：

```typescript
// 在设置中保存
settingsStore.updateSettings({
  asrOnlineKey: 'your-api-key'
})

// 在应用中加载配置
onlineASR.configure(settings.asrOnlineKey)
```

### 可用性检查

```typescript
async function checkAvailability(): Promise<boolean> {
  if (!onlineASR.isAvailable()) {
    console.warn('ASR not configured')
    return false
  }

  // 可选：发送测试请求验证 Key 有效性
  try {
    const result = await onlineASR.transcribe(testBlob)
    return result.text.length > 0
  } catch (error) {
    console.error('ASR test failed:', error)
    return false
  }
}
```

## 最佳实践

### 音频质量优化

1. **采样率**：使用 16kHz 采样率（智谱 ASR 标准要求）
2. **声道**：单声道录制，减少数据量
3. **降噪**：启用回声消除和降噪，提升识别准确率
4. **时长限制**：每次录音建议不超过 30 秒

### 错误处理

```typescript
try {
  const result = await onlineASR.transcribe(audioBlob)
  if (!result.text) {
    throw new Error('未能识别语音内容')
  }
  return result.text
} catch (error) {
  if (error.message.includes('401')) {
    throw new Error('API Key 无效，请检查配置')
  } else if (error.message.includes('413')) {
    throw new Error('音频文件过大，请缩短录音时长')
  } else {
    throw new Error(`语音识别失败：${error.message}`)
  }
}
```

### 热词配置

对于特定领域的词汇，可以配置热词提升识别率：

```typescript
async function transcribeWithHotwords(audioBlob: Blob): Promise<ASRResult> {
  const hotwords = ['开会', '出差', '面试', '汇报', '周会', '月度总结']

  const formData = new FormData()
  formData.append('model', 'glm-asr-2512')
  formData.append('stream', 'false')
  formData.append('file', audioBlob, 'audio.wav')
  formData.append('hotwords', JSON.stringify(hotwords))

  // ... 发送请求
}
```

## 限制与注意事项

1. **音频时长**：单次请求音频时长 ≤ 30秒
2. **文件大小**：文件大小 ≤ 25MB
3. **格式支持**：仅支持 WAV 和 MP3 格式
4. **免费额度**：智谱提供免费调用额度，超出后需付费
5. **隐私注意**：音频数据会上传到智谱服务器处理

## 更新日志

- **2024-01**：初始版本，支持 GLM-ASR-2512 模型
