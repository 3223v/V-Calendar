import type { NLUEngine, NLUResult, ExistingEvent } from './nlu.interface'
import type { CRUDOperation } from '../../types/conversation'
import { Annotation, StateGraph, END } from '@langchain/langgraph'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '../../utils/logger'

const log = createLogger('LangGraphNLU')

// ─── Workflow State ───────────────────────────────────────────────────

const NLUState = Annotation.Root({
  text: Annotation<string>,
  source: Annotation<'nlu'>,
  llmResponse: Annotation<string>,
  operations: Annotation<CRUDOperation[]>,
  error: Annotation<string | null>,
  baseUrl: Annotation<string>,
  apiKey: Annotation<string>,
  model: Annotation<string>,
  images: Annotation<string[]>,
  supportsImage: Annotation<boolean>,
  existingEvents: Annotation<ExistingEvent[]>
})

type NLUStateType = typeof NLUState.State

// ─── Prompts ─────────────────────────────────────────────────────────

const IMAGE_TYPES = [
  { type: 'calendar_screenshot', desc: '日历截图', patterns: ['月历', '周历', '日历界面', 'CALENDAR'] },
  { type: 'event_invitation', desc: '会议/活动邀请', patterns: ['会议', '邀请', 'Meeting', 'Invitation', '邀请函', 'meeting'] },
  { type: 'activity_poster', desc: '活动海报', patterns: ['活动', '报名', '时间', '地点', '活动详情', 'poster'] },
  { type: 'schedule_notice', desc: '日程通知', patterns: ['日程', '提醒', 'Schedule', 'Reminder', 'notice'] },
  { type: 'receipt', desc: '收据/订单', patterns: ['订单', '预约', '购票', '购买', 'receipt'] },
  { type: 'screenshot', desc: '通用截图', patterns: ['截图', '截图内容', 'screen'] },
  { type: 'unknown', desc: '未知类型', patterns: [] }
]

const DATE_EXTRACT_HINTS = `
## 日期提取策略
1. **显式日期**: 年月日直接提取（如"2024年5月1日" → 2024-05-01）
2. **相对日期**: 明天(+1)、后天(+2)、下周(+7)、本月(+30)、下周X(next X)
3. **星期计算**: 本周内"周X"直接算；跨周"下周三"→+7天
4. **节假日**: 元旦(1-1)、春节(农历)、清明(4-4/5)、劳动节(5-1)、端午(农历)、中秋(农历)、国庆(10-1)
5. **时间段**: 上午(09:00)、中午(12:00)、下午(14:00)、晚上(19:00)、凌晨(06:00)
6. **时段关键词**: 早上/早晨→09:00、上午→10:00、下午→14:00、傍晚/黄昏→17:00、晚上/夜间→19:00
7. **日期模糊**: 仅有月份→该月1日；仅有"这几天"→今天到+3天

## 图片常见日期格式
- "5月1日"、"5.1"、"05/01"、"2024/05/01"、"2024-05-01"
- "May 1st"、"1 May"、"Mon, May 1"
- "周一至周五"、"工作日 9:00-18:00"
- "本月"、"本月内"、"近期"、"本周末"
- "每周末"、"每周三"、"每月15号"、"每年生日"
`

