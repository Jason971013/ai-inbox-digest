#!/usr/bin/env pwsh

# 快速验证脚本：快速检查基本功能
# 使用方法: .\scripts\quick-verify.ps1

Write-Host "⚡ 快速验证开始..." -ForegroundColor Green

# 端口自适配函数
function Find-AvailablePort {
    param([int]$StartPort = 3000)
    
    $port = $StartPort
    $maxAttempts = 10
    
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        try {
            $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $port)
            $listener.Start()
            $listener.Stop()
            Write-Host "✅ 找到可用端口: $port" -ForegroundColor Green
            return $port
        } catch {
            Write-Host "⚠️  端口 $port 被占用，尝试下一个..." -ForegroundColor Yellow
            $port++
        }
    }
    
    Write-Host "❌ 无法找到可用端口" -ForegroundColor Red
    return $null
}

# 检查开发服务器状态
Write-Host "🔍 检查开发服务器状态..." -ForegroundColor Cyan
$devServerRunning = $false
$availablePort = $null

# 尝试检测已运行的开发服务器
for ($port = 3000; $port -le 3010; $port++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $devServerRunning = $true
            $availablePort = $port
            Write-Host "✅ 发现已运行的开发服务器在端口 $port" -ForegroundColor Green
            break
        }
    } catch {
        # 端口可能被占用或服务未启动
    }
}

if (-not $devServerRunning) {
    Write-Host "ℹ️  未发现运行中的开发服务器" -ForegroundColor Yellow
    Write-Host "💡 请先运行: npm run verify:local" -ForegroundColor Cyan
    exit 1
}

# 检查健康状态
Write-Host "🔍 检查健康状态..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$availablePort/api/health" -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 健康检查通过" -ForegroundColor Green
        
        # 解析健康检查响应
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "📊 健康状态: $($healthData.ok)" -ForegroundColor Cyan
        Write-Host "🔧 Mock模式: $($healthData.using_mock)" -ForegroundColor Cyan
        Write-Host "💬 状态信息: $($healthData.message)" -ForegroundColor Cyan
        
        # 检查首页
        try {
            $homeResponse = Invoke-WebRequest -Uri "http://127.0.0.1:$availablePort" -Method Get -TimeoutSec 10
            if ($homeResponse.Content -match "AI Inbox Digest") {
                Write-Host "✅ 首页可访问，标题正确" -ForegroundColor Green
            } else {
                Write-Host "⚠️  首页可访问，但标题可能不正确" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ 首页访问失败: $_" -ForegroundColor Red
        }
        
    } else {
        Write-Host "⚠️  健康检查返回状态码: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 健康检查失败: $_" -ForegroundColor Red
    exit 1
}

# 检查环境变量
Write-Host "🔧 检查环境变量..." -ForegroundColor Cyan
if ($env:BASE_URL) {
    Write-Host "✅ BASE_URL 已设置: $env:BASE_URL" -ForegroundColor Green
} else {
    Write-Host "ℹ️  BASE_URL 未设置，将使用默认值" -ForegroundColor Yellow
}

# 检查 Playwright 安装
Write-Host "🎭 检查 Playwright..." -ForegroundColor Cyan
if (Test-Path "node_modules/@playwright/test") {
    Write-Host "✅ Playwright 已安装" -ForegroundColor Green
} else {
    Write-Host "⚠️  Playwright 未安装，运行: npm run prep" -ForegroundColor Yellow
}

Write-Host "🎉 快速验证完成!" -ForegroundColor Green
Write-Host "🌐 服务地址: http://127.0.0.1:$availablePort" -ForegroundColor Cyan
Write-Host "💡 提示: 使用 127.0.0.1 比 localhost 更稳定" -ForegroundColor Cyan
Write-Host "💡 如需完整测试，请运行: npm run verify:local" -ForegroundColor Cyan
