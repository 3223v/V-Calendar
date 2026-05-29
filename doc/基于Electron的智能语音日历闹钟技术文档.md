# 1.1 项目简介

本项目是一款**纯客户端、无后端服务**的智能语音日历闹钟系统，基于Electron框架开发，适配Windows桌面平台。系统打破传统静态日历工具局限，集成完整时间展示、节假日查询、日程管理、闹钟提醒、智能对话解析、语音交互能力，支持用户自主配置语音识别、大语言模型（LLM）等核心AI参数，实现高度个性化适配。

系统核心特色为**离线快速翻译、在线异步校验、自动降级**的双模式AI架构，无需部署后端服务，所有核心逻辑、数据存储、AI推理均在本地客户端完成。支持用户通过语音、文字对话两种方式输入日程信息，可智能识别纯文本课程表、口语化日程指令，自动完成日程批量增删改查（CRUD）操作，同时具备毫秒级闹钟提醒、时间可视化展示、农历节气查询、法定节假日识别等完整日历工具能力。

## 1.2 项目技术栈

### 核心技术框架
- **运行时**：Electron 28+ (Chromium 120+ / Node.js 18+)
- **前端框架**：Vue 3.4+ + Composition API + TypeScript 5.3+
- **UI组件库**：Element Plus 2.4+
- **状态管理**：Pinia 2.1+
- **构建工具**：Vite 5.0+
- **项目脚手架**：electron-vite 2.0+

### AI与语音技术
- **语音识别**：Web Speech API (在线) + Vosk (离线备选)
- **大语言模型**：支持 OpenAI GPT-4 / Claude 3 / 本地 Ollama
- **工作流编排**：LangGraph 0.1+ (Python后端服务) 或 LangChain.js (前端可选)
- **提示词管理**：GPTScript / Dify

### 数据存储
- **主数据库**：SQLite 3.45+ (通过 better-sqlite3 或 sql.js)
- **配置存储**：electron-store (JSON格式)
- **文件存储**：本地文件系统 + Electron fs API

### 系统集成
- **系统通知**：Electron Notification API + node-notifier (跨平台)
- **定时任务**：node-schedule (日历事件调度) + 操作系统任务计划程序
- **系统托盘**：Electron Tray API

### 开发工具链
- **代码规范**：ESLint 8+ + Prettier 3+
- **类型检查**：TypeScript Compiler + Volar (Vue IDE支持)
- **测试框架**：Vitest (单元测试) + Playwright (E2E测试)
- **持续集成**：GitHub Actions

### 技术架构图

```
┌─────────────────────────────────────────────────────────┐
│                     Electron Main Process                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   闹钟管理   │  │   系统托盘    │  │   窗口管理      │  │
│  │  (node-schedule)│  │  (Tray API)  │  │  (BrowserWindow)│  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   SQLite    │  │  electron-store│  │   文件系统      │  │
│  │(better-sqlite3)│  │  (配置存储)   │  │   (fs模块)     │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │ IPC
┌─────────────────────────────────────────────────────────┐
│                   Electron Renderer Process             │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │                    Vue 3 App                     │    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │    │
│  │  │ 日历视图  │  │ 对话界面  │  │  设置面板    │  │    │
│  │  └─────────┘  └──────────┘  └──────────────┘  │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │           Pinia Store (状态管理)         │  │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │    │
│  │  │  │ 日程存储  │  │ 闹钟存储  │  │配置存储 │ │  │    │
│  │  │  └──────────┘  └──────────┘  └────────┘ │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              语音识别层 (Web Speech API)         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│                  AI服务层 (独立进程/可选)                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │              LangGraph 工作流引擎                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  │  │
│  │  │ 自然语言解析 │  │ 日程意图识别 │  │ CRUD生成 │  │  │
│  │  └────────────┘  └────────────┘  └──────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  OpenAI API │  │ Claude API   │  │  Ollama API  │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 1.3 技术方案详解

### 1.3.1 语音采集与处理

#### 1.3.1.1 语音输入方案

**方案A：Web Speech API (推荐 - 在线方案)**

```typescript
// src/utils/speechRecognition.ts
interface SpeechRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
}

class VoiceInputManager {
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  
  async initialize(): Promise<void> {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('当前浏览器不支持 Web Speech API');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'zh-CN';
    this.recognition.maxAlternatives = 1;
    
    this.audioContext = new AudioContext();
  }
  
  async startRecording(): Promise<void> {
    if (!this.recognition) await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.recognition!.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        this.emit('speech-result', { transcript, confidence });
      };
      
      this.recognition!.onerror = (error) => reject(error);
      this.recognition!.start();
    });
  }
}
```

**方案B：MediaRecorder + 音频录制 (备选)**

```typescript
// src/utils/audioRecorder.ts
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  
  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { 
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      } 
    });
    
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.start(100); // 每100ms数据块
  }
  
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        resolve(audioBlob);
      };
      this.mediaRecorder!.stop();
    });
  }
  
  async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return await blob.arrayBuffer();
  }
}
```

#### 1.3.1.2 音频格式转换

**MP3转换方案：ffmpeg-static + fluent-ffmpeg**

```typescript
// src/utils/audioConverter.ts
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

class AudioConverter {
  constructor() {
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }
  
  async convertToMp3(inputBuffer: Buffer, outputPath: string): Promise<string> {
    const tempWebm = path.join(os.tmpdir(), `temp_${Date.now()}.webm`);
    
    return new Promise((resolve, reject) => {
      fs.writeFileSync(tempWebm, inputBuffer);
      
      ffmpeg(tempWebm)
        .toFormat('mp3')
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', () => {
          fs.unlinkSync(tempWebm);
          resolve(outputPath);
        })
        .on('error', (err) => {
          fs.unlinkSync(tempWebm);
          reject(err);
        })
        .save(outputPath);
    });
  }
  
  async convertMp3ToWav(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }
}
```

### 1.3.2 语音转文本 (STT)

#### 1.3.2.1 在线方案 - OpenAI Whisper API

```typescript
// src/services/sttService.ts
interface WhisperConfig {
  apiKey: string;
  model: 'whisper-1';
  language?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

class WhisperSTTService {
  private config: WhisperConfig;
  
  constructor(config: WhisperConfig) {
    this.config = config;
  }
  
  async transcribe(audioBuffer: Buffer): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', Buffer.from(audioBuffer), {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    });
    formData.append('model', this.config.model);
    formData.append('language', 'zh');
    formData.append('response_format', 'verbose_json');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Whisper API Error: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}
```

#### 1.3.2.2 离线方案 - Vosk

```typescript
// src/services/voskSTTService.ts
import { Model, Recognizer } from 'vosk';

class VoskSTTService {
  private model: Model | null = null;
  private recognizer: Recognizer | null = null;
  
  async initialize(modelPath: string): Promise<void> {
    this.model = new Model(modelPath);
    this.recognizer = new Recognizer(this.model, 16000);
  }
  
