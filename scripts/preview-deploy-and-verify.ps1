#!/usr/bin/env pwsh

# 一键部署到 Vercel 并在 Preview 域名跑远程验证
# 使用方法: .\scripts\preview-deploy-and-verify.ps1

param(
    [string]$Branch = "preview",
    [switch]$SkipDeploy,
    [switch]$SkipVerify
)

Write-Host "🚀 开始一键部署到 Vercel 并验证..." -ForegroundColor Green

# 检查环境变量
if (-not $env:VERCEL_TOKEN) {
    Write-Host "❌ 错误: 未设置 VERCEL_TOKEN 环境变量" -ForegroundColor Red
    Write-Host "请设置: `$env:VERCEL_TOKEN = 'your_token_here'" -ForegroundColor Yellow
    Write-Host "或在 .env.local 文件中设置" -ForegroundColor Yellow
    exit 1
}

# 检查是否在 Git 仓库中
if (-not (Test-Path ".git")) {
    Write-Host "❌ 错误: 当前目录不是 Git 仓库" -ForegroundColor Red
    exit 1
}

# 获取当前分支
$CurrentBranch = git branch --show-current
Write-Host "📍 当前分支: $CurrentBranch" -ForegroundColor Cyan

# 创建预览分支（如果不存在）
if ($Branch -ne $CurrentBranch) {
    Write-Host "🔄 切换到预览分支: $Branch" -ForegroundColor Yellow
    git checkout -b $Branch 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout $Branch
    }
    git push -u origin $Branch
}

# 部署到 Vercel
if (-not $SkipDeploy) {
    Write-Host "🌐 部署到 Vercel..." -ForegroundColor Yellow
    
    # 安装 Vercel CLI（如果未安装）
    if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
        Write-Host "📦 安装 Vercel CLI..." -ForegroundColor Yellow
        npm install -g vercel@latest
    }
    
    # 检查现有配置
    if (Test-Path ".vercel/project.json") {
        Write-Host "📁 使用现有 .vercel/project.json 配置" -ForegroundColor Cyan
    } else {
        Write-Host "📁 创建新的 Vercel 项目配置" -ForegroundColor Cyan
    }
    
    # 部署
    Write-Host "🚀 开始部署..." -ForegroundColor Yellow
    $DeployOutput = vercel --prod --token=$env:VERCEL_TOKEN --yes 2>&1
    if ($LASTEXITCODE -eq 0) {
        # 解析 Preview URL
        $PreviewUrl = $DeployOutput | Select-String "https://.*\.vercel\.app" | ForEach-Object { $_.Matches.Value }
        if ($PreviewUrl) {
            Write-Host "✅ 部署成功! Preview URL: $PreviewUrl" -ForegroundColor Green
            $env:BASE_URL = $PreviewUrl
        } else {
            Write-Host "⚠️  部署成功但无法解析 Preview URL" -ForegroundColor Yellow
            Write-Host "部署输出: $DeployOutput" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ 部署失败: $DeployOutput" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  跳过部署步骤" -ForegroundColor Yellow
}

# 等待部署完成
if (-not $SkipDeploy -and $env:BASE_URL) {
    Write-Host "⏳ 等待部署完成..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # 检查健康状态
    Write-Host "🔍 检查部署健康状态..." -ForegroundColor Cyan
    try {
        $HealthResponse = Invoke-RestMethod -Uri "$env:BASE_URL/api/health" -Method Get -TimeoutSec 30
        Write-Host "✅ 健康检查通过: $($HealthResponse.ok)" -ForegroundColor Green
        Write-Host "📊 服务状态: $($HealthResponse.services | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠️  健康检查失败: $_" -ForegroundColor Yellow
        Write-Host "继续执行测试..." -ForegroundColor Yellow
    }
}

# 验证部署
if (-not $SkipVerify) {
    Write-Host "🧪 开始验证部署..." -ForegroundColor Yellow
    
    # 运行测试
    Write-Host "🧪 运行 Playwright 测试..." -ForegroundColor Yellow
    if ($env:BASE_URL) {
        Write-Host "🌐 在 Preview URL 上运行测试: $env:BASE_URL" -ForegroundColor Cyan
        $env:BASE_URL = $env:BASE_URL
        npm run test:all
    } else {
        Write-Host "⚠️  未设置 BASE_URL，使用本地测试" -ForegroundColor Yellow
        npm run test:all
    }
    
    # 显示报告
    Write-Host "📊 测试完成，显示报告..." -ForegroundColor Yellow
    npm run report
} else {
    Write-Host "⏭️  跳过验证步骤" -ForegroundColor Yellow
}

Write-Host "🎉 一键部署验证完成!" -ForegroundColor Green
if ($env:BASE_URL) {
    Write-Host "🌐 Preview URL: $env:BASE_URL" -ForegroundColor Cyan
}
Write-Host "📊 测试报告: playwright-report/index.html" -ForegroundColor Cyan