const IMAGE_ANALYSIS_PROMPT = `
## 图片日程提取指南

### 识别图片类型
仔细判断图片属于以下哪种类型，并按对应策略提取：

**1. 日历截图**
- 提取所有可见日期的事件标记
- 注意月份标题确定月份
- 提取图例/说明中的事件列表

**2. 会议邀请/邮件截图**
- 标题：会议名称、研讨会标题
- 时间：具体日期时间（含时区）
- 地点：线下地址或线上链接
- 组织者/参与者信息可作为描述

**3. 活动海报**
- 大标题/副标题作为事件名称
- 日期、时间、地点（按优先级提取）
- 票价/报名信息放入描述

**4. 火车票/机票/电影票**
- 出发/到达日期 → 事件日期
- 航班号/座位号 → 描述
- 注意返程日期可能需要创建返程事件

**5. 订单截图/收据**
- 预约日期 → 事件日期
- 商家名称 → 事件标题
- 取票号/验证码 → 描述

**6. 通用截图**
- 尽可能识别文字中的日期和时间
- 屏幕截图中的任何日程相关信息

### 图片质量处理
- 图片模糊时，根据上下文推断最可能的日期
- 部分信息缺失时，使用合理的默认值：
  - 未指定时间 → isAllDay: true
  - 未指定年份 → 使用当前年份或上下文推断
  - 单日活动 → endDate = startDate
`

const FEW_SHOT_EXAMPLES = `
## 输出示例

**示例1：简单创建**
输入："明天上午9点开会"
输出：{"operations":[{"type":"create","confidence":0.95,"event":{"title":"开会","description":"","startDate":"2024-05-02","endDate":"2024-05-02","startTime":"09:00","endTime":"10:00","isAllDay":false,"category":"work","location":null}}]}

**示例2：带地点**
输入："周五晚上7点去体育馆打篮球"
输出：{"operations":[{"type":"create","confidence":0.92,"event":{"title":"打篮球","description":"","startDate":"2024-05-03","endDate":"2024-05-03","startTime":"19:00","endTime":"21:00","isAllDay":false,"category":"personal","location":"体育馆"}}]}

**示例3：生日/纪念**
输入："5月20日是结婚纪念日"
输出：{"operations":[{"type":"create","confidence":0.9,"event":{"title":"结婚纪念日","description":"","startDate":"2024-05-20","endDate":"2024-05-20","startTime":null,"endTime":null,"isAllDay":true,"category":"holiday","location":null}}]}

**示例4：图片分析**
输入：[会议邀请图片]
输出：{"operations":[{"type":"create","confidence":0.88,"event":{"title":"产品评审会议","description":"讨论Q2产品路线图","startDate":"2024-05-15","endDate":"2024-05-15","startTime":"14:00","endTime":"15:30","isAllDay":false,"category":"work","location":"线上会议"}}]}

**示例5：查询**
输入："下周有什么安排？"
输出：{"operations":[{"type":"query","confidence":0.9,"event":{"title":"","description":"","startDate":"2024-05-06","endDate":"2024-05-12","startTime":null,"endTime":null,"isAllDay":true,"category":"personal","location":null}}]}

**示例6：删除**
输入："取消明天的会议"
输出：{"operations":[{"type":"delete","confidence":0.85,"event":{"title":"会议","description":"","startDate":"2024-05-02","endDate":"2024-05-02","startTime":null,"endTime":null,"isAllDay":true,"category":"work","location":null}}]}

**示例7：多事件**
输入："这周要完成项目汇报，周三下午3点；还要给妈妈打电话，周五晚上"
输出：{"operations":[{"type":"create","confidence":0.92,"event":{"title":"项目汇报","description":"","startDate":"2024-05-01","endDate":"2024-05-01","startTime":"15:00","endTime":"16:00","isAllDay":false,"category":"work","location":null}},{"type":"create","confidence":0.88,"event":{"title":"给妈妈打电话","description":"","startDate":"2024-05-03","endDate":"2024-05-03","startTime":"19:00","endTime":"20:00","isAllDay":false,"category":"personal","location":null}}]}
`

