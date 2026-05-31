# 自然语言理解（NLU）系统

## 概述

V-Calendar 的 NLU 系统基于 **LangGraph** 工作流和 **LLM** 实现，能够将用户的自然语言指令解析为日历操作（创建、更新、删除事件）。系统支持上下文感知，能够利用历史对话和现有事件进行智能匹配。

## 系统架构

### 文件结构

```
valendar/src/renderer/src/services/nlu/
├── nlu.interface.ts        # NLU 接口定义
├── nlu-manager.ts          # NLU 管理器
└── langgraph-nlu.ts       # LangGraph NLU 实现
```

### 核心接口

```typescript
interface NLUContext {
  recentMessages: ConversationMessage[]  // 最近对话消息（最多10条）
  recentOperations: CRUDOperation[]      // 最近执行的操作（最多10条）
  upcomingEvents: CalendarEvent[]         // 即将到来的事件（当前时间后，最多100条）
  currentTime: string                     // 当前时间戳
}

interface NLUEngine {
  readonly name: string
  parse(text: string, source: 'nlu', context?: NLUContext): Promise<NLUResult>
  isAvailable(): boolean
}

interface NLUResult {
  operations: CRUDOperation[]  // 解析出的操作列表
  rawText: string             // 原始输入文本
  source: 'nlu'              // 来源标识
}
```

## 数据流转流程

### 完整流程图

```
┌──────────────────────────────────────────────────────────────────┐
│                        用户输入                                  │
│              (语音/文字："取消明天的早八")                       │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    1. 输入预处理 (Preprocess)                    │
│  - 验证输入非空                                                   │
│  - 记录日志                                                       │
│  - 如果为空 → 直接返回空操作                                       │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    2. 上下文构建 (Context)                       │
│  - 获取最近10条对话消息                                           │
│  - 获取最近10个操作历史                                           │
│  - 获取当前时间后100个事件                                        │
│  - 组装 NLUContext                                                │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    3. 提示词构建 (Prompt)                        │
│  - 基础系统提示词                                                 │
│  - 核心规则（删除必须匹配现有事件）                                │
│  - 历史对话上下文                                                 │
│  - 操作历史                                                       │
│  - 即将到来的事件列表                                             │
│  - 匹配规则和置信度说明                                           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    4. LLM 调用 (LLM Parse)                      │
│  - 构建 OpenAI 兼容 API 请求                                       │
│  - 发送用户输入 + 上下文提示                                       │
│  - 接收 JSON 格式响应                                              │
│  - 处理 API 错误                                                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    5. 结果组装 (Assemble)                        │
│  - 解析 LLM JSON 响应                                             │
│  - 验证操作有效性                                                 │
│  - 过滤无效的删除/修改操作（无匹配事件时）                         │
│  - 转换为 CRUDOperation 对象                                      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    6. 结果输出                                   │
│              NLUResult { operations[], rawText }                 │
└──────────────────────────────────────────────────────────────────┘
```

## 各阶段详解

### 1. 输入预处理 (Preprocess)

**职责**：
- 验证用户输入非空
- 记录日志
- 决定是否继续处理

**代码逻辑**：

```typescript
async function preprocess(state: NLUStateType): Promise<Partial<NLUStateType>> {
  log.info('[Preprocess] input:', state.text)
  if (!state.text.trim()) {
    return { error: 'empty_input' }
  }
  return { error: null }
}
```

**决策**：
- 如果输入为空 → 跳转到 assemble（返回空操作）
- 如果输入有效 → 继续调用 LLM

### 2. 上下文构建

**在 ConversationStore 中构建**：

```typescript
const context: NLUContext = {
  recentMessages: session.messages.slice(-10),           // 最近10条消息
  recentOperations: getRecentOperations(),               // 最近10个操作
  upcomingEvents: eventStore.events.filter(e =>         // 未来100个事件
    e.startDate >= today
  ).slice(0, 100).sort(...),
  currentTime: new Date().toISOString()
}
```

### 3. 提示词构建

#### 基础提示词

```markdown
你是日历助手，将用户的自然语言解析为日历操作。

当前日期: 2024-01-15
当前时间: 14:30
今天是星期二
```

#### 核心规则（最重要）

```markdown
【最重要】必须先判断能否匹配到有效事件，再决定是否生成操作！
- 删除/取消操作：必须能匹配到现有事件才能生成delete操作
- 修改操作：必须能匹配到现有事件才能生成update操作
- 如果无法匹配到任何现有事件 → 返回空 operations
- 绝对不能凭空捏造不存在的删除或修改操作！
```

#### 操作类型

```markdown
## 操作类型
- 创建/添加/安排/开会/约/提醒/计划 → "create"
- 改/修改/变更/调整/推迟/提前 → "update"
- 删除/取消/去掉/移除/不要了 → "delete"
- 无法判断或无匹配事件 → 返回空 operations
```

#### 匹配规则

