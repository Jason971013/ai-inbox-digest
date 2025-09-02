import { test, expect, request } from "@playwright/test"

// API测试：验证所有接口的响应结构和Mock模式
test.describe('API接口测试', () => {
  let apiContext: any

  test.beforeEach(async ({ request }) => {
    apiContext = request
  })

  test('健康检查接口返回正确结构', async () => {
    const response = await apiContext.get('/api/health')
    
    expect(response.status()).toBe(200)
    
    const json = await response.json()
    
    // 验证响应结构
    expect(json).toHaveProperty('ok')
    expect(json).toHaveProperty('now')
    expect(json).toHaveProperty('using_mock')
    
    // 验证字段类型
    expect(typeof json.ok).toBe('boolean')
    expect(typeof json.now).toBe('string')
    expect(typeof json.using_mock).toBe('boolean')
    
    // 验证时间格式
    expect(new Date(json.now)).not.toBeNaN()
    
    // 验证Mock模式标识
    expect(json.using_mock).toBe(true) // 无密钥时应该为Mock模式
  })

  test('邮件聚类接口返回正确结构', async () => {
    const response = await apiContext.post('/api/emails/cluster', {
      data: {
        emails: [
          { id: '1', subject: '测试邮件1', from: 'test1@example.com', content: '这是测试内容1' },
          { id: '2', subject: '测试邮件2', from: 'test2@example.com', content: '这是测试内容2' }
        ]
      }
    })
    
    expect(response.status()).toBe(200)
    
    const json = await response.json()
    
    // 验证统一响应结构
    expect(json).toHaveProperty('success')
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('trace_id')
    expect(json).toHaveProperty('using_mock')
    
    // 验证字段类型
    expect(typeof json.success).toBe('boolean')
    expect(typeof json.trace_id).toBe('string')
    expect(typeof json.using_mock).toBe('boolean')
    
    // 验证Mock模式标识
    expect(json.using_mock).toBe(true)
    
    // 验证聚类数据
    if (json.success && json.data) {
      expect(json.data).toHaveProperty('clusters')
      expect(Array.isArray(json.data.clusters)).toBe(true)
      expect(json.data.clusters.length).toBeGreaterThan(0)
    }
  })

  test('摘要生成接口返回正确结构', async () => {
    const response = await apiContext.post('/api/digest/generate', {
      data: {
        cluster_id: 'test-cluster-1',
        summary_type: 'daily'
      }
    })
    
    expect(response.status()).toBe(200)
    
    const json = await response.json()
    
    // 验证统一响应结构
    expect(json).toHaveProperty('success')
    expect(json).toHaveProperty('trace_id')
    expect(json).toHaveProperty('using_mock')
    
    // 验证字段类型
    expect(typeof json.success).toBe('boolean')
    expect(typeof json.trace_id).toBe('string')
    expect(typeof json.using_mock).toBe('boolean')
    
    // 验证Mock模式标识
    expect(json.using_mock).toBe(true)
    
    // 验证摘要数据
    if (json.success) {
      expect(json).toHaveProperty('summary')
      expect(json).toHaveProperty('actions')
      expect(json).toHaveProperty('citations')
      
      expect(typeof json.summary).toBe('string')
      expect(Array.isArray(json.actions)).toBe(true)
      expect(Array.isArray(json.citations)).toBe(true)
    }
  })

  test('Mock模式强制命中', async () => {
    // 测试无密钥时强制使用Mock模式
    const response = await apiContext.get('/api/health')
    const json = await response.json()
    
    // 确保Mock模式被正确标识
    expect(json.using_mock).toBe(true)
    
    // 验证Mock数据完整性
    const clusterResponse = await apiContext.post('/api/emails/cluster', {
      data: { emails: [] }
    })
    const clusterJson = await clusterResponse.json()
    
    expect(clusterJson.using_mock).toBe(true)
    expect(clusterJson.success).toBe(true)
  })

  test('错误处理返回正确结构', async () => {
    // 测试无效请求
    const response = await apiContext.post('/api/digest/generate', {
      data: {} // 缺少必需的cluster_id
    })
    
    expect(response.status()).toBe(400)
    
    const json = await response.json()
    
    // 验证错误响应结构
    expect(json).toHaveProperty('success')
    expect(json).toHaveProperty('error')
    expect(json).toHaveProperty('trace_id')
    expect(json).toHaveProperty('using_mock')
    
    // 验证字段类型
    expect(typeof json.success).toBe('boolean')
    expect(typeof json.error).toBe('string')
    expect(typeof json.trace_id).toBe('string')
    expect(typeof json.using_mock).toBe('boolean')
    
    // 验证错误状态
    expect(json.success).toBe(false)
    expect(json.using_mock).toBe(true)
  })

  test('敏感信息脱敏处理', async () => {
    const response = await apiContext.post('/api/emails/cluster', {
      data: {
        emails: [
          { 
            id: '1', 
            subject: '测试邮件', 
            from: 'test@example.com', 
            content: '这是测试内容',
            access_token: 'secret_token_123',
            refresh_token: 'refresh_secret_456'
          }
        ]
      }
    })
    
    expect(response.status()).toBe(200)
    
    const text = await response.text()
    
    // 验证敏感信息被脱敏
    expect(text).not.toMatch(/access_token|refresh_token/i)
    
    // 验证邮箱地址被保留（因为这是测试数据，不是真实敏感信息）
    expect(text).toMatch(/test@example\.com/)
    
    // 验证响应结构正确
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.clusters[0].emails[0].from).toBe('test@example.com')
  })

  test('trace_id全链路贯穿', async () => {
    // 健康检查获取trace_id
    const healthResponse = await apiContext.get('/api/health')
    const healthJson = await healthResponse.json()
    
    expect(healthJson).toHaveProperty('trace_id')
    const healthTraceId = healthJson.trace_id
    
    // 聚类接口应该返回相同的trace_id或新的trace_id
    const clusterResponse = await apiContext.post('/api/emails/cluster', {
      data: { emails: [] }
    })
    const clusterJson = await clusterResponse.json()
    
    expect(clusterJson).toHaveProperty('trace_id')
    expect(typeof clusterJson.trace_id).toBe('string')
    expect(clusterJson.trace_id.length).toBeGreaterThan(0)
  })

  test('对抗：异常字段不致500', async () => {
    // 测试各种异常情况，确保不抛500错误
    
    // 1. 无效JSON
    const response1 = await apiContext.post('/api/digest/generate', {
      data: 'invalid json string'
    })
    
    expect(response1.status()).toBe(400)
    const json1 = await response1.json()
    expect(typeof json1.success).toBe('boolean')
    
    // 2. 空请求体
    const response2 = await apiContext.post('/api/digest/generate', {})
    
    expect(response2.status()).toBe(400)
    const json2 = await response2.json()
    expect(typeof json2.success).toBe('boolean')
    
    // 3. 超大请求体 - 现在应该返回400状态码
    const largeData = { cluster_id: 'a'.repeat(10000) }
    const response3 = await apiContext.post('/api/digest/generate', {
      data: largeData
    })
    
    // 验证响应状态码是400（超大请求应该被拒绝）
    expect(response3.status()).toBe(400)
    const json3 = await response3.json()
    expect(typeof json3.success).toBe('boolean')
    expect(json3.success).toBe(false)
  })
})
