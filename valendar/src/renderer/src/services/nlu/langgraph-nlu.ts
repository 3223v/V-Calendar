import type { NLUEngine, NLUResult } from './nlu.interface'
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
  model: Annotation<string>
})

type NLUStateType = typeof NLUState.State

// ─── Prompts ─────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return `你是日历助手，将用户的自然语言解析为日历操作。

当前日期: ${today}
当前时间: ${time}
今天是星期${weekdays[now.getDay()]}

## 操作类型
- 创建/添加/安排/开会/约/提醒/计划 → "create"
- 改/修改/变更/调整/推迟/提前 → "update"
- 删除/取消/去掉/移除/不要了 → "delete"
- 无法判断 → 返回空 operations

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
- 信息完整→0.9-1.0, 部分缺失→0.6-0.8, 猜测→0.3-0.5

严格返回 JSON:
{"operations":[{"type":"create|update|delete","confidence":0.0-1.0,"event":{"title":"必填","description":"可选","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","startTime":"HH:MM或null","endTime":"HH:MM或null","isAllDay":true/false,"category":"work|personal|holiday|important|custom","location":"可选或null"}}]}`
}

// ─── Nodes ───────────────────────────────────────────────────────────

/** 前置校验：过滤空输入 */
async function preprocess(state: NLUStateType): Promise<Partial<NLUStateType>> {
  log.info('[Preprocess] input:', state.text)
  if (!state.text.trim()) {
    return { error: 'empty_input' }
  }
  return { error: null }
}

/** 核心节点：调用 LLM 完成全量解析 */
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
          { role: 'system', content: buildSystemPrompt() },
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

/** 后置节点：解析 LLM JSON → CRUDOperation[] */
async function assemble(state: NLUStateType): Promise<Partial<NLUStateType>> {
  // 出错或无响应 → 本地兜底
  if (state.error || !state.llmResponse) {
    log.warn('[Assemble] using local fallback, error:', state.error)
    const today = new Date().toISOString().slice(0, 10)
    return {
      operations: [{
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
      }]
    }
  }

  try {
    const parsed = JSON.parse(state.llmResponse)
    const ops: CRUDOperation[] = (parsed.operations || [])
      .filter((op: any) => op?.type && op?.event?.title && op?.event?.startDate)
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

    log.info('[Assemble] parsed', ops.length, 'operations')
    return { operations: ops }
  } catch (err) {
    log.error('[Assemble] JSON parse failed:', err)
    // JSON 解析失败 → 兜底
    const today = new Date().toISOString().slice(0, 10)
    return {
      operations: [{
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

  configure(baseUrl: string, apiKey: string, model: string): void {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.model = model
    log.info('Configured:', { baseUrl, apiKey: apiKey ? '***' : '(empty)', model, available: this.isAvailable() })
  }

  isAvailable(): boolean {
    return !!(this.baseUrl && this.apiKey && this.model)
  }

  async parse(text: string, source: 'nlu'): Promise<NLUResult> {
    log.info('parse() called | available:', this.isAvailable(), '| text:', text)

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
        model: this.model
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