function buildSystemPrompt(hasImages: boolean, existingEvents: ExistingEvent[]): string {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const year = now.getFullYear()

  let prompt = `你是专业的日历助手，专门从用户的自然语言和图片中提取日程信息，并将其解析为可执行的日历操作。

当前日期信息：
- 日期: ${today}
- 时间: ${time}
- 今天是星期${weekdays[now.getDay()]}
- 年份: ${year}

## 核心能力
1. 精准解析中文日期时间表达
2. 从各种类型的图片中提取日程信息
3. 识别用户意图（创建/修改/删除/查询）
4. 处理模糊和不完整的时间信息

## 操作类型识别
| 用户意图关键词 | 操作类型 |
|--------------|---------|
| 创建/添加/安排/开会/约/提醒/计划/去/参加/参加 | create |
| 改/修改/变更/调整/推迟/提前/改期/改时间 | update |
| 删除/取消/去掉/移除/不要了/删掉 | delete |
| 查询/查看/有什么/找/显示/列出/日程/安排/这周/下周 | query |

**注意**：无法明确判断时返回空 operations[]。

${DATE_EXTRACT_HINTS}`

  if (hasImages) {
    prompt += `\n${IMAGE_ANALYSIS_PROMPT}\n`
  }

  if (existingEvents.length > 0) {
    const eventList = existingEvents
      .slice(0, 20)
      .map((e) => `- "${e.title}" (${e.startDate}${e.startTime ? ' ' + e.startTime : ''})`)
      .join('\n')
    prompt += `
## 已有事件参考
${eventList}
- 删除/修改时，优先匹配已有事件标题
- 查询时，使用关键词进行模糊匹配
- 如果用户提到的事件与已有事件相似，考虑是否是修改操作`
  }

  prompt += `\n${FEW_SHOT_EXAMPLES}

## 重要规则
1. **时间解析优先级**：具体时间 > 上午/下午/晚上 > 日期
2. **置信度评分**：
   - 信息完整且明确：0.9-1.0
   - 有部分缺失但可合理推断：0.7-0.85
   - 信息模糊/不确定：0.5-0.65
   - 仅凭图片猜测：0.4-0.6
3. **未指定时间处理**：
   - 未指定具体时间 → isAllDay: true
   - 未指定结束时间 → 默认为开始时间+1小时
   - 未指定结束日期 → endDate = startDate
4. **分类判断**：
   - 工作/会议/汇报/项目/职场 → work
   - 生日/节日/纪念日/传统节日 → holiday
   - 重要/紧急/截止/deadline → important
   - 其他 → personal

严格返回标准JSON格式，不要包含任何解释性文本：
{"operations":[{"type":"create|update|delete|query","confidence":0.0-1.0,"event":{"title":"必填","description":"可选","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","startTime":"HH:MM或null","endTime":"HH:MM或null","isAllDay":true|false,"category":"work|personal|holiday|important","location":"可选或null"}}]}`

  return prompt
}

// ─── Nodes ───────────────────────────────────────────────────────────

/** 前置校验：过滤空输入（允许仅图片输入） */
async function preprocess(state: NLUStateType): Promise<Partial<NLUStateType>> {
  log.info('[Preprocess] input:', state.text, '| images:', state.images?.length || 0)
  if (!state.text.trim() && (!state.images || state.images.length === 0)) {
    return { error: 'empty_input' }
  }
  return { error: null }
}

