// 摘要生成API：未配置GEMINI_API_KEY时走Mock分支，确保测试可通过
import { NextResponse } from 'next/server'
import { generateSummary } from '@/lib/ai'

export async function POST(request: Request) {
  const startTime = process.hrtime.bigint()
  let traceId = `api-trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  try {
    let body: any = {}
    let parseError = null
    
    try {
      body = await request.json()
    } catch (error) {
      parseError = error
      console.warn(`[Digest API] JSON parse failed, trace_id=${traceId}`, 
                   error instanceof Error ? error.message : String(error))
      body = {}
    }

    // 如果JSON解析失败，返回400错误
    if (parseError) {
      const endTime = process.hrtime.bigint()
      const durationMs = Number(endTime - startTime) / 1_000_000
      
      return NextResponse.json({
        success: false,
        error: '请求体格式无效',
        trace_id: traceId,
        using_mock: true,
        duration_ms: durationMs
      }, { status: 400 })
    }

    const clusterId: string | undefined = body?.cluster_id
    if (!clusterId) {
      const endTime = process.hrtime.bigint()
      const durationMs = Number(endTime - startTime) / 1_000_000
      
      return NextResponse.json({
        success: false,
        error: '缺少必需的cluster_id参数',
        trace_id: traceId,
        using_mock: true, // 参数错误时默认使用Mock模式
        duration_ms: durationMs
      }, { status: 400 })
    }

    // 检查cluster_id长度，防止超大请求
    if (clusterId.length > 1000) {
      const endTime = process.hrtime.bigint()
      const durationMs = Number(endTime - startTime) / 1_000_000
      
      return NextResponse.json({
        success: false,
        error: 'cluster_id参数过长',
        trace_id: traceId,
        using_mock: true,
        duration_ms: durationMs
      }, { status: 400 })
    }

    const result = await generateSummary({ 
      clusterId, 
      summaryType: body?.summary_type 
    })
    
    traceId = result.trace_id || traceId

    if (!result.success) {
      // 摘要生成失败，返回结构化错误响应
      const endTime = process.hrtime.bigint()
      const durationMs = Number(endTime - startTime) / 1_000_000
      
      return NextResponse.json({
        success: false,
        error: result.error || '摘要生成失败',
        trace_id: traceId,
        using_mock: result.using_mock || true,
        duration_ms: durationMs
      }, { status: 400 })
    }

    const endTime = process.hrtime.bigint()
    const durationMs = Number(endTime - startTime) / 1_000_000

    // 记录成功日志（脱敏处理）
    console.log(`[Digest API] Success, using_mock=${result.using_mock}, trace_id=${traceId}, duration_ms=${durationMs}`)

    // 脱敏：不包含任何access_token/email等敏感信息
    return NextResponse.json({
      success: true,
      summary: result.summary,
      actions: result.actions,
      citations: result.citations,
      trace_id: traceId,
      using_mock: result.using_mock || false,
      duration_ms: durationMs
    })

  } catch (error) {
    // 捕获任何未预期的错误，确保不抛500
    const endTime = process.hrtime.bigint()
    const durationMs = Number(endTime - startTime) / 1_000_000
    
    console.error(`[Digest API] Unexpected error, trace_id=${traceId}`, 
                  error instanceof Error ? error.message : String(error))
    
    return NextResponse.json({ 
      success: false,
      error: '摘要生成服务暂时不可用，请稍后重试',
      trace_id: traceId,
      using_mock: true, // 错误时默认使用Mock模式
      duration_ms: durationMs
    }, { status: 400 })
  }
}