```markdown
## 匹配规则
当用户说"取消XX"、"删除XX"、"改XX时间"等模糊指令时：
1. 在下方【即将到来的日程】中查找是否存在匹配事件
2. 匹配依据：标题相似度（关键词匹配）、时间接近度
3. 能匹配到 → 生成对应操作
4. 无法匹配 → 返回空 operations，并在思考中说明原因
```

#### 时间规则

```markdown
## 时间
- 相对: 明天=+1天, 后天=+2天, 下周X=下一个X, 下个月=+1月
- 上午→09:00, 下午→14:00, 晚上→19:00
- 未指定日期→当天, 未指定时间→isAllDay:true
- 未指定结束→endDate=startDate, endTime=startTime+1h
```

#### 类别规则

```markdown
## 类别
- 工作/会议/项目/汇报→"work"
- 生日/节日/纪念→"holiday"
- 重要/紧急/截止→"important"
- 其他→"personal"
```

#### 置信度规则

```markdown
## 置信度
- 信息完整+能匹配到事件→0.9-1.0
- 部分缺失+能匹配→0.6-0.8
- 猜测（无匹配）→0.1-0.3
```

#### 历史对话上下文

```markdown
## 最近对话历史（用于理解上下文）
[1] 用户: 明天下午三点开会
    [操作: create(开会)]
[2] 助手: 已为您创建"开会"事件
[3] 用户: 取消明天的早八

【重要】如果用户在取消/删除某个事件，需结合历史对话判断这个事件是否存在。
```

#### 即将到来的事件

```markdown
## 即将到来的日程（必须严格参考）
[1] "开会" 日期: 2024-01-16 时间: 15:00 [work]
[2] "面试" 日期: 2024-01-17 时间: 14:00 [personal]

【关键】只有上述列表中的事件才能被删除或修改！如果用户提到的内容不在列表中，返回空 operations。
```

#### 输出格式

```markdown
严格返回 JSON（无匹配事件时operations数组为空）：
{"operations":[{"type":"create|update|delete","confidence":0.0-1.0,"event":{"title":"必填","description":"可选","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","startTime":"HH:MM或null","endTime":"HH:MM或null","isAllDay":true/false,"category":"work|personal|holiday|important|custom","location":"可选或null"}}]}
```

### 4. LLM 调用

**请求格式**：

```typescript
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'mimo-v2.5',                    // 可配置
    messages: [
      { role: 'system', content: buildSystemPrompt(context) },
      { role: 'user', content: '取消明天的早八' }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1                       // 低温度保证稳定性
  })
})
```

**LLM 响应示例**：

```json
{
  "operations": [
    {
      "type": "delete",
      "confidence": 0.9,
      "event": {
        "title": "早八",
        "startDate": "2024-01-16",
        "endDate": "2024-01-16",
        "startTime": "08:00",
        "endTime": "09:00",
        "isAllDay": false,
        "category": "personal"
      }
    }
  ]
}
```

**无匹配时响应**：

```json
{
  "operations": []
}
```

### 5. 结果组装 (Assemble)

**职责**：
- 解析 LLM JSON 响应
- 验证操作有效性
- 过滤无效操作
- 转换为标准 CRUDOperation 格式

**验证逻辑**：

```typescript
const hasUpcomingEvents = state.context?.upcomingEvents?.length > 0

let ops: CRUDOperation[] = parsed.operations
  .filter((op: any) => {
    // 基本验证
    if (!op?.type || !op?.event?.title || !op?.event?.startDate) {
      return false
    }

    // 删除/修改操作必须有匹配事件
    if ((op.type === 'delete' || op.type === 'update') && !hasUpcomingEvents) {
      log.info('[Assemble] filtered out', op.type, 'operation: no upcoming events')
      return false
    }

    return true
  })
  .map((op: any) => ({
    id: uuidv4(),
    source: 'nlu',
    confidence: Math.max(0, Math.min(1, op.confidence ?? 0.7)),
    type: op.type,
    event: { ...op.event }
  }))

// 最终检查：确保无匹配时不返回 delete/update
if (!hasUpcomingEvents) {
  ops = ops.filter(op => op.type === 'create')
}
```

### 6. 输出格式

```typescript
interface NLUResult {
  operations: CRUDOperation[]
  rawText: string
  source: 'nlu'
}

interface CRUDOperation {
  id: string                    // 操作唯一ID
  source: 'nlu'                 // 来源
  confidence: number            // 置信度 0-1
  type: 'create' | 'update' | 'delete'
  event: {
    title: string
    description?: string
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
    isAllDay: boolean
    category: EventCategory
    location?: string
  }
  executed?: boolean            // 是否已执行
  error?: string                // 错误信息
}
```

## 历史记录和事件注入流程

### 上下文注入时机

**每次调用 `nluManager.parse()` 时都会构建完整上下文**：

