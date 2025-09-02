import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini API配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// 检查是否有有效的Gemini API密钥
const hasGeminiKey = !!GEMINI_API_KEY && 
                    GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && 
                    GEMINI_API_KEY.trim() !== ''

// 初始化Gemini客户端
let genAI: GoogleGenerativeAI | null = null
if (hasGeminiKey) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  } catch (error) {
    console.error('[AI Service] Failed to initialize Gemini client:', error)
  }
}

// 安全设置配置
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
]

// 生成追踪ID
function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// 统一文本生成接口
export interface GenerateTextRequest {
  prompt: string
  schema?: any // 可选的JSON Schema
  system?: string // 系统提示
  safety?: 'BLOCK_SOME' | 'BLOCK_ONLY_HIGH' | 'BLOCK_NONE'
}

export interface GenerateTextResponse {
  success: boolean
  text?: string
  json?: any
  usage?: {
    promptTokens: number
    responseTokens: number
    totalTokens: number
  }
  modelVersion?: string
  trace_id: string
  using_mock: boolean
  error?: string
}

export async function generateText(req: GenerateTextRequest): Promise<GenerateTextResponse> {
  const traceId = generateTraceId()
  const usingMock = !hasGeminiKey || !genAI

  try {
    if (usingMock) {
      // Mock模式：返回模拟数据
      console.log(`[AI Service] Using Mock mode, trace_id=${traceId}`)
      
      if (req.schema) {
        // 返回结构化Mock数据
        const mockJson = {
          summary: "【Mock】这是一个模拟的AI生成摘要，用于测试目的。",
          actions: [
            { id: "action-1", label: "回复邮件", type: "reply" },
            { id: "action-2", label: "标记重要", type: "mark" }
          ],
          citations: [
            { id: "cite-1", source: "邮件1", url: "mailto:example@test.com" }
          ]
        }
        
        return {
          success: true,
          json: mockJson,
          usage: { promptTokens: 0, responseTokens: 0, totalTokens: 0 },
          modelVersion: 'mock-1.0',
          trace_id: traceId,
          using_mock: true
        }
      } else {
        // 返回纯文本Mock数据
        return {
          success: true,
          text: "【Mock】这是一个模拟的AI生成文本，用于测试目的。",
          usage: { promptTokens: 0, responseTokens: 0, totalTokens: 0 },
          modelVersion: 'mock-1.0',
          trace_id: traceId,
          using_mock: true
        }
      }
    }

    // 真实Gemini API调用
    try {
      const model = genAI!.getGenerativeModel({ 
        model: GEMINI_MODEL
      })

      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }

      let contents: any[] = []
      
      // 添加系统提示（如果有）
      if (req.system) {
        contents.push({ role: 'user', parts: [{ text: req.system }] })
      }
      
      // 添加用户提示
      contents.push({ role: 'user', parts: [{ text: req.prompt }] })

      if (req.schema) {
        // 结构化输出模式
        const responseSchema = {
          type: 'object',
          properties: req.schema,
          required: Object.keys(req.schema)
        }

        const result = await model.generateContent({
          contents,
          generationConfig: {
            ...generationConfig,
            responseSchema
          }
        })

        const response = await result.response
        const json = JSON.parse(response.text())
        
        return {
          success: true,
          json,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: (response.usageMetadata?.promptTokenCount || 0) + (response.usageMetadata?.candidatesTokenCount || 0)
          },
          modelVersion: response.usageMetadata?.modelName || GEMINI_MODEL,
          trace_id: traceId,
          using_mock: false
        }
      } else {
        // 纯文本输出模式
        const result = await model.generateContent({
          contents,
          generationConfig
        })

        const response = await result.response
        const text = response.text()
        
        return {
          success: true,
          text,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            responseTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: (response.usageMetadata?.promptTokenCount || 0) + (response.usageMetadata?.candidatesTokenCount || 0)
          },
          modelVersion: response.usageMetadata?.modelName || GEMINI_MODEL,
          trace_id: traceId,
          using_mock: false
        }
      }
    } catch (apiError) {
      console.error('[AI Service] Gemini API call failed:', apiError)
      
      // API调用失败时回退到Mock模式
      return {
        success: true,
        text: req.schema ? undefined : "【Mock】AI服务暂时不可用，使用模拟数据。",
        json: req.schema ? {
          summary: "【Mock】AI服务暂时不可用，使用模拟数据。",
          actions: [],
          citations: []
        } : undefined,
        usage: { promptTokens: 0, responseTokens: 0, totalTokens: 0 },
        modelVersion: 'mock-fallback',
        trace_id: traceId,
        using_mock: true,
        error: 'API调用失败，回退到Mock模式'
      }
    }
  } catch (error) {
    console.error('[AI Service] Unexpected error:', error)
    
    return {
      success: false,
      trace_id: traceId,
      using_mock: true,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 兼容性接口（保持向后兼容）
export interface GenerateSummaryRequest {
  clusterId: string
  summaryType?: string
}

export interface GenerateSummaryResponse {
  summary: string
  actions: Array<{ id: string; label: string; type: string }>
  citations: Array<{ id: string; source: string; url?: string }>
  trace_id?: string
  using_mock?: boolean
  success: boolean
  error?: string
}

export async function generateSummary(req: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
  const prompt = `请为邮件聚类 ${req.clusterId} 生成${req.summaryType || '日常'}摘要，包括：
1. 摘要内容
2. 建议的行动项
3. 引用来源

请以JSON格式返回，包含summary、actions、citations字段。`

  const schema = {
    summary: { type: 'string', description: '邮件聚类摘要' },
    actions: { 
      type: 'array', 
      items: { 
        type: 'object', 
        properties: { 
          id: { type: 'string' }, 
          label: { type: 'string' }, 
          type: { type: 'string' } 
        } 
      } 
    },
    citations: { 
      type: 'array', 
      items: { 
        type: 'object', 
        properties: { 
          id: { type: 'string' }, 
          source: { type: 'string' }, 
          url: { type: 'string' } 
        } 
      } 
    }
  }

  const result = await generateText({ prompt, schema })
  
  if (result.success && result.json) {
    return {
      summary: result.json.summary,
      actions: result.json.actions,
      citations: result.json.citations,
      trace_id: result.trace_id,
      using_mock: result.using_mock,
      success: true
    }
  } else {
    return {
      summary: "生成摘要失败",
      actions: [],
      citations: [],
      trace_id: result.trace_id,
      using_mock: result.using_mock,
      success: false,
      error: result.error
    }
  }
}

// 导出Mock模式状态
export { hasGeminiKey as IS_MOCK_MODE }


