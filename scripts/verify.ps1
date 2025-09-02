# AI Inbox Digest 一键验证脚本
# 功能：一步串联 A→B→（可选C）→E，并自动打开报告

param(
    [switch]$SkipInstall,
    [switch]$SkipPreview
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Cyan"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" "Magenta"
}

# 主函数
function Main {
    Write-ColorOutput "🚀 AI Inbox Digest 一键验证开始" "Blue"
    Write-ColorOutput "=" * 50 "Blue"
    
    try {
        # 步骤A：安装依赖
        if (-not $SkipInstall) {
            Write-Step "步骤A：安装依赖和Playwright"
            Write-Info "正在安装npm依赖..."
            npm i
            if ($LASTEXITCODE -ne 0) {
                throw "npm install 失败"
            }
            Write-Success "npm依赖安装完成"
            
            Write-Info "正在安装Playwright浏览器..."
            npx playwright install --with-deps
            if ($LASTEXITCODE -ne 0) {
                throw "Playwright安装失败"
            }
            Write-Success "Playwright安装完成"
        } else {
            Write-Info "跳过依赖安装"
        }
        
        # 步骤B：Mock模式测试
        Write-Step "步骤B：Mock模式测试（无密钥全绿）"
        Write-Info "运行Mock模式测试..."
        npm run verify:mock
        if ($LASTEXITCODE -ne 0) {
            throw "Mock模式测试失败 - 请把红字丢给Cursor：'Mock测试失败，需要检查API响应结构和Mock逻辑'"
        }
        Write-Success "Mock模式测试通过"
        
        # 步骤C：BASE_URL本地测试
        Write-Step "步骤C：BASE_URL本地测试"
        Write-Info "设置BASE_URL=http://localhost:3000并运行测试..."
        $env:BASE_URL = "http://localhost:3000"
        try {
            npm run verify:baseurl:local
            if ($LASTEXITCODE -ne 0) {
                throw "BASE_URL本地测试失败 - 请把红字丢给Cursor：'BASE_URL本地测试失败，需要检查localhost:3000配置和测试断言'"
            }
            Write-Success "BASE_URL本地测试通过"
        } finally {
            # 清空环境变量
            Remove-Item Env:BASE_URL -ErrorAction SilentlyContinue
        }
        
        # 步骤D：预览域名测试（可选）
        if (-not $SkipPreview) {
            Write-Step "步骤D：预览域名测试（可选）"
            $previewDomain = Read-Host "请输入预览域名（如：https://xxx.vercel.app）或按Enter跳过"
            
            if ($previewDomain -and $previewDomain.Trim()) {
                Write-Info "使用预览域名: $previewDomain"
                Write-Info "正在运行预览域名测试..."
                
                $env:BASE_URL = $previewDomain
                try {
                    playwright test
                    if ($LASTEXITCODE -ne 0) {
                        throw "预览域名测试失败 - 请把红字丢给Cursor：'预览域名测试失败，需要检查$previewDomain的可访问性和CORS配置'"
                    }
                    Write-Success "预览域名测试通过"
                } finally {
                    Remove-Item Env:BASE_URL -ErrorAction SilentlyContinue
                }
            } else {
                Write-Info "跳过预览域名测试"
            }
        }
        
        # 步骤E：打开报告
        Write-Step "步骤E：打开测试报告"
        Write-Info "正在打开Playwright测试报告..."
        Start-Process "npx" -ArgumentList "playwright", "show-report" -Wait
        Write-Success "测试报告已打开"
        
        # 总结
        Write-ColorOutput "=" * 50 "Blue"
        Write-Success "🎉 一键验证完成！所有测试通过"
        Write-Info "如需重新运行，请执行：npm run verify:all"
        Write-Info "如需预览域名测试，请执行：npm run verify:preview"
        
    } catch {
        Write-Error "验证过程中发生错误：$($_.Exception.Message)"
        Write-Warning "请检查错误信息并修复问题"
        Write-Info "如需帮助，请把红字丢给Cursor"
        exit 1
    }
}

# 执行主函数
Main
