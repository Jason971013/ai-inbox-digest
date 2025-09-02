#!/bin/bash

# 一键部署到 Vercel 并在 Preview 域名跑远程验证
# 使用方法: ./scripts/preview-deploy-and-verify.sh

set -e

BRANCH=${1:-"preview"}
SKIP_DEPLOY=${2:-"false"}
SKIP_VERIFY=${3:-"false"}

echo "🚀 开始一键部署到 Vercel 并验证..."

# 检查环境变量
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ 错误: 未设置 VERCEL_TOKEN 环境变量"
    echo "请设置: export VERCEL_TOKEN='your_token_here'"
    echo "或在 .env.local 文件中设置"
    exit 1
fi

# 检查是否在 Git 仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是 Git 仓库"
    exit 1
fi

# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"

# 创建预览分支（如果不存在）
if [ "$BRANCH" != "$CURRENT_BRANCH" ]; then
    echo "🔄 切换到预览分支: $BRANCH"
    git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"
    git push -u origin "$BRANCH"
fi

# 部署到 Vercel
if [ "$SKIP_DEPLOY" != "true" ]; then
    echo "🌐 部署到 Vercel..."
    
    # 安装 Vercel CLI（如果未安装）
    if ! command -v vercel &> /dev/null; then
        echo "📦 安装 Vercel CLI..."
        npm install -g vercel@latest
    fi
    
    # 检查现有配置
    if [ -f ".vercel/project.json" ]; then
        echo "📁 使用现有 .vercel/project.json 配置"
    else
        echo "📁 创建新的 Vercel 项目配置"
    fi
    
    # 部署
    echo "🚀 开始部署..."
    DEPLOY_OUTPUT=$(vercel --prod --token="$VERCEL_TOKEN" --yes 2>&1)
    if [ $? -eq 0 ]; then
        # 解析 Preview URL
        PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*\.vercel\.app' | head -1)
        if [ -n "$PREVIEW_URL" ]; then
            echo "✅ 部署成功! Preview URL: $PREVIEW_URL"
            export BASE_URL="$PREVIEW_URL"
        else
            echo "⚠️  部署成功但无法解析 Preview URL"
            echo "部署输出: $DEPLOY_OUTPUT"
        fi
    else
        echo "❌ 部署失败: $DEPLOY_OUTPUT"
        exit 1
    fi
else
    echo "⏭️  跳过部署步骤"
fi

# 等待部署完成
if [ "$SKIP_DEPLOY" != "true" ] && [ -n "$BASE_URL" ]; then
    echo "⏳ 等待部署完成..."
    sleep 15
    
    # 检查健康状态
    echo "🔍 检查部署健康状态..."
    if curl -f -s "$BASE_URL/api/health" > /dev/null; then
        echo "✅ 健康检查通过"
        # 获取详细健康信息
        HEALTH_INFO=$(curl -s "$BASE_URL/api/health")
        echo "📊 服务状态: $HEALTH_INFO"
    else
        echo "⚠️  健康检查失败，继续执行测试..."
    fi
fi

# 验证部署
if [ "$SKIP_VERIFY" != "true" ]; then
    echo "🧪 开始验证部署..."
    
    # 运行测试
    echo "🧪 运行 Playwright 测试..."
    if [ -n "$BASE_URL" ]; then
        echo "🌐 在 Preview URL 上运行测试: $BASE_URL"
        BASE_URL="$BASE_URL" npm run test:all
    else
        echo "⚠️  未设置 BASE_URL，使用本地测试"
        npm run test:all
    fi
    
    # 显示报告
    echo "📊 测试完成，显示报告..."
    npm run report
else
    echo "⏭️  跳过验证步骤"
fi

echo "🎉 一键部署验证完成!"
if [ -n "$BASE_URL" ]; then
    echo "🌐 Preview URL: $BASE_URL"
fi
echo "📊 测试报告: playwright-report/index.html"
