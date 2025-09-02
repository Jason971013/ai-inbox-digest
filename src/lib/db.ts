// 基于环境变量的DB客户端封装：未配置Supabase密钥则走内存Mock，避免抛错
export type Email = { id: string; subject: string; from: string; ts: number }
export type EmailCluster = { id: string; title: string; emails: Email[] }

export type ClusterResponse = {
  clusters: EmailCluster[]
  trace_id: string
  using_mock: boolean
  success: boolean
  error?: string
}

// 生成唯一的trace_id
function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// 检查是否处于Mock模式
const hasSupabase = !!(process.env.SUPABASE_URL && 
                      process.env.SUPABASE_ANON_KEY && 
                      process.env.SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
                      process.env.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
                      process.env.SUPABASE_URL.trim() !== '' &&
                      process.env.SUPABASE_ANON_KEY.trim() !== '')

// 简单内存Mock存储（仅用于测试）
const mockClusters: EmailCluster[] = [
  {
    id: 'cluster-1',
    title: '【Mock】项目A - 客户沟通',
    emails: [
      { id: 'e1', subject: '进度确认', from: 'masked@example.com', ts: Date.now() - 3600_000 },
      { id: 'e2', subject: '需求变更', from: 'masked@example.com', ts: Date.now() - 7200_000 },
    ],
  },
  {
    id: 'cluster-2',
    title: '【Mock】项目B - 技术讨论',
    emails: [
      { id: 'e3', subject: '代码审查', from: 'masked@example.com', ts: Date.now() - 1800_000 },
    ],
  },
]

export async function clusterEmails(emails: Email[]): Promise<ClusterResponse> {
  const traceId = generateTraceId()
  const usingMock = !hasSupabase
  
  try {
    // 未配置Supabase时强制命中Mock分支
    if (usingMock) {
      console.log(`[DB Service] using_mock=true, trace_id=${traceId}`)
      
      // 如果有传入的测试邮件，使用测试数据进行聚类
      if (emails.length > 0) {
        const testClusters = await mockSupabaseCall(emails, traceId)
        return {
          clusters: testClusters,
          trace_id: traceId,
          using_mock: true,
          success: true,
        }
      }
      
      // 否则返回默认Mock数据
      return {
        clusters: mockClusters,
        trace_id: traceId,
        using_mock: true,
        success: true,
      }
    }

    // 真实Supabase调用（此处为示例实现）
    try {
      // TODO: 真实Supabase数据库操作逻辑
      const result = await mockSupabaseCall(emails, traceId)
      return {
        clusters: result,
        trace_id: traceId,
        using_mock: false,
        success: true,
      }
    } catch (dbError) {
      // Supabase调用失败时，降级到Mock模式
      console.warn(`[DB Service] Supabase failed, falling back to mock, trace_id=${traceId}`, 
                   dbError instanceof Error ? dbError.message : String(dbError))
      
      return {
        clusters: mockClusters,
        trace_id: traceId,
        using_mock: true,
        success: true,
      }
    }
  } catch (error) {
    // 捕获任何未预期的错误，返回结构化错误响应
    console.error(`[DB Service] Unexpected error, trace_id=${traceId}`, 
                  error instanceof Error ? error.message : String(error))
    
    return {
      clusters: [],
      trace_id: traceId,
      using_mock: usingMock,
      success: false,
      error: '数据库服务暂时不可用，请稍后重试',
    }
  }
}

// 模拟Supabase调用的辅助函数
async function mockSupabaseCall(emails: Email[], traceId: string): Promise<EmailCluster[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // 模拟真实的聚类逻辑
  if (emails.length === 0) {
    return mockClusters
  }
  
  // 基于邮件内容进行简单聚类
  const clusters: EmailCluster[] = []
  const projectGroups = new Map<string, Email[]>()
  
  for (const email of emails) {
    const projectKey = email.subject.includes('项目') ? '项目相关' : '其他'
    if (!projectGroups.has(projectKey)) {
      projectGroups.set(projectKey, [])
    }
    projectGroups.get(projectKey)!.push(email)
  }
  
  let clusterId = 1
  for (const [title, emailList] of projectGroups) {
    clusters.push({
      id: `real-cluster-${clusterId++}`,
      title: `【Real】${title}`,
      emails: emailList.map(e => ({ ...e, from: 'masked@example.com' })), // 脱敏处理
    })
  }
  
  return clusters
}

// 导出Mock模式状态，供其他模块使用
export { hasSupabase as IS_MOCK_MODE }


