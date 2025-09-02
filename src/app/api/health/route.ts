// 健康检查API：返回系统状态、当前时间和Mock模式状态
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 生成追踪ID
    const traceId = `health-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    
    // 检查环境变量兼容性
    const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const hasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    const hasGeminiKey = process.env.GEMINI_API_KEY && 
                        process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && 
                        process.env.GEMINI_API_KEY.trim() !== ''
    
    // 检查Mock模式状态
    const usingMock = !hasGeminiKey

    // 记录健康检查日志
    console.log(`[Health API] Health check, using_mock=${usingMock}, trace_id=${traceId}`)

    return NextResponse.json({
      ok: true,
      now: new Date().toISOString(),
      using_mock: usingMock,
      trace_id: traceId,
      services: {
        ai: !hasGeminiKey,
        db: hasSupabaseUrl && hasSupabaseKey,
        supabase: hasSupabaseUrl && hasSupabaseKey
      },
      environment: process.env.NODE_ENV || 'development',
      config: {
        has_supabase: !!hasSupabaseUrl,
        has_gemini: !!hasGeminiKey
      },
      message: usingMock ? 
        "系统运行正常，使用 Mock 模式（未配置 GEMINI_API_KEY）" : 
        "系统运行正常，使用真实 AI 服务"
    })
  } catch (error) {
    // 即使健康检查失败，也要返回响应（不抛500）
    const traceId = `health-error-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error(`[Health API] Health check failed, trace_id=${traceId}:`, errorMessage)
    
    return NextResponse.json({
      ok: false,
      now: new Date().toISOString(),
      using_mock: true, // 错误时默认使用Mock模式
      error: '健康检查失败',
      error_details: errorMessage,
      trace_id: traceId,
      services: {
        ai: true, // 错误时默认使用Mock
        db: false,
        supabase: false
      },
      environment: process.env.NODE_ENV || 'development',
      message: "系统遇到问题，已自动切换到 Mock 模式"
    }, { status: 200 }) // 改为200状态码
  }
}
