# AI Inbox Digest

智能邮件摘要系统 - 通过 AI 聚类和摘要，将散乱邮件整理为项目化视图，提升邮件处理效率。

## 🚀 本地一键打开

### Windows 用户（推荐）：
```powershell
npm run open:local
```

### macOS/Linux 用户：
```bash
npm run open:local:unix
```

**✨ 功能**: 自动安装依赖、选择空闲端口、启动服务、打开浏览器

---

## 🔧 手动启动（可选）

### 第一步：安装依赖
```bash
npm install
```

### 第二步：启动开发服务器
```bash
npm run dev
```

### 第三步：打开浏览器
在浏览器中打开以下地址：
- **首页**: http://127.0.0.1:端口
- **健康检查**: http://127.0.0.1:端口/api/health

**💡 提示**: 使用 `127.0.0.1` 比 `localhost` 更稳定，避免 DNS 解析问题

你应该能看到：
- 首页显示 "AI Inbox Digest" 标题
- 健康检查返回 JSON 数据，包含 `ok: true` 和 `using_mock: true`

## 🧪 本地体检

### Windows PowerShell 用户：
```powershell
# 一键体检（自动端口适配）
npm run verify:local

# 快速验证（检查已运行的服务）
npm run quick:verify

# 或手动设置环境变量
$env:BASE_URL = "http://127.0.0.1:3000"
npm run test:all
```

### macOS/Linux 用户：
```bash
# 一键体检（自动端口适配）
npm run verify:local:unix

# 快速验证（检查已运行的服务）
npm run quick:verify:unix

# 或手动设置环境变量
export BASE_URL="http://127.0.0.1:3000"
npm run test:all
```

## 📋 体检检查清单

✅ **首页可访问**: http://127.0.0.1:端口 显示 "AI Inbox Digest"  
✅ **健康检查正常**: /api/health 返回 HTTP 200，包含 ok、now、using_mock  
✅ **测试全绿**: 运行 `npm run verify:local` 所有测试通过  
✅ **Mock 模式**: 未设置 GEMINI_API_KEY 时自动使用 Mock，测试仍通过  
✅ **端口自适配**: 自动检测可用端口，避免端口冲突  

## 🔧 常见问题

### 如果首页无法访问：
1. 运行 `npm run open:local` 一键启动服务
2. 检查控制台是否有错误信息
3. 尝试访问 http://127.0.0.1:端口/api/health

### 如果测试失败：
1. 运行 `npm run verify:local` 自动启动服务并体检
2. 检查 BASE_URL 环境变量设置
3. 查看测试报告了解具体失败原因

### 如果健康检查失败：
1. 运行 `npm run open:local` 一键启动服务
2. 检查控制台日志
3. 脚本会自动检测可用端口，避免端口冲突

### 如果端口被占用：
1. 运行 `npm run open:local` 自动切换到可用端口
2. 或手动运行 `npx kill-port 3000 && npm run dev`
3. 使用 `127.0.0.1` 而不是 `localhost` 更稳定

### 如果遇到执行策略限制（Windows）：
1. 以管理员身份打开 PowerShell
2. 运行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
3. 重新执行 `npm run open:local`

### 如果浏览器无法自动打开：
1. 手动复制脚本输出的地址到浏览器
2. 确保使用 `127.0.0.1:端口` 而不是 `localhost`
3. 检查防火墙设置

## 🌐 部署到 Vercel

完成本地验证后，可以部署到 Vercel：

```bash
# 推送代码触发自动部署
git checkout -b infra/preview-ci
git add .
git commit -m "ci: trigger preview deploy & verify"
git push -u origin infra/preview-ci
```

## 📊 测试报告

测试完成后，查看详细报告：
```bash
npm run report
```

报告将显示在浏览器中，包含所有测试结果和截图。

## 🔑 环境变量

### 必需：
- `VERCEL_TOKEN` - Vercel API Token（仅部署时需要）

### 可选：
- `GEMINI_API_KEY` - Gemini API 密钥（缺失时自动使用 Mock）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 数据库 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥

## 📁 项目结构

```
src/
├── app/                    # Next.js 应用
│   ├── api/               # API 路由
│   │   └── health/        # 健康检查
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/             # 可复用组件
├── lib/                    # 工具库
│   └── ai.ts              # AI 服务（含 Mock 兜底）
└── styles/                 # 样式文件

scripts/                    # 脚本文件
├── verify-local.ps1       # Windows 本地验证
├── verify-local.sh         # macOS/Linux 本地验证
└── preview-deploy-and-verify.ps1  # 预览部署验证

tests/                      # 测试文件
└── e2e/                   # 端到端测试
```

## 🎯 下一步

1. **本地验证通过** ✅
2. **推送代码触发部署** 🚀
3. **在 Vercel 上验证** 🌐
4. **绑定自定义域名** 🔗

---

**提示**: 所有功能都有 Mock 兜底，即使没有配置 API 密钥也能正常运行和测试！
