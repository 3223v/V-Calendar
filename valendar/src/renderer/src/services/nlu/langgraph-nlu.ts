import type { NLUEngine, NLUResult, NLUContext } from './nlu.interface'
import type { CRUDOperation } from '../../types/conversation'
import { Annotation, StateGraph, END } from '@langchain/langgraph'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '../../utils/logger'

const log = createLogger('LangGraphNLU')

const NLUState = Annotation.Root({
  text: Annotation<string>,
  source: Annotation<'nlu'>,
  llmResponse: Annotation<string>,
  operations: Annotation<CRUDOperation[]>,
  error: Annotation<string | null>,
  baseUrl: Annotation<string>,
  apiKey: Annotation<string>,
  model: Annotation<string>,
  context: Annotation<NLUContext | null>
})

type NLUStateType = typeof NLUState.State

function buildSystemPrompt(context?: NLUContext | null): string {
  const now = context?.currentTime ? new Date(context.currentTime) : new Date()
  const today = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  let prompt = `你是日历助手，将用户的自然语言解析为日历操作。

当前日期: ${today}
当前时间: ${time}
今天是星期${weekdays[now.getDay()]}

## 核心规则
【最重要】必须先判断能否匹配到有效事件，再决定是否生成操作！
- 删除/取消操作：必须能匹配到现有事件才能生成delete操作
- 修改操作：必须能匹配到现有事件才能生成update操作
- 如果无法匹配到任何现有事件 → 返回空 operations
- 绝对不能凭空捏造不存在的删除或修改操作！

## 操作类型
- 创建/添加/安排/开会/约/提醒/计划 → "create"
- 改/修改/变更/调整/推迟/提前 → "update"
- 删除/取消/去掉/移除/不要了 → "delete"
- 无法判断或无匹配事件 → 返回空 operations

## 匹配规则
当用户说"取消XX"、"删除XX"、"改XX时间"等模糊指令时：
1. 在下方【即将到来的日程】中查找是否存在匹配事件
2. 匹配依据：标题相似度（关键词匹配）、时间接近度
3. 能匹配到 → 生成对应操作
4. 无法匹配 → 返回空 operations，并在思考中说明原因

## 时间
- 相对: 明天=+1天, 后天=+2天, 下周X=下一个X, 下个月=+1月
- 上午→09:00, 下午→14:00, 晚上→19:00
- 未指定日期→当天, 未指定时间→isAllDay:true
- 未指定结束→endDate=startDate, endTime=startTime+1h

## 类别
- 工作/会议/项目/汇报→"work"
- 生日/节日/纪念→"holiday"
- 重要/紧急/截止→"important"
- 其他→"personal"

## 置信度
- 信息完整+能匹配到事件→0.9-1.0
- 部分缺失+能匹配→0.6-0.8
- 猜测（无匹配）→0.1-0.3`

  if (context?.recentMessages && context.recentMessages.length > 0) {
    prompt += `\n\n## 最近对话历史（用于理解上下文）`
    const recentMsgs = context.recentMessages.slice(-10)
    recentMsgs.forEach((msg, i) => {
      const role = msg.role === 'user' ? '用户' : '助手'
      const contentPreview = msg.content.slice(0, 100)
      prompt += `\n[${i + 1}] ${role}: ${contentPreview}`
      if (msg.crudOperations && msg.crudOperations.length > 0) {
        const ops = msg.crudOperations.map(op => `${op.type}(${op.event.title})`).join(', ')
        prompt += ` [操作: ${ops}]`
      }
    })
    prompt += `\n\n【重要】如果用户在取消/删除某个事件，需结合历史对话判断这个事件是否存在。`
  }

  if (context?.recentOperations && context.recentOperations.length > 0) {
    prompt += `\n\n## 最近执行的操作`
    context.recentOperations.slice(-5).forEach((op, i) => {
      const status = op.executed ? '已执行' : '待执行'
      prompt += `\n[${i + 1}] ${op.type}: "${op.event.title}" (${status})`
      if (op.event.startDate) {
        prompt += ` 日期: ${op.event.startDate}`
        if (op.event.startTime) prompt += ` ${op.event.startTime}`
      }
    })
  }

  if (context?.upcomingEvents && context.upcomingEvents.length > 0) {
    prompt += `\n\n## 即将到来的日程（必须严格参考）`
    context.upcomingEvents.slice(0, 100).forEach((event, i) => {
      prompt += `\n[${i + 1}] "${event.title}"`
      prompt += ` 日期: ${event.startDate}`
      if (event.startTime) {
        prompt += ` ${event.startTime}`
        if (event.endTime) prompt += `-${event.endTime}`
      }
      if (event.category) prompt += ` [${event.category}]`
      if (event.location) prompt += ` 地点: ${event.location}`
    })
    prompt += `\n\n【关键】只有上述列表中的事件才能被删除或修改！如果用户提到的内容不在列表中，返回空 operations。`
  } else {
    prompt += `\n\n【关键】目前没有任何即将到来的日程！所有删除/修改操作都应返回空 operations。`
  }

  prompt += `\n\n严格返回 JSON（无匹配事件时operations数组为空）：
{"operations":[{"type":"create|update|delete","confidence":0.0-1.0,"event":{"title":"必填","description":"可选","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","startTime":"HH:MM或null","endTime":"HH:MM或null","isAllDay":true/false,"category":"work|personal|holiday|important|custom","location":"可选或null"}}]}`

  return prompt
}