/** 核心节点：调用 LLM 完成全量解析 */
async function llmParse(state: NLUStateType): Promise<Partial<NLUStateType>> {
  if (state.error) return {}

  const hasImages = state.supportsImage && state.images && state.images.length > 0
  log.info('[LLM] calling:', state.baseUrl, '| model:', state.model, '| supportsImage:', state.supportsImage, '| images in state:', state.images?.length || 0, '| hasImages:', hasImages, '| events:', state.existingEvents?.length || 0)
  const url = `${state.baseUrl.replace(/\/$/, '')}/chat/completions`

  let userMessage: any
  if (hasImages && state.images && state.images.length > 0) {
    const contentParts: any[] = state.images.map((imgUrl) => ({
      type: 'image_url',
      image_url: { url: imgUrl, detail: 'high' }
    }))

    if (state.text.trim()) {
      contentParts.push({
        type: 'text',
        text: `请分析图片中的日程信息，并结合以下用户指令：\n"${state.text.trim()}"\n\n请从图片中提取所有与日程相关的信息，包括：日期、时间、事件名称、地点、参与者等。如果图片质量不佳或信息不完整，请根据上下文合理推断。`
      })
    } else {
      contentParts.push({
        type: 'text',
        text: `请仔细分析这张图片，识别其中的日程信息。需要提取的内容包括：
1. **事件名称**：如会议名称、活动名称等
2. **日期时间**：具体日期和开始/结束时间
3. **地点**：线下地址或线上会议链接
4. **其他信息**：参与者、备注等

如果图片中没有明显的日程信息，请尝试识别：
- 日历/日程表截图
- 会议邀请/邮件
- 活动海报
- 火车票/机票/电影票
- 订单/收据截图

请以JSON格式输出提取到的日程信息。`
      })
    }
    userMessage = { role: 'user', content: contentParts }
  } else {
    userMessage = { role: 'user', content: state.text || '请分析这个指令并提取日程信息' }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.apiKey}`
      },
      body: JSON.stringify({
        model: state.model,
        messages: [
          { role: 'system', content: buildSystemPrompt(!!hasImages, state.existingEvents || []) },
          userMessage
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: hasImages ? 2048 : 1024
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      log.error('[LLM] HTTP error:', res.status, errText)
      return { error: `LLM API error ${res.status}: ${errText}` }
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    log.info('[LLM] response:', content)
    return { llmResponse: content }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error('[LLM] fetch failed:', msg)
    return { error: msg }
  }
}

/** 后置节点：解析 LLM JSON → CRUDOperation[] */
async function assemble(state: NLUStateType): Promise<Partial<NLUStateType>> {
  const hasImages = state.images && state.images.length > 0

  if (state.error || !state.llmResponse) {
    log.warn('[Assemble] using local fallback, error:', state.error)
    const today = new Date().toISOString().slice(0, 10)
    let title = '图片中的事件'
    let confidence = 0.4

    if (state.text.trim()) {
      title = state.text.trim()
      confidence = 0.6
    }

    return {
      operations: [{
        id: uuidv4(),
        source: state.source,
        confidence,
        type: 'create',
        status: 'pending' as const,
        event: {
          title,
          startDate: today,
          endDate: today,
          isAllDay: true,
          category: 'personal'
        }
      }]
    }
  }

  try {
    let content = state.llmResponse.trim()

    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      content = codeBlockMatch[1].trim()
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      content = jsonMatch[0]
    }

    const parsed = JSON.parse(content)

    const rawOps = Array.isArray(parsed) ? parsed : parsed.operations || []

    if (rawOps.length === 0) {
      log.info('[Assemble] LLM returned empty operations array')
      return {
        operations: [{
          id: uuidv4(),
          source: state.source,
          confidence: 0.3,
          type: 'create',
          status: 'pending' as const,
          event: {
            title: '从图片提取的事件',
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            isAllDay: true,
            category: 'personal'
          }
        }]
      }
    }

    const ops: CRUDOperation[] = rawOps
      .filter((op: any) => {
        if (!op?.type || !['create', 'update', 'delete', 'query'].includes(op.type)) return false
        if (!op?.event?.startDate) return false
        return true
      })
      .map((op: any) => {
        const title = op.event.title?.trim() || (hasImages ? '从图片提取的事件' : '未命名事件')
        const hasTime = op.event.startTime || op.event.endTime

        return {
          id: uuidv4(),
          source: state.source,
          confidence: Math.max(0.3, Math.min(1, op.confidence ?? (hasImages ? 0.7 : 0.8))),
          type: op.type as 'create' | 'update' | 'delete' | 'query',
          status: 'pending' as const,
          event: {
            title,
            description: op.event.description?.trim() || undefined,
            startDate: op.event.startDate,
            endDate: op.event.endDate || op.event.startDate,
            startTime: op.event.startTime || undefined,
            endTime: op.event.endTime || undefined,
            isAllDay: op.event.isAllDay ?? !hasTime,
            category: op.event.category || 'personal',
            location: op.event.location?.trim() || undefined
          }
        }
      })

    log.info('[Assemble] parsed', ops.length, 'operations')
    return { operations: ops }
  } catch (err) {
    log.error('[Assemble] JSON parse failed:', err, '| response:', state.llmResponse.substring(0, 200))
    const today = new Date().toISOString().slice(0, 10)
    let title = '从图片提取的事件'
    let confidence = 0.4

    if (state.text.trim()) {
      title = state.text.trim()
      confidence = 0.5
    }

    return {
      operations: [{
        id: uuidv4(),
        source: state.source,
        confidence,
        type: 'create',
        status: 'pending' as const,
        event: {
          title,
          startDate: today,
          endDate: today,
          isAllDay: true,
          category: 'personal'
        }
      }]
    }
  }
}

// ─── Routing ─────────────────────────────────────────────────────────

function routeAfterPreprocess(state: NLUStateType): string {
  return state.error ? 'assemble' : 'llm'
}

// ─── Build Workflow ──────────────────────────────────────────────────

function buildWorkflow() {
  const graph = new StateGraph(NLUState)
    .addNode('preprocess', preprocess)
    .addNode('llm', llmParse)
    .addNode('assemble', assemble)
    .addEdge('__start__', 'preprocess')
    .addConditionalEdges('preprocess', routeAfterPreprocess, {
      llm: 'llm',
      assemble: 'assemble'
    })
    .addEdge('llm', 'assemble')
    .addEdge('assemble', END)

  return graph.compile()
}

// ─── Engine ──────────────────────────────────────────────────────────

export class LangGraphNLU implements NLUEngine {
  readonly name = 'LangGraph NLU'

  private baseUrl = ''
  private apiKey = ''
  private model = ''
  private _supportsImage = false

  configure(baseUrl: string, apiKey: string, model: string): void {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.model = model
    log.info('Configured:', { baseUrl, apiKey: apiKey ? '***' : '(empty)', model, available: this.isAvailable() })
  }

  setSupportsImage(flag: boolean): void {
    this._supportsImage = flag
  }

  isAvailable(): boolean {
    return !!(this.baseUrl && this.apiKey && this.model)
  }

  async parse(text: string, source: 'nlu', images?: string[], existingEvents?: ExistingEvent[]): Promise<NLUResult> {
    const hasImages = images && images.length > 0
    log.info('parse() called | available:', this.isAvailable(), '| text:', text, '| images:', hasImages ? images!.length : 0, '| events:', existingEvents?.length || 0)

    if (!this.isAvailable()) {
      log.warn('NLU not configured, using local fallback')
      return this.parseLocal(text, source)
    }

    try {
      const app = buildWorkflow()
      const result = await app.invoke({
        text,
        source,
        llmResponse: '',
        operations: [],
        error: null,
        baseUrl: this.baseUrl,
        apiKey: this.apiKey,
        model: this.model,
        images: images || [],
        supportsImage: this._supportsImage,
        existingEvents: existingEvents || []
      })

      return { operations: result.operations, rawText: text, source }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('Workflow error:', msg)
      return this.parseLocal(text, source)
    }
  }

  private parseLocal(text: string, source: 'nlu'): NLUResult {
    const today = new Date().toISOString().slice(0, 10)
    return {
      operations: [{
        id: uuidv4(),
        source,
        confidence: 0.5,
        type: 'create',
        status: 'pending' as const,
        event: {
          title: text.trim(),
          startDate: today,
          endDate: today,
          isAllDay: true,
          category: 'personal'
        }
      }],
      rawText: text,
      source
    }
  }
}

export const langGraphNLU = new LangGraphNLU()
