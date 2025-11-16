#!/bin/bash

echo "========================================"
echo "  飞书项目质量指标自动配置工具 v2.0"
echo "========================================"
echo ""

# 检查是否存在node_modules
if [ ! -d "node_modules" ]; then
    echo "[1/3] 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误：依赖安装失败"
        exit 1
    fi
    echo "依赖安装成功！"
    echo ""
fi

# 检查是否存在.env文件
if [ ! -f ".env" ]; then
    echo "[2/3] 创建环境配置文件..."
    cp .env.example .env
    echo "已创建 .env 文件，使用默认配置"
    echo ""
fi

# 编译TypeScript
echo "[2/3] 编译TypeScript..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "警告：编译失败，尝试直接运行TypeScript..."
    echo ""
    echo "[3/3] 运行配置脚本..."
    npm run config
else
    echo "编译成功！"
    echo ""
    echo "[3/3] 运行配置脚本..."
    npm start
fi

echo ""
echo "========================================"
echo "配置完成！请访问以下地址验证："
echo "https://project.f.mioffice.cn/iretail/setting/workObject/story?menuTab=fieldManagement"
echo "========================================"
echo ""