```typescript
// conversation.store.ts
async function processTextInput(text: string): Promise<void> {
  // 1. 添加用户消息
  addMessage({ role: 'user', content: text, ... })

  // 2. 构建上下文
  const context = buildContext()

  // 3. 调用 NLU（传入上下文）
  const result = await nluManager.parse(text, 'nlu', context)

  // 4. 添加助手响应消息
  if (result.operations.length > 0) {
    addResultMessage('识别到X个操作', result.operations)
  } else {
    addErrorMessage('未能解析出可执行操作')
  }
}
```

### 上下文数据来源

#### 最近10条对话消息

```typescript
const recentMessages = session.messages.slice(-10)
```

**用途**：
- 理解用户当前意图的上下文
- 判断模糊指代的"那个"、"之前"等指代词
- 了解用户最近的创建操作

**示例**：
```
[1] 用户: 明天下午三点开会
[2] 助手: 已创建"开会"事件
[3] 用户: 取消它
→ 系统知道"它"指代"开会"事件
```

#### 最近10个操作历史

```typescript
const allOperations: CRUDOperation[] = []
sessions.value.forEach(s => {
  allOperations.push(...s.crudOperations)
})
const recentOperations = allOperations
  .sort((a, b) => (a.id > b.id ? -1 : 1))
  .slice(0, 10)
```

**用途**：
- 了解用户最近执行的操作类型
- 判断是否有重复操作
- 辅助理解用户意图

**示例**：
```
最近操作：
[1] create: "开会" (已执行)
[2] delete: "早八" (失败 - 事件不存在)
```

#### 即将到来的100个事件

```typescript
const upcomingEvents = eventStore.events
  .filter(e => e.startDate >= today)
  .sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
    return (a.startTime || '').localeCompare(b.startTime || '')
  })
  .slice(0, 100)
```

**用途**：
- **删除/修改操作必须匹配**：只有列表中的事件才能被删除或修改
- **智能匹配**：当用户说"取消开会"，系统会在列表中查找匹配事件
- **冲突检测**：创建新事件时可检测时间冲突

**示例**：
```
即将到来的日程：
[1] "开会" 日期: 2024-01-16 时间: 15:00 [work]
[2] "面试" 日期: 2024-01-17 时间: 14:00 [personal]

用户: 取消开会
→ 匹配到 [1]，生成 delete 操作

用户: 取消周会
→ 无匹配，返回空操作
```

### 智能匹配规则

系统使用以下策略进行事件匹配：

1. **标题相似度**
   - 关键词匹配（"开会" 匹配 "产品会议"）
   - 忽略语气词和连接词
   - 支持模糊匹配

2. **时间接近度**
   - 用户提到的时间与事件时间匹配
   - 明天/后天等相对时间的解析

3. **上下文优先**
   - 最近创建的同类事件优先匹配
   - 历史对话中提到的事件优先

### 错误处理流程

```
用户输入: "取消明天的早八"

1. 系统检查 upcomingEvents
   → 列表为空

2. 提示词指导:
   "【关键】目前没有任何即将到来的日程！
    所有删除/修改操作都应返回空 operations。"

3. LLM 响应:
   → 返回空 operations

4. assemble 验证:
   → 删除操作已过滤
   → 返回空操作列表

5. 用户提示:
   → "未能解析出可执行操作，请检查事件是否存在"
```

## 配置与扩展

### 支持的 LLM

系统使用 OpenAI 兼容 API，支持：
- 智谱 GLM 系列
- DeepSeek
- 月之暗面 Moonshot
- 本地部署的 LLM

### 配置方式

```typescript
nluManager.configure({
  baseUrl: 'https://api.xiaomimimo.com/v1',
  apiKey: 'your-api-key',
  model: 'mimo-v2.5'
})
```

### 扩展新的 NLU 引擎

1. 创建新的实现文件（如 `custom-nlu.ts`）
2. 实现 `NLUEngine` 接口
3. 在 `nlu-manager.ts` 中注册

```typescript
class CustomNLU implements NLUEngine {
  readonly name = 'Custom NLU'

  async parse(text: string, source: 'nlu', context?: NLUContext): Promise<NLUResult> {
    // 自定义实现
    return { operations: [], rawText: text, source }
  }

  isAvailable(): boolean {
    return true
  }
}

nluManager.register(new CustomNLU())
```

## 性能优化

### 上下文大小控制

- 消息：最多 10 条
- 操作历史：最多 10 条
- 事件列表：最多 100 条
- 文本截断：消息内容最多 100 字符

### 缓存策略

- LLM 响应可选缓存
- 相似查询可复用结果
- 上下文可预加载

### 错误降级

```typescript
async function parse(text: string, source: 'nlu', context?: NLUContext): Promise<NLUResult> {
  try {
    // 尝试 LLM 解析
    return await llmParse(text, context)
  } catch (error) {
    log.error('LLM failed, using fallback:', error)
    // 降级到本地正则解析
    return parseLocal(text, source)
  }
}
```

## 更新日志

- **2024-01**：初始版本，基于 LangGraph 工作流
- **2024-01**：添加上下文感知，支持历史记录和事件注入
- **2024-01**：增强删除/修改操作验证，防止操作不存在的的事件
