#!/usr/bin/env pwsh

# 一键打开本地项目网页
# 使用方法: npm run open:local
# 功能: 自动安装依赖、选择端口、启动服务、打开浏览器

param(
    [int]$StartPort = 3000,
    [int]$EndPort = 3010,
    [int]$TimeoutSec = 90
)

# 辅助函数
function Info($m) { Write-Host $m -ForegroundColor Cyan }
function Err($m) { Write-Host $m -ForegroundColor Red }
function Success($m) { Write-Host $m -ForegroundColor Green }

# 检查项目文件
if (-not (Test-Path 'package.json')) {
    Err '未在当前目录找到 package.json，请在项目根目录运行。'
    exit 1
}

Write-Host "🚀 开始一键打开本地项目..." -ForegroundColor Green

# 1) 安装依赖（若已有可跳过）
Info '📦 安装依赖（如已安装将快速跳过）...'
try {
    npm install | Out-Null
    Success '✅ 依赖安装完成'
} catch {
    Err '❌ 依赖安装失败，但继续执行...'
}

# 2) 选择端口：优先可用端口
function IsHealthy($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        return ($r.StatusCode -eq 200)
    } catch {
        return $false
    }
}

$selected = $null

# 检查是否有已运行的服务
for ($p = $StartPort; $p -le $EndPort; $p++) {
    $u = "http://127.0.0.1:$p/api/health"
    if (IsHealthy $u) {
        $selected = $p
        Info "✅ 检测到已运行服务：端口 $p"
        break
    }
    
    # 检查端口是否被占用
    $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if (-not $c) {
        $selected = $p
        Info "✅ 找到可用端口：$p"
        break
    }
}

if (-not $selected) {
    $selected = $StartPort
    Info "⚠️  使用默认端口：$selected"
}

# 设置环境变量
$env:PORT = $selected
$base = "http://127.0.0.1:$selected"
$health = "$base/api/health"

Info "🌐 使用端口：$selected"
Info "🔗 服务地址：$base"

# 3) 若未就绪则启动 dev
if (-not (IsHealthy $health)) {
    Info "🚀 启动开发服务（端口 $selected）..."
    Start-Process -FilePath 'npm' -ArgumentList 'run','dev' -WindowStyle Minimized | Out-Null
    
    # 4) 等待健康检查就绪
    Info "⏳ 等待服务就绪（最多 $TimeoutSec 秒）..."
    $ok = $false
    
    for ($i = 1; $i -le $TimeoutSec; $i++) {
        if (IsHealthy $health) {
            $ok = $true
            Success "✅ 服务启动成功！"
            break
        }
        
        if ($i % 10 -eq 0) {
            Info "⏳ 已等待 ${i} 秒..."
        }
        
        Start-Sleep -Seconds 1
    }
    
    if (-not $ok) {
        Err "❌ 等待超时：$health 未就绪"
        Err "💡 建议：npx kill-port $selected; `$env:PORT='$($selected+1)'; npm run dev 再试"
        exit 2
    }
} else {
    Success "✅ 服务已在运行"
}

# 5) 打开浏览器到首页和体检页
Info "🌐 打开浏览器..."
try {
    Start-Process "cmd" "/c start `"`"`" $base"
    Start-Sleep -Seconds 1
    Start-Process "cmd" "/c start `"`"`" $health"
    Success "✅ 浏览器已打开"
} catch {
    Err "❌ 浏览器打开失败，请手动访问："
    Info "首页：$base"
    Info "健康检查：$health"
}

# 设置环境变量供后续使用
$env:BASE_URL = $base

# 输出结果
Write-Host ""
Success "🎉 本地项目已启动！"
Write-Host "🌐 首页地址：$base" -ForegroundColor Green
Write-Host "🔍 健康检查：$health" -ForegroundColor Green
Write-Host "💡 提示：使用 127.0.0.1 比 localhost 更稳定" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 如需自动体检，请运行：" -ForegroundColor Yellow
Write-Host "   npm run verify:local" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 如需手动测试，请运行：" -ForegroundColor Yellow
Write-Host "   `$env:BASE_URL='$base'; npm run test:all" -ForegroundColor Cyan

exit 0
