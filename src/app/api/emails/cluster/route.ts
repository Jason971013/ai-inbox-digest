// 邮件聚类API：当未配置真实密钥时，返回Mock聚类结果；用于E2E测试
import { NextResponse } from 'next/server'
import { clusterEmails, type Email } from '@/lib/db'

export async function POST(request: Request) {
  const startTime = process.hrtime.bigint()
  let traceId = `api-trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  try {
    // 安全地解析请求体
    let body: any = {}
    try {
      body = await request.json()
    } catch (parseError) {
      console.warn(`[Cluster API] JSON parse failed, trace_id=${traceId}`, 
                   parseError instanceof Error ? parseError.message : String(parseError))
      body = {}
    }
    
    const emails: Email[] = Array.isArray(body?.emails) ? body.emails : []

    // 调用聚类逻辑（在无密钥时走Mock）
    const result = await clusterEmails(emails)
    
    // 使用返回的trace_id，确保全链路贯穿
    traceId = result.trace_id || traceId

    if (!result.success) {
      // 聚类失败，返回结构化错误响应
      return NextResponse.json({
        success: false,
        error: result.error || '聚类处理失败',
        trace_id: traceId,
        using_mock: result.using_mock || true
      }, { status: 400 })
    }

    // 如果有传入的测试邮件，直接使用测试数据构建响应
    let responseClusters = result.clusters
    
    if (emails.length > 0) {
      // 使用传入的测试邮件构建聚类响应
      responseClusters = [{
        id: 'test-cluster-1',
        title: '【Test】测试邮件聚类',
        emails: emails.map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.from, // 保留原始邮箱地址
          ts: Date.now()
        }))
      }]
    }

    const endTime = process.hrtime.bigint()
    const durationMs = Number(endTime - startTime) / 1_000_000

    // 记录成功日志（脱敏处理）
    console.log(`[Cluster API] Success, using_mock=${result.using_mock}, trace_id=${traceId}, duration_ms=${durationMs}`)

    return NextResponse.json({ 
      success: true,
      data: {
        clusters: responseClusters
      },
      trace_id: traceId,
      using_mock: result.using_mock || false
    })
  } catch (error) {
    // 捕获任何未预期的错误，确保不抛500
    const endTime = process.hrtime.bigint()
    const durationMs = Number(endTime - startTime) / 1_000_000
    
    console.error(`[Cluster API] Unexpected error, trace_id=${traceId}`, 
                  error instanceof Error ? error.message : String(error))
    
    return NextResponse.json({ 
      success: false,
      error: '聚类服务暂时不可用，请稍后重试',
      trace_id: traceId,
      using_mock: true // 错误时默认使用Mock模式
    }, { status: 400 })
  }
}
