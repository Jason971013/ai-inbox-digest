import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AI Inbox Digest
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            智能邮件摘要系统 — 本地已启动，一切正常
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/api/health" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🔍 系统健康检查
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>点击上方按钮查看系统状态</p>
              <p>包括服务可用性、Mock 模式状态等</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 font-medium">
              ✅ 本地开发环境运行正常
            </p>
            <p className="text-green-600 text-sm mt-1">
              如需运行完整测试，请设置 BASE_URL 环境变量
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
