#!/bin/bash

# 本地验证脚本：验证所有功能在本地正常工作
# 使用方法: ./scripts/verify-local.sh

set -e

echo "🧪 开始本地验证..."

# 检查依赖
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 安装 Playwright
echo "🎭 安装 Playwright..."
npm run prep
if [ $? -ne 0 ]; then
    echo "❌ Playwright 安装失败"
    exit 1
fi

# 端口自适配函数
find_available_port() {
    local start_port=${1:-3000}
    local port=$start_port
    local max_attempts=10
    
    for ((i=0; i<max_attempts; i++)); do
        if ! nc -z 127.0.0.1 $port 2>/dev/null; then
            echo "✅ 找到可用端口: $port"
            return $port
        else
            echo "⚠️  端口 $port 被占用，尝试下一个..."
            ((port++))
        fi
    done
    
    echo "❌ 无法找到可用端口"
    return 1
}

# 检查开发服务器状态
echo "🔍 检查开发服务器状态..."
DEV_SERVER_RUNNING=false
AVAILABLE_PORT=""
DEV_PID=""

# 尝试检测已运行的开发服务器
for port in {3000..3010}; do
    if curl -f -s "http://127.0.0.1:$port/api/health" > /dev/null 2>&1; then
        DEV_SERVER_RUNNING=true
        AVAILABLE_PORT=$port
        echo "✅ 发现已运行的开发服务器在端口 $port"
        break
    fi
done

# 如果没有发现运行中的服务器，启动新的
if [ "$DEV_SERVER_RUNNING" = false ]; then
    echo "🚀 启动开发服务器..."
    
    # 查找可用端口
    if find_available_port; then
        AVAILABLE_PORT=$?
    else
        echo "❌ 无法找到可用端口，退出"
        exit 1
    fi
    
    # 设置端口环境变量并启动服务器
    export PORT=$AVAILABLE_PORT
    echo "🌐 使用端口: $AVAILABLE_PORT"
    
    npm run dev &
    DEV_PID=$!
    
    # 等待服务器启动
    echo "⏳ 等待服务器启动..."
    sleep 5
    
    # 循环探测直到服务可用或超时
    max_wait_time=90  # 90秒超时
    start_time=$(date +%s)
    health_check_passed=false
    
    while [ "$health_check_passed" = false ] && [ $(($(date +%s) - start_time)) -lt $max_wait_time ]; do
        if curl -f -s "http://127.0.0.1:$AVAILABLE_PORT/api/health" > /dev/null 2>&1; then
            health_check_passed=true
            echo "✅ 服务器启动成功！"
        else
            elapsed=$(($(date +%s) - start_time))
            echo "⏳ 等待服务器响应... (已等待 ${elapsed}s)"
            sleep 3
        fi
    done
    
    if [ "$health_check_passed" = false ]; then
        echo "❌ 服务器启动超时"
        if [ -n "$DEV_PID" ]; then
            kill $DEV_PID 2>/dev/null || true
        fi
        echo "🔧 故障诊断信息:"
        echo "1. 监听端口: $AVAILABLE_PORT"
        echo "2. 最近日志:"
        ps aux | grep -E "(node|npm)" | grep -v grep | while read line; do
            echo "   $line"
        done
        echo "3. 重新尝试命令:"
        echo "   npx kill-port $AVAILABLE_PORT && npm run dev"
        exit 1
    fi
else
    echo "✅ 使用已运行的开发服务器"
fi

# 设置 BASE_URL
BASE_URL="http://127.0.0.1:$AVAILABLE_PORT"
export BASE_URL
echo "🌐 BASE_URL 设置为: $BASE_URL"

# 检查健康状态
echo "🔍 检查部署健康状态..."
if curl -f -s "$BASE_URL/api/health" > /dev/null; then
    echo "✅ 健康检查通过"
    # 获取详细健康信息
    HEALTH_INFO=$(curl -s "$BASE_URL/api/health")
    echo "📊 服务状态: $HEALTH_INFO"
    
    # 解析 JSON 信息
    if command -v jq &> /dev/null; then
        echo "🔧 Mock模式: $(echo "$HEALTH_INFO" | jq -r '.using_mock')"
        echo "💬 状态信息: $(echo "$HEALTH_INFO" | jq -r '.message')"
    fi
else
    echo "❌ 健康检查失败"
    echo "🔧 故障诊断信息:"
    echo "1. 监听端口: $AVAILABLE_PORT"
    echo "2. 最近日志:"
    ps aux | grep -E "(node|npm)" | grep -v grep | while read line; do
        echo "   $line"
    done
    echo "3. 重新尝试命令:"
    echo "   npx kill-port $AVAILABLE_PORT && npm run dev"
    exit 1
fi

# 运行测试
echo "🧪 运行 Playwright 测试..."
echo "🌐 在端口 $AVAILABLE_PORT 上运行测试: $BASE_URL"

npm run test:all
TEST_EXIT_CODE=$?

# 停止开发服务器（如果是我们启动的）
if [ -n "$DEV_PID" ]; then
    echo "🛑 停止开发服务器..."
    kill $DEV_PID 2>/dev/null || true
fi

# 显示报告
echo "📊 测试完成，显示报告..."
npm run report

# 输出结果摘要
echo "🎉 本地验证完成!"
echo "📊 测试报告: playwright-report/index.html"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 所有测试通过！系统运行正常"
else
    echo "⚠️  部分测试失败，请查看报告了解详情"
fi

echo "🌐 首页地址: $BASE_URL"
echo "🔍 健康检查: $BASE_URL/api/health"
echo "💡 提示: 使用 127.0.0.1 比 localhost 更稳定"