async function preprocess(state: NLUStateType): Promise<Partial<NLUStateType>> {
  log.info('[Preprocess] input:', state.text)
  if (!state.text.trim()) {
    return { error: 'empty_input' }
  }
  return { error: null }
}

async function llmParse(state: NLUStateType): Promise<Partial<NLUStateType>> {
  if (state.error) return {}

  log.info('[LLM] calling:', state.baseUrl, '| model:', state.model)
  const url = `${state.baseUrl.replace(/\/$/, '')}/chat/completions`

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
          { role: 'system', content: buildSystemPrompt(state.context) },
          { role: 'user', content: state.text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
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

async function assemble(state: NLUStateType): Promise<Partial<NLUStateType>> {
  if (state.error || !state.llmResponse) {
    log.warn('[Assemble] using local fallback, error:', state.error)
    const today = new Date().toISOString().slice(0, 10)
    return {
      operations: [
        {
          id: uuidv4(),
          source: state.source,
          confidence: 0.5,
          type: 'create',
          event: {
            title: state.text.trim(),
            startDate: today,
            endDate: today,
            isAllDay: true,
            category: 'personal'
          }
        }
      ]
    }
  }

  try {
    const parsed = JSON.parse(state.llmResponse)
    const hasUpcomingEvents = state.context?.upcomingEvents && state.context.upcomingEvents.length > 0
    
    let ops: CRUDOperation[] = (parsed.operations || [])
      .filter((op: any) => {
        if (!op?.type || !op?.event?.title || !op?.event?.startDate) return false
        
        if ((op.type === 'delete' || op.type === 'update') && !hasUpcomingEvents) {
          log.info('[Assemble] filtered out', op.type, 'operation: no upcoming events')
          return false
        }
        
        return true
      })
      .map((op: any) => ({
        id: uuidv4(),
        source: state.source,
        confidence: Math.max(0, Math.min(1, op.confidence ?? 0.7)),
        type: op.type as 'create' | 'update' | 'delete',
        event: {
          title: op.event.title,
          description: op.event.description,
          startDate: op.event.startDate,
          endDate: op.event.endDate || op.event.startDate,
          startTime: op.event.startTime || undefined,
          endTime: op.event.endTime || undefined,
          isAllDay: op.event.isAllDay ?? true,
          category: op.event.category || 'personal',
          location: op.event.location || undefined
        }
      }))

    if (!hasUpcomingEvents && ops.some(op => op.type === 'delete' || op.type === 'update')) {
      log.info('[Assemble] no upcoming events, filtering all delete/update operations')
      ops = []
    }

    log.info('[Assemble] parsed', ops.length, 'operations (hasEvents:', hasUpcomingEvents, ')')
    return { operations: ops }
  } catch (err) {
    log.error('[Assemble] JSON parse failed:', err)
    const today = new Date().toISOString().slice(0, 10)
    return {
      operations: [
        {
          id: uuidv4(),
          source: state.source,
          confidence: 0.5,
          type: 'create',
          event: {
            title: state.text.trim(),
            startDate: today,
            endDate: today,
            isAllDay: true,
            category: 'personal'
          }
        }
      ]
    }
  }
}

function routeAfterPreprocess(state: NLUStateType): string {
  return state.error ? 'assemble' : 'llm'
}

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

const DEFAULT_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_API_KEY = 'sk-1362e0bb054d48c288e6a70cff613c19'
const DEFAULT_MODEL = 'deepseek-v4-pro'

export class LangGraphNLU implements NLUEngine {
  readonly name = 'LangGraph NLU'

  private baseUrl = DEFAULT_BASE_URL
  private apiKey = DEFAULT_API_KEY
  private model = DEFAULT_MODEL

  configure(baseUrl: string, apiKey: string, model: string): void {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.model = model
    log.info('Configured:', {
      baseUrl,
      apiKey: apiKey ? '***' : '(empty)',
      model,
      available: this.isAvailable()
    })
  }

  isAvailable(): boolean {
    return !!(this.baseUrl && this.apiKey && this.model)
  }

  async parse(text: string, source: 'nlu', context?: NLUContext): Promise<NLUResult> {
    log.info('parse() called | available:', this.isAvailable(), '| text:', text)
    if (context) {
      log.info('Context provided: messages=', context.recentMessages.length, 
               'operations=', context.recentOperations.length,
               'events=', context.upcomingEvents.length)
    }

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
        context: context || null
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
      operations: [
        {
          id: uuidv4(),
          source,
          confidence: 0.5,
          type: 'create',
          event: {
            title: text.trim(),
            startDate: today,
            endDate: today,
            isAllDay: true,
            category: 'personal'
          }
        }
      ],
      rawText: text,
      source
    }
  }
}

export const langGraphNLU = new LangGraphNLU()
