#!/bin/bash

# 一键打开本地项目网页 (macOS/Linux)
# 使用方法: npm run open:local:unix
# 功能: 自动安装依赖、选择端口、启动服务、打开浏览器

set -euo pipefail

start=3000
end=3010
timeout=90

# 检查项目文件
if [ ! -f package.json ]; then
    echo '❌ 未找到 package.json，请在项目根目录运行。'
    exit 1
fi

echo "🚀 开始一键打开本地项目..."

# 1) 安装依赖（若已有可跳过）
echo "📦 安装依赖（如已安装将快速跳过）..."
npm install >/dev/null 2>&1 || true
echo "✅ 依赖安装完成"

# 2) 选择端口：优先可用端口
is_healthy() {
    local url="$1"
    local status_code=$(curl -s -m 3 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")
    [ "$status_code" = "200" ]
}

port=""

# 检查是否有已运行的服务
for p in $(seq $start $end); do
    if is_healthy "http://127.0.0.1:$p/api/health"; then
        port=$p
        echo "✅ 检测到已运行服务：端口 $p"
        break
    elif ! nc -z 127.0.0.1 $p 2>/dev/null; then
        port=$p
        echo "✅ 找到可用端口：$p"
        break
    fi
done

# 如果没有找到可用端口，使用默认端口
: "${port:=$start}"
export PORT="$port"
base="http://127.0.0.1:$port"
health="$base/api/health"

echo "🌐 使用端口：$port"
echo "🔗 服务地址：$base"

# 3) 若未就绪则启动 dev
if ! is_healthy "$health"; then
    echo "🚀 启动开发服务（端口 $port）..."
    npm run dev >/dev/null 2>&1 &
    dev_pid=$!
    
    # 4) 等待健康检查就绪
    echo "⏳ 等待服务就绪（最多 $timeout 秒）..."
    ok=0
    
    for i in $(seq 1 $timeout); do
        if is_healthy "$health"; then
            ok=1
            echo "✅ 服务启动成功！"
            break
        fi
        
        if [ $((i % 10)) -eq 0 ]; then
            echo "⏳ 已等待 ${i} 秒..."
        fi
        
        sleep 1
    done
    
    if [ $ok -ne 1 ]; then
        echo "❌ 等待超时：$health 未就绪"
        echo "💡 建议：npx kill-port $port; export PORT='$((port+1))'; npm run dev 再试"
        kill $dev_pid 2>/dev/null || true
        exit 2
    fi
else
    echo "✅ 服务已在运行"
fi

# 5) 打开浏览器到首页和体检页
echo "🌐 打开浏览器..."
if command -v xdg-open >/dev/null; then
    # Linux
    xdg-open "$base" &
    sleep 1
    xdg-open "$health" &
    echo "✅ 浏览器已打开"
elif command -v open >/dev/null; then
    # macOS
    open "$base"
    sleep 1
    open "$health"
    echo "✅ 浏览器已打开"
else
    echo "⚠️  无法自动打开浏览器，请手动访问："
    echo "首页：$base"
    echo "健康检查：$health"
fi

# 设置环境变量供后续使用
export BASE_URL="$base"

# 输出结果
echo ""
echo "🎉 本地项目已启动！"
echo "🌐 首页地址：$base"
echo "🔍 健康检查：$health"
echo "💡 提示：使用 127.0.0.1 比 localhost 更稳定"
echo ""
echo "📋 如需自动体检，请运行："
echo "   npm run verify:local:unix"
echo ""
echo "🔧 如需手动测试，请运行："
echo "   export BASE_URL='$base'; npm run test:all"