  async transcribe(audioPath: string): Promise<string> {
    const audioBuffer = fs.readFileSync(audioPath);
    const wavBuffer = await this.convertToWav(audioBuffer);
    
    const result = this.recognizer!.acceptWaveform(wavBuffer);
    if (result) {
      const recognitionResult = JSON.parse(this.recognizer!.result());
      return recognitionResult.text;
    }
    
    return '';
  }
}
```

### 1.3.3 文本到日程CRUD操作

#### 1.3.3.1 LangGraph 工作流设计

```python
# backend/langgraph_workflow/schedule_workflow.py
from langgraph.graph import StateGraph, END
from pydantic import BaseModel
from typing import TypedDict, List, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

class ScheduleState(TypedDict):
    user_input: str
    recognized_intent: Optional[str]
    extracted_events: List[dict]
    crud_operations: List[dict]
    confirmation_needed: bool
    execution_result: Optional[str]
    error: Optional[str]

class ScheduleWorkflow:
    def __init__(self, llm_config: dict):
        self.llm = ChatOpenAI(**llm_config)
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        builder = StateGraph(ScheduleState)
        
        # 节点定义
        builder.add_node("intent_recognition", self.recognize_intent)
        builder.add_node("entity_extraction", self.extract_entities)
        builder.add_node("crud_generation", self.generate_crud)
        builder.add_node("operation_execution", self.execute_operations)
        
        # 边定义
        builder.set_entry_point("intent_recognition")
        builder.add_edge("intent_recognition", "entity_extraction")
        builder.add_edge("entity_extraction", "crud_generation")
        builder.add_edge("crud_generation", "operation_execution")
        builder.add_edge("operation_execution", END)
        
        return builder.compile()
    
    def recognize_intent(self, state: ScheduleState) -> ScheduleState:
        intent_prompt = ChatPromptTemplate.from_template("""
        你是一个日程管理助手。用户输入可能是以下意图之一：
        - CREATE: 创建新日程
        - READ: 查询日程
        - UPDATE: 更新日程
        - DELETE: 删除日程
        - QUERY: 询问日历/节假日信息
        - OTHER: 其他意图
        
        用户输入: {user_input}
        
        只返回意图类型，不要其他内容。
        """)
        
        response = self.llm.invoke(
            intent_prompt.format_prompt(user_input=state["user_input"]).to_messages()
        )
        
        state["recognized_intent"] = response.content.strip()
        return state
    
    def extract_entities(self, state: ScheduleState) -> ScheduleState:
        extraction_prompt = ChatPromptTemplate.from_template("""
        从用户输入中提取日程相关实体信息。
        
        用户输入: {user_input}
        识别到的意图: {intent}
        
        提取以下信息（如果存在）：
        - title: 日程标题
        - start_time: 开始时间 (ISO 8601格式)
        - end_time: 结束时间
        - description: 描述
        - location: 地点
        - reminder: 提醒时间
        - recurrence: 重复规则 (none/daily/weekly/monthly/yearly)
        - category: 分类标签
        
        以JSON数组格式返回，如果无日程则返回空数组。
        """)
        
        response = self.llm.invoke(
            extraction_prompt.format_prompt(
                user_input=state["user_input"],
                intent=state["recognized_intent"]
            ).to_messages()
        )
        
        import json
        state["extracted_events"] = json.loads(response.content)
        return state
    
    def generate_crud(self, state: ScheduleState) -> ScheduleState:
        crud_prompt = ChatPromptTemplate.from_template("""
        根据识别的意图和提取的实体，生成CRUD操作指令。
        
        意图: {intent}
        提取的实体: {entities}
        
        生成结构化的CRUD操作，包括：
        - operation: CREATE | READ | UPDATE | DELETE
        - target: event | alarm | calendar
        - conditions: 查询条件 (用于READ/UPDATE/DELETE)
        - data: 要操作的数据 (用于CREATE/UPDATE)
        - requires_confirmation: 是否需要用户确认
        
        以JSON数组格式返回。
        """)
        
        response = self.llm.invoke(
            crud_prompt.format_prompt(
                intent=state["recognized_intent"],
                entities=json.dumps(state["extracted_events"])
            ).to_messages()
        )
        
        state["crud_operations"] = json.loads(response.content)
        state["confirmation_needed"] = any(
            op.get("requires_confirmation", False) for op in state["crud_operations"]
        )
        return state
    
    def execute_operations(self, state: ScheduleState) -> ScheduleState:
        # 这里会通过IPC调用主进程的数据库操作
        # 实现由 backend/services/schedule_service.py 处理
        state["execution_result"] = "Operations queued for execution"
        return state
    
    async def process(self, user_input: str) -> dict:
        initial_state: ScheduleState = {
            "user_input": user_input,
            "recognized_intent": None,
            "extracted_events": [],
            "crud_operations": [],
            "confirmation_needed": False,
            "execution_result": None,
            "error": None
        }
        
        result = await self.graph.ainvoke(initial_state)
        return result
```

#### 1.3.3.2 日程实体模型

```typescript
// src/types/schedule.ts
interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  reminder?: ReminderConfig;
  recurrence?: RecurrenceRule;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

interface ReminderConfig {
  enabled: boolean;
  minutesBefore: number[];
  sound?: string;
  notificationType: 'popup' | 'sound' | 'both';
}

interface RecurrenceRule {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
  byDay?: number[];
  byMonthDay?: number[];
}

interface Alarm {
  id: string;
  scheduleId: string;
  triggerTime: Date;
  type: 'schedule' | 'custom';
  title: string;
  message?: string;
  sound?: string;
  snoozable: boolean;
  snoozeMinutes: number;
  maxSnoozes: number;
  status: 'pending' | 'triggered' | 'snoozed' | 'dismissed';
}
```

### 1.3.4 数据库设计

#### 1.3.4.1 SQLite 数据库架构

```sql
-- 数据库初始化脚本: resources/schema.sql

-- 日程表
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    all_day INTEGER DEFAULT 0,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    metadata TEXT
);

CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_category ON schedules(category);

-- 日历表 (用于日历视图)
CREATE TABLE IF NOT EXISTS calendars (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    is_default INTEGER DEFAULT 0,
    visible INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);

-- 闹钟表
CREATE TABLE IF NOT EXISTS alarms (
    id TEXT PRIMARY KEY,
    schedule_id TEXT,
    trigger_time INTEGER NOT NULL,
    type TEXT DEFAULT 'schedule',
    title TEXT,
    message TEXT,
    sound TEXT,
    snoozable INTEGER DEFAULT 1,
    snooze_minutes INTEGER DEFAULT 5,
    max_snoozes INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

CREATE INDEX idx_alarms_trigger_time ON alarms(trigger_time);
CREATE INDEX idx_alarms_status ON alarms(status);

-- 提醒配置表
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    minutes_before INTEGER NOT NULL,
    notification_type TEXT DEFAULT 'both',
    sound TEXT,
    enabled INTEGER DEFAULT 1,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 节假日表
CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'national',
    lunar_date TEXT,
    year INTEGER
);

CREATE INDEX idx_holidays_date ON holidays(date);

