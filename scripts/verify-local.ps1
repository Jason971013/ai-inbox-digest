#!/usr/bin/env pwsh

# 本地验证脚本：验证所有功能在本地正常工作
# 使用方法: .\scripts\verify-local.ps1
# 功能: 自动端口适配、启动服务、等待就绪、运行测试

param(
    [int]$StartPort = 3000,
    [int]$EndPort = 3010,
    [int]$TimeoutSec = 90
)

Write-Host "🧪 开始本地验证..." -ForegroundColor Green

# 检查依赖
Write-Host "📦 检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

# 安装 Playwright
Write-Host "🎭 安装 Playwright..." -ForegroundColor Yellow
npm run prep
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Playwright 安装失败" -ForegroundColor Red
    exit 1
}

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

# 健康检查函数
function IsHealthy($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        return ($response.StatusCode -eq 200)
    } catch {
        return $false
    }
}

# 检查开发服务器状态
Write-Host "🔍 检查开发服务器状态..." -ForegroundColor Cyan
$devServerRunning = $false
$availablePort = $null
$devProcess = $null

# 尝试检测已运行的开发服务器
for ($port = $StartPort; $port -le $EndPort; $port++) {
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

# 如果没有发现运行中的服务器，启动新的
if (-not $devServerRunning) {
    Write-Host "🚀 启动开发服务器..." -ForegroundColor Yellow
    
    # 查找可用端口
    $availablePort = Find-AvailablePort
    if (-not $availablePort) {
        Write-Host "❌ 无法找到可用端口，退出" -ForegroundColor Red
        exit 1
    }
    
    # 设置端口环境变量并启动服务器
    $env:PORT = $availablePort
    Write-Host "🌐 使用端口: $availablePort" -ForegroundColor Cyan
    
    $devProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden -Environment @{PORT = $availablePort}
    
    # 等待服务器启动
    Write-Host "⏳ 等待服务器启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # 循环探测直到服务可用或超时
    $maxWaitTime = $TimeoutSec
    $startTime = Get-Date
    $healthCheckPassed = $false
    
    while (-not $healthCheckPassed -and ((Get-Date) - $startTime).TotalSeconds -lt $maxWaitTime) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:$availablePort/api/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $healthCheckPassed = $true
                Write-Host "✅ 服务器启动成功！" -ForegroundColor Green
            } else {
                Write-Host "⏳ 服务器启动中... (状态码: $($response.StatusCode))" -ForegroundColor Yellow
                Start-Sleep -Seconds 3
            }
        } catch {
            $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
            Write-Host "⏳ 等待服务器响应... (已等待 ${elapsed}s)" -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
    
    if (-not $healthCheckPassed) {
        Write-Host "❌ 服务器启动超时" -ForegroundColor Red
        if ($devProcess) {
            Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "🔧 故障诊断信息:" -ForegroundColor Red
        Write-Host "1. 监听端口: $availablePort" -ForegroundColor Yellow
        Write-Host "2. 最近日志:" -ForegroundColor Yellow
        Get-Process | Where-Object {$_.ProcessName -eq "node"} | ForEach-Object {
            Write-Host "   Node.js 进程 PID: $($_.Id)" -ForegroundColor Gray
        }
        Write-Host "3. 重新尝试命令:" -ForegroundColor Yellow
        Write-Host "   npx kill-port $availablePort && npm run dev" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "✅ 使用已运行的开发服务器" -ForegroundColor Green
}

# 设置 BASE_URL
$baseUrl = "http://127.0.0.1:$availablePort"
$env:BASE_URL = $baseUrl
Write-Host "🌐 BASE_URL 设置为: $baseUrl" -ForegroundColor Cyan

# 检查健康状态
Write-Host "🔍 检查部署健康状态..." -ForegroundColor Cyan
try {
    $HealthResponse = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 30
    Write-Host "✅ 健康检查通过: $($HealthResponse.ok)" -ForegroundColor Green
    Write-Host "📊 服务状态: $($HealthResponse.services | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    Write-Host "🔧 Mock模式: $($HealthResponse.using_mock)" -ForegroundColor Cyan
    Write-Host "💬 状态信息: $($HealthResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 健康检查失败: $_" -ForegroundColor Red
    Write-Host "🔧 故障诊断信息:" -ForegroundColor Red
    Write-Host "1. 监听端口: $availablePort" -ForegroundColor Yellow
    Write-Host "2. 最近日志:" -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | ForEach-Object {
        Write-Host "   Node.js 进程 PID: $($_.Id)" -ForegroundColor Gray
    }
    Write-Host "3. 重新尝试命令:" -ForegroundColor Yellow
    Write-Host "   npx kill-port $availablePort && npm run dev" -ForegroundColor Cyan
    exit 1
}

# 运行测试
Write-Host "🧪 运行 Playwright 测试..." -ForegroundColor Yellow
Write-Host "🌐 在端口 $availablePort 上运行测试: $baseUrl" -ForegroundColor Cyan

npm run test:all
$testExitCode = $LASTEXITCODE

# 停止开发服务器（如果是我们启动的）
if ($devProcess) {
    Write-Host "🛑 停止开发服务器..." -ForegroundColor Yellow
    Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue
}

# 显示报告
Write-Host "📊 测试完成，显示报告..." -ForegroundColor Yellow
npm run report

# 输出结果摘要
Write-Host "🎉 本地验证完成!" -ForegroundColor Green
Write-Host "📊 测试报告: playwright-report/index.html" -ForegroundColor Cyan

if ($testExitCode -eq 0) {
    Write-Host "✅ 所有测试通过！系统运行正常" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分测试失败，请查看报告了解详情" -ForegroundColor Yellow
}

Write-Host "🌐 首页地址: $baseUrl" -ForegroundColor Cyan
Write-Host "🔍 健康检查: $baseUrl/api/health" -ForegroundColor Cyan
Write-Host "💡 提示: 使用 127.0.0.1 比 localhost 更稳定" -ForegroundColor Cyan
