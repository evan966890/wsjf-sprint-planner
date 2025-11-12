#!/bin/bash

###############################################################################
# 腾讯云 CloudBase 部署脚本
# 功能：构建项目并部署到腾讯云静态网站托管
###############################################################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 WSJF Sprint Planner - 腾讯云部署"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必需的命令
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到命令 '$1'${NC}"
    echo -e "${YELLOW}请安装: $2${NC}"
    exit 1
  fi
}

echo -e "${BLUE}📋 步骤 1/6: 检查环境依赖${NC}"
check_command "node" "https://nodejs.org/"
check_command "npm" "https://nodejs.org/"
echo -e "${GREEN}✅ 环境依赖检查通过${NC}"
echo ""

# 检查是否安装 CloudBase CLI
echo -e "${BLUE}📋 步骤 2/6: 检查 CloudBase CLI${NC}"
if ! command -v cloudbase &> /dev/null; then
  echo -e "${YELLOW}⚠️  未找到 CloudBase CLI，正在安装...${NC}"
  npm install -g @cloudbase/cli
  echo -e "${GREEN}✅ CloudBase CLI 安装完成${NC}"
else
  echo -e "${GREEN}✅ CloudBase CLI 已安装${NC}"
fi
echo ""

# 检查环境变量
echo -e "${BLUE}📋 步骤 3/6: 检查环境配置${NC}"
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  未找到 .env.local 文件${NC}"
  echo -e "${YELLOW}   如果需要AI功能，请复制 .env.example 并填写配置${NC}"
  echo -e "${YELLOW}   cp .env.example .env.local${NC}"
else
  echo -e "${GREEN}✅ 环境配置文件存在${NC}"
fi
echo ""

# 检查 CloudBase 登录状态
echo -e "${BLUE}📋 步骤 4/6: 检查 CloudBase 登录状态${NC}"
if ! cloudbase login --check &> /dev/null; then
  echo -e "${YELLOW}⚠️  未登录 CloudBase，请先登录${NC}"
  echo -e "${YELLOW}   执行: cloudbase login${NC}"
  exit 1
fi
echo -e "${GREEN}✅ CloudBase 已登录${NC}"
echo ""

# 运行部署前检查
echo -e "${BLUE}📋 步骤 5/6: 运行部署前检查${NC}"
npm run pre-deploy-check || {
  echo -e "${RED}❌ 部署前检查失败，请修复问题后重试${NC}"
  exit 1
}
echo -e "${GREEN}✅ 部署前检查通过${NC}"
echo ""

# 构建项目
echo -e "${BLUE}📋 步骤 6/6: 构建并部署项目${NC}"
echo -e "${YELLOW}正在构建...${NC}"
npm run build

echo -e "${YELLOW}正在部署到腾讯云...${NC}"
cloudbase framework deploy

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}📝 后续步骤：${NC}"
echo "1. 访问腾讯云 CloudBase 控制台查看部署状态"
echo "2. 获取静态网站托管域名"
echo "3. （可选）配置自定义域名"
echo "4. （可选）配置HTTPS证书"
echo ""
echo -e "${BLUE}🔗 相关链接：${NC}"
echo "- CloudBase 控制台: https://console.cloud.tencent.com/tcb"
echo "- 部署文档: docs/deployment/tencent-cloud-guide.md"
echo ""