-- 用户配置表
CREATE TABLE IF NOT EXISTS user_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 对话历史表
CREATE TABLE IF NOT EXISTS conversation_history (
    id TEXT PRIMARY KEY,
    user_input TEXT NOT NULL,
    ai_response TEXT,
    extracted_events TEXT,
    crud_operations TEXT,
    status TEXT DEFAULT 'success',
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_conversation_created_at ON conversation_history(created_at);
```

#### 1.3.4.2 数据库服务层

```typescript
// src/services/databaseService.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

class DatabaseService {
  private db: Database.Database | null = null;
  
  initialize(): void {
    const dbPath = path.join(app.getPath('userData'), 'calendar.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.runMigrations();
  }
  
  private runMigrations(): void {
    const schemaPath = path.join(__dirname, '../../resources/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db!.exec(schema);
  }
  
  // 日程CRUD操作
  createSchedule(event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>): ScheduleEvent {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    const stmt = this.db!.prepare(`
      INSERT INTO schedules (id, title, description, location, start_time, end_time, 
                            all_day, category, priority, status, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      event.title,
      event.description,
      event.location,
      event.startTime.getTime(),
      event.endTime.getTime(),
      event.allDay ? 1 : 0,
      event.category,
      event.priority,
      event.status,
      now,
      now,
      JSON.stringify(event.metadata || {})
    );
    
    return { ...event, id, createdAt: new Date(now), updatedAt: new Date(now) };
  }
  
  getSchedules(filter: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    category?: string;
  }): ScheduleEvent[] {
    let query = 'SELECT * FROM schedules WHERE 1=1';
    const params: any[] = [];
    
    if (filter.startDate) {
      query += ' AND start_time >= ?';
      params.push(filter.startDate.getTime());
    }
    if (filter.endDate) {
      query += ' AND end_time <= ?';
      params.push(filter.endDate.getTime());
    }
    if (filter.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter.category) {
      query += ' AND category = ?';
      params.push(filter.category);
    }
    
    query += ' ORDER BY start_time ASC';
    
    const stmt = this.db!.prepare(query);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      allDay: row.all_day === 1,
      category: row.category,
      priority: row.priority,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }
  
  updateSchedule(id: string, updates: Partial<ScheduleEvent>): boolean {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.startTime !== undefined) {
      fields.push('start_time = ?');
      values.push(updates.startTime.getTime());
    }
    if (updates.endTime !== undefined) {
      fields.push('end_time = ?');
      values.push(updates.endTime.getTime());
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);
    
    const stmt = this.db!.prepare(
      `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`
    );
    
    const result = stmt.run(...values);
    return result.changes > 0;
  }
  
  deleteSchedule(id: string): boolean {
    const stmt = this.db!.prepare('DELETE FROM schedules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
```

### 1.3.5 节假日与农历查询

#### 1.3.5.1 节假日数据源

```typescript
// src/services/holidayService.ts
interface HolidayData {
  date: string;
  name: string;
  type: 'national' | 'traditional' | 'solar';
}

class HolidayService {
  private holidays: Map<string, HolidayData> = new Map();
  
  async initialize(): Promise<void> {
    await this.loadBuiltInHolidays();
    await this.syncOnlineHolidays();
  }
  
  private async loadBuiltInHolidays(): Promise<void> {
    const builtInHolidays: HolidayData[] = [
      { date: '2024-01-01', name: '元旦', type: 'national' },
      { date: '2024-02-10', name: '春节', type: 'traditional' },
      { date: '2024-04-04', name: '清明节', type: 'traditional' },
      { date: '2024-05-01', name: '劳动节', type: 'national' },
      { date: '2024-06-10', name: '端午节', type: 'traditional' },
      { date: '2024-09-17', name: '中秋节', type: 'traditional' },
      { date: '2024-10-01', name: '国庆节', type: 'national' },
    ];
    
    builtInHolidays.forEach(h => {
      this.holidays.set(h.date, h);
    });
  }
  
  async syncOnlineHolidays(): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(
        `https://api.apihubs.cn/holiday/get?year=${currentYear}&order_by=1`
      );
      const data = await response.json();
      
      if (data.code === 0 && data.data) {
        for (const item of data.data) {
          this.holidays.set(item.date, {
            date: item.date,
            name: item.name,
            type: item.type === 1 ? 'national' : 'traditional'
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync holidays:', error);
    }
  }
  
  getHoliday(date: Date): HolidayData | null {
    const dateStr = this.formatDate(date);
    return this.holidays.get(dateStr) || null;
  }
  
  getHolidaysInRange(startDate: Date, endDate: Date): HolidayData[] {
    const result: HolidayData[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const holiday = this.getHoliday(current);
      if (holiday) {
        result.push(holiday);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return result;
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
```

#### 1.3.5.2 农历转换

```typescript
// src/utils/lunarCalendar.ts
interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

class LunarCalendarConverter {
  private lunarInfo: number[] = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d4d0, 0x0d250, 0x0d558, 0x0b540,
    0x0b6a0, 0x195a6, 0x095b0, 0x049b0, 0x074a0, 0x0d4a0, 0x0ea50, 0x06e95,
    0x05ad0, 0x02b60, 0x08670, 0x03ad0, 0x0c950, 0x0d4a0, 0x0d9a0, 0x0e950,
    0x096a0, 0x0d4a0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d250, 0x0d558, 0x0b540,
    0x0b5a0, 0x195a6, 0x095b0, 0x049b0, 0x04a00, 0x0d4a0, 0x0ea50, 0x06b95,
    0x05ad0, 0x02b60, 0x08670, 0x03ad0, 0x0c960, 0x0d950, 0x0d4a0, 0x0da50,
    0x075a0, 0x056d0, 0x055d0, 0x04ae0, 0x0a5b0, 0x0a570, 0x05270, 0x04ae0,
    0x0a5b0, 0x0a4d0, 0x0d250, 0x0d520, 0x0dd50, 0x0b5a0, 0x056d0, 0x04ae0,
  ];
  
  solarToLunar(solarDate: Date): LunarDate {
    const baseDate = new Date(1900, 0, 31);
    const offset = Math.floor((solarDate.getTime() - baseDate.getTime()) / 86400000);
    
    let lunarYear = 1900;
    let lunarMonth = 1;
    let lunarDay = 1;
    let leapMonth = 0;
    
    let temp = 0;
    for (let i = 1900; i < 2100 && offset > temp; i++) {
      temp += this.getLunarYearDays(i);
      lunarYear++;
    }
    
    if (offset >= temp) {
      temp -= temp;
      lunarYear--;
    }
    
    const leapMonthInfo = this.getLunarLeapMonth(lunarYear);
    leapMonth = (leapMonthInfo >> 8) & 0x0f;
    
    for (let i = 1; i < 13 && offset > temp; i++) {
      if (leapMonth > 0 && i === (leapMonth + 1) && (leapMonthInfo & 0x0f) === 0) {
        temp += this.getLunarLeapDays(lunarYear);
        if (offset <= temp) {
          lunarMonth = i;
          lunarDay = offset - temp + 1;
          break;
        }
        i++;
      }
      temp += this.getLunarMonthDays(lunarYear, i);
      lunarMonth = i;
    }
    
    lunarDay = offset - temp + 1;
    
    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeapMonth: (leapMonthInfo & 0x0f) !== 0 && lunarMonth === leapMonth + 1
    };
  }
  
  private getLunarYearDays(year: number): number {
    let sum = 348;
    let info = this.lunarInfo[year - 1900];
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      if ((info & i) !== 0) sum += 1;
    }
    return sum + this.getLunarLeapDays(year);
  }
  
  private getLunarLeapMonth(year: number): number {
    if (year < 1900 || year >= 2100) return 0;
    return this.lunarInfo[year - 1900] & 0xf;
  }
  
  private getLunarLeapDays(year: number): number {
    if (this.getLunarLeapMonth(year) !== 0) {
      return (this.lunarInfo[year - 1900] & 0x10000) !== 0 ? 30 : 29;
    }
    return 0;
  }
  
  private getLunarMonthDays(year: number, month: number): number {
    return (this.lunarInfo[year - 1900] & (0x10000 >> month)) !== 0 ? 30 : 29;
  }
  
  getSolarTerm(date: Date): string | null {
    const solarTerms = [
      '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
      '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
      '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
      '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
    ];
    
    const baseDate = new Date(1900, 0, 6, 2, 5);
    const offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000);
    const index = Math.floor(offset / 5.5);
    
    if (index >= 0 && index < solarTerms.length) {
      return solarTerms[index];
    }
    return null;
  }
}
```

### 1.3.6 闹钟提醒系统

#### 1.3.6.1 闹钟服务架构

```typescript
// src/services/alarmService.ts
import schedule from 'node-schedule';
import { Notification, app } from 'electron';
import path from 'path';
import fs from 'fs';

interface AlarmTask {
  id: string;
  scheduleId: string;
  triggerTime: Date;
  job: schedule.Job | null;
}

class AlarmService {
  private activeAlarms: Map<string, AlarmTask> = new Map();
  private notificationSound: string;
  
  constructor() {
    this.notificationSound = path.join(__dirname, '../../resources/sounds/alarm.mp3');
  }
  
  scheduleAlarm(alarm: Alarm): void {
    if (this.activeAlarms.has(alarm.id)) {
      this.cancelAlarm(alarm.id);
    }
    
    const job = schedule.scheduleJob(alarm.triggerTime, () => {
      this.triggerAlarm(alarm);
    });
    
    this.activeAlarms.set(alarm.id, {
      id: alarm.id,
      scheduleId: alarm.scheduleId,
      triggerTime: alarm.triggerTime,
      job
    });
    
    console.log(`Alarm scheduled: ${alarm.id} at ${alarm.triggerTime}`);
  }
  
  private triggerAlarm(alarm: Alarm): void {
    this.showNotification(alarm);
    this.playSound();
    
    if (alarm.snoozable) {
      this.handleSnooze(alarm);
    }
  }
  
  private showNotification(alarm: Alarm): void {
    const notification = new Notification({
      title: alarm.title,
      body: alarm.message || '日程提醒',
      icon: path.join(__dirname, '../../resources/icons/alarm.png'),
      urgency: 'critical',
      silent: false,
      actions: alarm.snoozable ? [
        { type: 'button', text: '稍后提醒' },
        { type: 'button', text: '关闭' }
      ] : []
    });
    
    notification.on('click', () => {
      this.onAlarmDismissed(alarm.id);
    });
    
    notification.on('action', (event, index) => {
      if (index === 0) {
        this.snoozeAlarm(alarm);
      } else {
        this.onAlarmDismissed(alarm.id);
      }
    });
    
    notification.show();
  }
  
  private playSound(): void {
    if (fs.existsSync(this.notificationSound)) {
      const { exec } = require('child_process');
      if (process.platform === 'win32') {
        exec(`powershell -c "(New-Object Media.SoundPlayer '${this.notificationSound}').PlaySync();"`);
      }
    }
  }
  
  private snoozeAlarm(alarm: Alarm): void {
    const snoozeTime = new Date(Date.now() + alarm.snoozeMinutes * 60000);
    this.scheduleAlarm({
      ...alarm,
      id: `${alarm.id}_snooze`,
      triggerTime: snoozeTime,
      status: 'snoozed'
    });
  }
  
  cancelAlarm(alarmId: string): void {
    const task = this.activeAlarms.get(alarmId);
    if (task?.job) {
      task.job.cancel();
      this.activeAlarms.delete(alarmId);
    }
  }
  
  rescheduleAllAlarms(): void {
    const dbService = DatabaseService.getInstance();
    const alarms = dbService.getPendingAlarms();
    
    alarms.forEach(alarm => {
      this.scheduleAlarm(alarm);
    });
  }
  
  private onAlarmDismissed(alarmId: string): void {
    const dbService = DatabaseService.getInstance();
    dbService.updateAlarmStatus(alarmId, 'dismissed');
    this.cancelAlarm(alarmId);
  }
}
```

#### 1.3.6.2 系统托盘集成

```typescript
// src/main/trayManager.ts
import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';

class TrayManager {
  private tray: Tray | null = null;
  
  initialize(): void {
    const iconPath = path.join(__dirname, '../../resources/icons/tray.png');
    const icon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('智能语音日历');
    
    this.updateContextMenu();
    
    this.tray.on('click', () => {
      const mainWindow = WindowManager.getMainWindow();
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  }
  
  private updateContextMenu(): void {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '打开日历',
        click: () => {
          const mainWindow = WindowManager.getMainWindow();
          mainWindow?.show();
          mainWindow?.focus();
        }
      },
      {
        label: '添加日程',
        click: () => {
          const mainWindow = WindowManager.getMainWindow();
          mainWindow?.webContents.send('navigate', '/schedule/create');
          mainWindow?.show();
        }
      },
      { type: 'separator' },
      {
        label: '今日日程',
        submenu: this.buildTodaySchedulesMenu()
      },
      { type: 'separator' },
      {
        label: '设置',
        click: () => {
          const mainWindow = WindowManager.getMainWindow();
          mainWindow?.webContents.send('navigate', '/settings');
          mainWindow?.show();
        }
      },
      {
        label: '退出',
        click: () => {
          app.quit();
        }
      }
    ]);
    
    this.tray?.setContextMenu(contextMenu);
  }
  
  private buildTodaySchedulesMenu(): Electron.MenuItemConstructorOptions[] {
    const dbService = DatabaseService.getInstance();
    const todaySchedules = dbService.getSchedules({
      startDate: new Date(),
      endDate: new Date(new Date().setHours(23, 59, 59, 999))
    });
    
    if (todaySchedules.length === 0) {
      return [{ label: '今日无日程', enabled: false }];
    }
    
    return todaySchedules.map(schedule => ({
      label: `${schedule.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} ${schedule.title}`,
      click: () => {
        const mainWindow = WindowManager.getMainWindow();
        mainWindow?.webContents.send('navigate', `/schedule/${schedule.id}`);
      }
    }));
  }
  
  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }
}
```

# 1.4 存储方案

## 1.4.1 存储架构概览

本系统采用多层次存储架构，针对不同类型的数据使用最适合的存储方案：

```
┌────────────────────────────────────────────────────────────┐
│                      存储层架构                              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │   SQLite        │  │  electron-store  │  │  文件系统  │ │
│  │  (结构化数据)    │  │   (配置数据)      │  │  (资源)   │ │
│  │                 │  │                  │  │          │ │
│  │ • 日程数据      │  │ • 用户配置       │  │ • 音频文件│ │
│  │ • 闹钟数据      │  │ • API密钥        │  │ • 模型文件│ │
│  │ • 节假日数据    │  │ • 界面偏好       │  │ • 日志   │ │
│  │ • 对话历史      │  │ • 窗口状态       │  │          │ │
│  └─────────────────┘  └──────────────────┘  └───────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              内存缓存层 (Pinia Store)                  │  │
│  │  • 当前视图数据                                       │  │
│  │  • 用户会话状态                                       │  │
│  │  • 实时搜索结果                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## 1.4.2 SQLite 数据库方案

### 选型理由

**为什么选择 SQLite：**

1. **零配置**：无需安装数据库服务器，文件即数据库
2. **轻量高效**：完整的SQL支持，性能优秀
3. **纯客户端**：完美适配Electron应用，无需外部依赖
4. **跨平台**：Windows/Mac/Linux一致体验
5. **持久化**：数据持久化存储于用户数据目录
6. **WAL模式**：支持并发读写，提升性能

### 数据库文件位置

```typescript
// 获取数据库文件路径
import { app } from 'electron';
import path from 'path';

const getDatabasePath = (): string => {
  const userDataPath = app.getPath('userData'); // Windows: %APPDATA%/V-Calendar
  return path.join(userDataPath, 'calendar.db');
};

const getConfigPath = (): string => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'config');
};
```

### 存储内容规划

| 数据类型 | 存储方式 | 说明 |
|---------|---------|------|
| 日程事件 | SQLite | 核心业务数据，需要高效查询 |
| 闹钟配置 | SQLite | 与日程关联，需要精确触发 |
| 节假日数据 | SQLite | 年度数据，支持离线查询 |
| 对话历史 | SQLite | 审计追踪，支持重做 |
| 用户配置 | electron-store | 轻量键值对，快速读写 |
| API密钥 | electron-store | 敏感数据加密存储 |
| 窗口状态 | electron-store | 界面恢复 |
| 音频文件 | 文件系统 | 临时缓存，定期清理 |
| 日志文件 | 文件系统 | 滚动日志，保留7天 |

## 1.4.3 配置存储方案

### electron-store 配置项

```typescript
// src/types/config.ts
interface AppConfig {
  // AI服务配置
  ai: {
    provider: 'openai' | 'claude' | 'ollama';
    apiKey?: string;
    baseUrl?: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  
  // 语音识别配置
  speech: {
    provider: 'webspeech' | 'whisper' | 'vosk';
    language: string;
    continuous: boolean;
  };
  
  // 闹钟配置
  alarm: {
    defaultSnoozeMinutes: number;
    maxSnoozes: number;
    soundVolume: number;
    playSound: boolean;
    showNotification: boolean;
  };
  
  // 界面配置
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en-US';
    startMinimized: boolean;
    closeToTray: boolean;
    confirmBeforeDelete: boolean;
    defaultCalendarView: 'month' | 'week' | 'day';
  };
  
  // 窗口配置
  window: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    maximized: boolean;
  };
  
  // 功能开关
  features: {
    enableVoiceInput: boolean;
    enableAutoReminder: boolean;
    enableHolidaySync: boolean;
    enableLunarCalendar: boolean;
  };
}
```

### 配置管理服务

```typescript
// src/services/configService.ts
import Store from 'electron-store';

class ConfigService {
  private store: Store<AppConfig>;
  
  constructor() {
    this.store = new Store<AppConfig>({
      name: 'config',
      defaults: {
        ai: {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 2000
        },
        speech: {
          provider: 'webspeech',
          language: 'zh-CN',
          continuous: false
        },
        alarm: {
          defaultSnoozeMinutes: 5,
          maxSnoozes: 3,
          soundVolume: 0.8,
          playSound: true,
          showNotification: true
        },
        ui: {
          theme: 'auto',
          language: 'zh-CN',
          startMinimized: false,
          closeToTray: true,
          confirmBeforeDelete: true,
          defaultCalendarView: 'month'
        },
        window: {
          width: 1200,
          height: 800,
          maximized: false
        },
        features: {
          enableVoiceInput: true,
          enableAutoReminder: true,
          enableHolidaySync: true,
          enableLunarCalendar: true
        }
      },
      encryptionKey: 'v-calendar-secure-key' // 敏感配置加密
    });
  }
  
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key);
  }
  
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value);
  }
  
  getAll(): AppConfig {
    return this.store.store;
  }
  
  reset(): void {
    this.store.clear();
  }
}
```

## 1.4.4 文件存储方案

### 资源目录结构

```
${userDataPath}/
├── calendar.db              # SQLite数据库
├── config.json              # electron-store配置
├── logs/                    # 日志目录
│   ├── app.log             # 应用日志
│   ├── error.log           # 错误日志
│   └── audio.log           # 音频处理日志
├── cache/                   # 缓存目录
│   ├── audio/              # 音频文件缓存
│   │   └── temp_*.mp3      # 临时录音文件
│   ├── holidays/           # 节假日数据缓存
│   │   └── ${year}.json    # 年度节假日数据
│   └── models/             # AI模型文件(离线模式)
│       └── vosk-model.zip  # Vosk语音模型
├── resources/               # 应用资源(打包时包含)
│   ├── sounds/             # 音频资源
│   │   ├── alarm.mp3       # 闹钟声音
│   │   └── notification.mp3 # 通知声音
│   └── icons/              # 应用图标
│       ├── tray.png        # 托盘图标
│       ├── alarm.png       # 闹钟图标
│       └── app.png         # 应用图标
└── userData/               # 用户数据
    └── exports/            # 导出文件目录
        └── ${date}_schedules.json  # 导出的日程
```

### 文件管理策略

```typescript
// src/services/fileManager.ts
import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import os from 'os';

class FileManager {
  private cacheDir: string;
  private logDir: string;
  
  constructor() {
    const userDataPath = app.getPath('userData');
    this.cacheDir = path.join(userDataPath, 'cache');
    this.logDir = path.join(userDataPath, 'logs');
  }
  
  async initialize(): Promise<void> {
    await fs.ensureDir(this.cacheDir);
    await fs.ensureDir(path.join(this.cacheDir, 'audio'));
    await fs.ensureDir(this.logDir);
  }
  
  async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const tempDir = path.join(this.cacheDir, 'audio');
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up temp file: ${file}`);
      }
    }
  }
  
  async cleanupLogs(maxFiles: number = 7): Promise<void> {
    const logFiles = await fs.readdir(this.logDir);
    const logFilePaths = logFiles
      .filter(f => f.endsWith('.log'))
      .map(f => path.join(this.logDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    
    if (logFilePaths.length > maxFiles) {
      const filesToDelete = logFilePaths.slice(maxFiles);
      for (const filePath of filesToDelete) {
        await fs.remove(filePath);
        console.log(`Cleaned up log file: ${filePath}`);
      }
    }
  }
  
  async getCacheSize(): Promise<{ audio: number; total: number }> {
    const audioDir = path.join(this.cacheDir, 'audio');
    let audioSize = 0;
    
    if (await fs.pathExists(audioDir)) {
      const files = await fs.readdir(audioDir);
      for (const file of files) {
        const stats = await fs.stat(path.join(audioDir, file));
        audioSize += stats.size;
      }
    }
    
    const totalSize = await this.getDirSize(this.cacheDir);
    
    return { audio: audioSize, total: totalSize };
  }
  
  private async getDirSize(dir: string): Promise<number> {
    let size = 0;
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        size += await this.getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }
  
  async exportData(data: any, filename: string): Promise<string> {
    const exportDir = path.join(app.getPath('userData'), 'exports');
    await fs.ensureDir(exportDir);
    
    const exportPath = path.join(exportDir, filename);
    await fs.writeJson(exportPath, data, { spaces: 2 });
    
    return exportPath;
  }
}
```

## 1.4.5 数据备份与恢复

```typescript
// src/services/backupService.ts
import fs from 'fs-extra';
import path from 'path';
import { app, dialog } from 'electron';
import Database from 'better-sqlite3';

class BackupService {
  async createBackup(): Promise<string> {
    const userDataPath = app.getPath('userData');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(userDataPath, 'backups', `backup_${timestamp}`);
    
    await fs.ensureDir(backupDir);
    
    const dbPath = path.join(userDataPath, 'calendar.db');
    if (await fs.pathExists(dbPath)) {
      await fs.copy(dbPath, path.join(backupDir, 'calendar.db'));
    }
    
    const configPath = path.join(userDataPath, 'config.json');
    if (await fs.pathExists(configPath)) {
      await fs.copy(configPath, path.join(backupDir, 'config.json'));
    }
    
    console.log(`Backup created at: ${backupDir}`);
    return backupDir;
  }
  
  async restoreBackup(backupPath: string): Promise<void> {
    const userDataPath = app.getPath('userData');
    
    const dbBackupPath = path.join(backupPath, 'calendar.db');
    if (await fs.pathExists(dbBackupPath)) {
      const dbPath = path.join(userDataPath, 'calendar.db');
      await fs.copy(dbBackupPath, dbPath);
    }
    
    const configBackupPath = path.join(backupPath, 'config.json');
    if (await fs.pathExists(configBackupPath)) {
      const configPath = path.join(userDataPath, 'config.json');
      await fs.copy(configBackupPath, configPath);
    }
    
    console.log(`Backup restored from: ${backupPath}`);
  }
  
  async listBackups(): Promise<Array<{ path: string; date: Date }>> {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    
    if (!await fs.pathExists(backupDir)) {
      return [];
    }
    
    const backups = await fs.readdir(backupDir);
    const backupInfos: Array<{ path: string; date: Date }> = [];
    
    for (const backup of backups) {
      const backupPath = path.join(backupDir, backup);
      const stats = await fs.stat(backupPath);
      backupInfos.push({ path: backupPath, date: stats.mtime });
    }
    
    return backupInfos.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
```

# 1.5 闹钟与时间信息

## 1.5.1 时间处理架构

```
┌─────────────────────────────────────────────────────────────┐
│                    时间处理系统架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐    ┌───────────────┐    ┌────────────┐ │
│  │   用户输入    │───▶│   时间解析器   │───▶│   标准时间  │ │
│  │  (自然语言)   │    │  (时间解析库)  │    │    对象    │ │
│  └───────────────┘    └───────────────┘    └────────────┘ │
│                             │                               │
│                             ▼                               │
│                      ┌───────────────┐                     │
│                      │  日历视图组件  │                     │
│                      │  (Vue日历库)   │                     │
│                      └───────────────┘                     │
│                             │                               │
│                             ▼                               │
│                      ┌───────────────┐                     │
│                      │   闹钟调度器   │                     │
│                      │ (node-schedule│                     │
│                      └───────────────┘                     │
│                             │                               │
│                             ▼                               │
│                      ┌───────────────┐                     │
│                      │   系统通知     │                     │
│                      │  (通知API)     │                     │
│                      └───────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## 1.5.2 智能时间解析

```typescript
// src/utils/dateParser.ts
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/zh-cn';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.locale('zh-cn');

interface ParsedTime {
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  confidence: number;
}

class SmartDateParser {
  private patterns: Array<{
    regex: RegExp;
    parser: (match: RegExpMatchArray) => ParsedTime;
    examples: string[];
  }>;
  
  constructor() {
    this.patterns = this.initializePatterns();
  }
  
  private initializePatterns() {
    return [
      {
        regex: /(\d{1,2})[时分点](?:(\d{1,2})分?)?/,
        parser: (match) => {
          const now = dayjs();
          const hour = parseInt(match[1]);
          const minute = parseInt(match[2] || '0');
          const startTime = now.hour(hour).minute(minute).second(0);
          const endTime = startTime.add(1, 'hour');
          return {
            startTime: startTime.toDate(),
            endTime: endTime.toDate(),
            allDay: false,
            confidence: 0.9
          };
        },
        examples: ['下午3点', '3点半', '14:30', '14点30分']
      },
      {
        regex: /(?:明天|明日)(?:早上|上午|下午|晚上)?(\d{1,2})[时分点]?(?:(\d{1,2})分?)?/,
        parser: (match) => {
          const tomorrow = dayjs().add(1, 'day');
          const hour = parseInt(match[1]);
          const minute = parseInt(match[2] || '0');
          const startTime = tomorrow.hour(hour).minute(minute).second(0);
          const endTime = startTime.add(1, 'hour');
          return {
            startTime: startTime.toDate(),
            endTime: endTime.toDate(),
            allDay: false,
            confidence: 0.95
          };
        },
        examples: ['明天早上9点', '明天下午3点半']
      },
      {
        regex: /(?:本周|这周)([^星期周]+)|(?:星期|周|礼拜)([一二三四五六日天])/,
        parser: (match) => {
          const weekDayMap: Record<string, number> = {
            '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7
          };
          const targetDay = weekDayMap[match[1] || match[2]];
          const currentWeekday = dayjs().weekday();
          let daysToAdd = targetDay - currentWeekday;
          if (daysToAdd <= 0) daysToAdd += 7;
          
          const targetDate = dayjs().add(daysToAdd, 'day').hour(9).minute(0);
          return {
            startTime: targetDate.toDate(),
            endTime: targetDate.add(1, 'hour').toDate(),
            allDay: false,
            confidence: 0.85
          };
        },
        examples: ['这周三', '下周一', '周一早上10点']
      },
      {
        regex: /(\d{4})[年/](\d{1,2})[月/](\d{1,2})/,
        parser: (match) => {
          const date = dayjs(`${match[1]}-${match[2]}-${match[3]}`);
          return {
            startTime: date.hour(9).minute(0).toDate(),
            endTime: date.hour(10).minute(0).toDate(),
            allDay: false,
            confidence: 0.95
          };
        },
        examples: ['2024年5月1日', '2024/05/01']
      },
      {
        regex: /(?:今天|今日)/,
        parser: () => {
          const today = dayjs();
          return {
            startTime: today.hour(9).minute(0).toDate(),
            endTime: today.hour(10).minute(0).toDate(),
            allDay: false,
            confidence: 0.9
          };
        },
        examples: ['今天', '今天下午3点']
      }
    ];
  }
  
  parse(input: string): ParsedTime | null {
    for (const pattern of this.patterns) {
      const match = input.match(pattern.regex);
      if (match) {
        try {
          return pattern.parser(match);
        } catch (error) {
          console.error(`Failed to parse with pattern:`, error);
          continue;
        }
      }
    }
    
    return null;
  }
  
  parseWithLLM(input: string): Promise<ParsedTime | null> {
    // 备用方案：使用LLM解析复杂时间表达
    // 实现由 AI 服务层提供
    return Promise.resolve(null);
  }
}
```

## 1.5.3 日程周期规则

```typescript
// src/utils/recurrence.ts
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(customParseFormat);
dayjs.extend(weekOfYear);

interface RecurrenceConfig {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
  byDay?: number[];
  byMonthDay?: number[];
}

class RecurrenceCalculator {
  calculateOccurrences(
    startDate: Date,
    config: RecurrenceConfig,
    rangeStart: Date,
    rangeEnd: Date
  ): Date[] {
    if (config.frequency === 'none') {
      return startDate >= rangeStart && startDate <= rangeEnd ? [startDate] : [];
    }
    
    const occurrences: Date[] = [];
    let current = dayjs(startDate);
    let count = 0;
    const maxOccurrences = config.count || 1000;
    const maxDate = config.endDate ? dayjs(config.endDate) : dayjs(rangeEnd);
    
    while (current.isSameOrBefore(maxDate) && current.isSameOrBefore(rangeEnd) && count < maxOccurrences) {
      if (current.isSameOrAfter(rangeStart)) {
        if (this.shouldIncludeOccurrence(current, config)) {
          occurrences.push(current.toDate());
          count++;
        }
      }
      
      current = this.getNextOccurrence(current, config);
      
      if (count >= maxOccurrences) break;
    }
    
    return occurrences;
  }
  
  private shouldIncludeOccurrence(date: dayjs.Dayjs, config: RecurrenceConfig): boolean {
    if (config.byDay && config.byDay.length > 0) {
      const weekday = date.weekday() + 1;
      if (!config.byDay.includes(weekday)) {
        return false;
      }
    }
    
    if (config.byMonthDay && config.byMonthDay.length > 0) {
      const monthDay = date.date();
      if (!config.byMonthDay.includes(monthDay)) {
        return false;
      }
    }
    
    return true;
  }
  
  private getNextOccurrence(current: dayjs.Dayjs, config: RecurrenceConfig): dayjs.Dayjs {
    switch (config.frequency) {
      case 'daily':
        return current.add(config.interval, 'day');
      case 'weekly':
        return current.add(config.interval, 'week');
      case 'monthly':
        return current.add(config.interval, 'month');
      case 'yearly':
        return current.add(config.interval, 'year');
      default:
        return current.add(1, 'year');
    }
  }
  
  generateDescription(config: RecurrenceConfig): string {
    const intervalText = config.interval > 1 ? `${config.interval}` : '';
    
    switch (config.frequency) {
      case 'daily':
        return `每${intervalText}天`;
      case 'weekly':
        return `每${intervalText}周`;
      case 'monthly':
        return `每${intervalText}月`;
      case 'yearly':
        return `每${intervalText}年`;
      default:
        return '不重复';
    }
  }
}
```

# 1.6 日历信息展示

## 1.6.1 日历组件选型

### 主流日历组件对比

| 组件名称 | 特性 | 适用场景 | 推荐指数 |
|---------|------|---------|---------|
| **FullCalendar** | 功能全面，支持多种视图 | 企业级应用 | ⭐⭐⭐⭐⭐ |
| **VCalendar** | Vue3专用，轻量 | Vue项目快速开发 | ⭐⭐⭐⭐ |
| **tuiedendar** | 中文友好，支持农历 | 国内项目 | ⭐⭐⭐⭐ |
| **dayz** | 高度可定制 | 需要自定义UI | ⭐⭐⭐ |

### 推荐方案：VCalendar + 自定义增强

```typescript
// src/components/calendar/CalendarView.vue
<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <el-button @click="previousMonth">◀</el-button>
      <h2>{{ currentMonthTitle }}</h2>
      <el-button @click="nextMonth">▶</el-button>
      <el-button @click="goToToday">今天</el-button>
    </div>
    
    <div class="calendar-grid">
      <div class="weekday-header">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>
      
      <div class="days-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="['day-cell', getDayClass(day)]"
          @click="onDayClick(day)"
        >
          <div class="day-header">
            <span class="day-number">{{ day.date }}</span>
            <span v-if="day.lunar" class="lunar-day">{{ day.lunar }}</span>
          </div>
          
          <div class="day-events">
            <div
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              :class="['event-item', `priority-${event.priority}`]"
              @click.stop="onEventClick(event)"
            >
              {{ event.title }}
            </div>
            <div v-if="day.events.length > 3" class="more-events">
              还有{{ day.events.length - 3 }}个事件
            </div>
          </div>
          
          <div v-if="day.holiday" class="holiday-badge">
            {{ day.holiday }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { useScheduleStore } from '@/stores/schedule';
import { useHolidayService } from '@/services/holidayService';
import { useLunarConverter } from '@/utils/lunarCalendar';

const scheduleStore = useScheduleStore();
const holidayService = useHolidayService();
const lunarConverter = useLunarConverter();

const currentDate = ref(dayjs());
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const currentMonthTitle = computed(() => {
  return currentDate.value.format('YYYY年M月');
});

const calendarDays = computed(() => {
  const days: Array<{
    date: number;
    month: number;
    dateStr: string;
    lunar?: string;
    holiday?: string;
    events: ScheduleEvent[];
    isToday: boolean;
    isCurrentMonth: boolean;
  }> = [];
  
  const startOfMonth = currentDate.value.startOf('month');
  const endOfMonth = currentDate.value.endOf('month');
  const startDayOfWeek = startOfMonth.day();
  
  const startDate = startOfMonth.subtract(startDayOfWeek, 'day');
  
  for (let i = 0; i < 42; i++) {
    const day = startDate.add(i, 'day');
    const dayEvents = scheduleStore.getEventsByDate(day.toDate());
    const lunar = lunarConverter.solarToLunar(day.toDate());
    const holiday = holidayService.getHoliday(day.toDate());
    
    days.push({
      date: day.date(),
      month: day.month() + 1,
      dateStr: day.format('YYYY-MM-DD'),
      lunar: lunarConverter.getLunarDayName(lunar.day),
      holiday: holiday?.name,
      events: dayEvents,
      isToday: day.isSame(dayjs(), 'day'),
      isCurrentMonth: day.month() === currentDate.value.month()
    });
  }
  
  return days;
});

function getDayClass(day: any): string[] {
  const classes = [];
  if (day.isToday) classes.push('today');
  if (!day.isCurrentMonth) classes.push('other-month');
  if (day.holiday) classes.push('holiday');
  return classes;
}

function previousMonth() {
  currentDate.value = currentDate.value.subtract(1, 'month');
}

function nextMonth() {
  currentDate.value = currentDate.value.add(1, 'month');
}

function goToToday() {
  currentDate.value = dayjs();
}

function onDayClick(day: any) {
  scheduleStore.setSelectedDate(day.dateStr);
}

function onEventClick(event: ScheduleEvent) {
  scheduleStore.selectEvent(event.id);
}
</script>
```

## 1.6.2 农历与节假日显示

```typescript
// src/utils/lunarCalendar.ts
class LunarCalendarDisplay {
  private lunarChars = [
    '日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '初', '十',
    '十', '廿', '卅', '□'
  ];
  
  private monthNames = [
    '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'
  ];
  
  getLunarDayName(day: number): string {
    if (day === 10) return '初十';
    if (day === 20) return '二十';
    if (day === 30) return '三十';
    
    const tens = Math.floor(day / 10);
    const ones = day % 10;
    
    return this.lunarChars[10 + tens] + this.lunarChars[ones];
  }
  
  getLunarMonthName(month: number, isLeap: boolean = false): string {
    const prefix = isLeap ? '闰' : '';
    return prefix + this.monthNames[month - 1] + '月';
  }
  
  formatLunarDate(lunar: LunarDate): string {
    const monthName = this.getLunarMonthName(lunar.month, lunar.isLeapMonth);
    const dayName = this.getLunarDayName(lunar.day);
    return `${lunar.year}年${monthName}${dayName}`;
  }
  
  getHolidayInfo(date: Date): HolidayDisplayInfo | null {
    const holiday = this.holidayService.getHoliday(date);
    if (!holiday) return null;
    
    return {
      name: holiday.name,
      type: holiday.type,
      isVacation: this.isVacationDay(date, holiday),
      makeupDay: this.getMakeupDay(date)
    };
  }
  
  private isVacationDay(date: Date, holiday: HolidayData): boolean {
    // 判断是否为法定节假日调休的工作日
    // 需要结合调休安排判断
    return true;
  }
}
```

## 1.6.3 多视图切换

```typescript
// src/views/CalendarView.vue
<template>
  <div class="calendar-view">
    <div class="view-switcher">
      <el-radio-group v-model="currentView" @change="onViewChange">
        <el-radio-button label="month">月视图</el-radio-button>
        <el-radio-button label="week">周视图</el-radio-button>
        <el-radio-button label="agenda">日程列表</el-radio-button>
      </el-radio-group>
    </div>
    
    <component :is="currentViewComponent" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MonthView from './MonthView.vue';
import WeekView from './WeekView.vue';
import AgendaView from './AgendaView.vue';

const currentView = ref('month');

const currentViewComponent = computed(() => {
  switch (currentView.value) {
    case 'month':
      return MonthView;
    case 'week':
      return WeekView;
    case 'agenda':
      return AgendaView;
    default:
      return MonthView;
  }
});

function onViewChange(view: string) {
  // 记录用户偏好
}
</script>
```

# 附录

## A. 推荐的 npm 依赖包

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.4.0",
    "@element-plus/icons-vue": "^2.3.0",
    "dayjs": "^1.11.0",
    "better-sqlite3": "^9.2.0",
    "electron-store": "^8.1.0",
    "node-schedule": "^2.1.0",
    "fluent-ffmpeg": "^2.1.0",
    "ffmpeg-static": "^5.2.0",
    "uuid": "^9.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "electron-vite": "^2.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "vitest": "^1.1.0",
    "playwright": "^1.40.0"
  }
}
```

## B. 项目目录结构

```
V-Calendar/
├── electron/                    # Electron主进程代码
│   ├── main.ts                 # 主进程入口
│   ├── preload.ts              # 预加载脚本
│   ├── ipc/                    # IPC处理器
│   │   ├── schedule.ts
│   │   ├── alarm.ts
│   │   └── config.ts
│   ├── services/               # 主进程服务
│   │   ├── databaseService.ts
│   │   ├── alarmService.ts
│   │   ├── trayManager.ts
│   │   └── fileManager.ts
│   └── utils/
│       └── windowManager.ts
├── src/                        # 渲染进程代码 (Vue应用)
│   ├── main.ts                # Vue应用入口
│   ├── App.vue
│   ├── views/                 # 页面组件
│   │   ├── CalendarView.vue
│   │   ├── ScheduleView.vue
│   │   ├── SettingsView.vue
│   │   └── ConversationView.vue
│   ├── components/            # 通用组件
│   │   ├── calendar/
│   │   ├── schedule/
│   │   ├── alarm/
│   │   └── common/
│   ├── stores/                # Pinia状态管理
│   │   ├── schedule.ts
│   │   ├── alarm.ts
│   │   ├── config.ts
│   │   └── conversation.ts
│   ├── services/              # 渲染进程服务
│   │   ├── sttService.ts
│   │   ├── llmService.ts
│   │   └── holidayService.ts
│   ├── utils/                 # 工具函数
│   │   ├── dateParser.ts
│   │   ├── lunarCalendar.ts
│   │   └── audioConverter.ts
│   ├── types/                 # TypeScript类型定义
│   │   ├── schedule.ts
│   │   ├── alarm.ts
│   │   └── config.ts
│   ├── router/                # 路由配置
│   │   └── index.ts
│   ├── styles/                # 全局样式
│   │   ├── variables.css
│   │   └── global.css
│   └── assets/                # 静态资源
│       ├── images/
│       └── sounds/
├── resources/                  # 应用资源
│   ├── sounds/
│   │   ├── alarm.mp3
│   │   └── notification.mp3
│   ├── icons/
│   │   ├── tray.png
│   │   └── alarm.png
│   └── schema.sql             # 数据库初始化脚本
├── backend/                    # AI后端服务 (可选)
│   ├── langgraph_workflow/
│   │   ├── schedule_workflow.py
│   │   └── nodes.py
│   ├── services/
│   │   └── schedule_service.py
│   └── requirements.txt
├── electron.vite.config.ts     # electron-vite配置
├── package.json
├── tsconfig.json
└── README.md
```

## C. 环境变量配置

```bash
# .env.development
VITE_APP_TITLE=V-Calendar
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEVTOOLS=true

# .env.production
VITE_APP_TITLE=V-Calendar
VITE_API_BASE_URL=
VITE_ENABLE_DEVTOOLS=false

# .env.local (本地配置，不提交)
OPENAI_API_KEY=your-api-key-here
CLAUDE_API_KEY=your-api-key-here
```

## D. 开发与构建

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产构建
npm run build

# 打包应用
npm run build:win

# 运行测试
npm run test

# 代码检查
npm run lint
```

## E. 注意事项

1. **Electron安全**：所有Node.js API调用必须通过contextBridge暴露
2. **数据库初始化**：首次启动时自动创建数据库和表结构
3. **离线支持**：节假日数据需要定期同步更新
4. **音频处理**：ffmpeg静态文件较大，首次构建可能较慢
5. **模型文件**：离线语音识别模型需要单独下载配置
