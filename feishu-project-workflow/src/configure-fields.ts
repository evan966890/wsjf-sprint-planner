#!/usr/bin/env node
/**
 * 飞书项目质量指标字段配置主程序
 * 基于MCP示例项目的最佳实践
 */

import * as dotenv from 'dotenv';
import { FeishuProjectClient } from './feishu-project-client';

// 加载环境变量
dotenv.config();

// 输出Banner
function printBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标自动配置工具 v2.0                    ║
║                                                              ║
║     基于飞书官方API和MCP最佳实践                           ║
║     项目：iretail（国际零售业务+产品）                      ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

// 显示配置信息
function showConfiguration(): void {
  console.log('📋 配置信息:');
  console.log('----------------------------');
  console.log('项目标识: iretail');
  console.log('工作项类型: 需求(story)');
  console.log('字段数量: 5个质量指标');
  console.log('权限设置: 所有人可访问');
  console.log('----------------------------\n');
}

// 显示即将创建的字段
function showFieldsToCreate(): void {
  console.log('📊 即将创建的质量指标字段:');
  console.log('----------------------------');
  console.log('1. Lead Time（交付周期） - 从需求到上线的时间');
  console.log('2. 评审一次通过率 - 评审一次通过的比例');
  console.log('3. 并行事项吞吐量 - 团队并行处理的工作项数量');
  console.log('4. PRD返工率 - 需求文档返工的比例');
  console.log('5. 试点到GA迭代周期 - 从试点到全面推广的迭代次数');
  console.log('----------------------------\n');
}

// 主函数
async function main(): Promise<void> {
  try {
    // 显示启动信息
    printBanner();
    showConfiguration();
    showFieldsToCreate();

    // 确认执行
    console.log('⚠️ 注意事项:');
    console.log('1. 确保已获取有效的插件凭证');
    console.log('2. 确保具有字段管理权限');
    console.log('3. 字段创建后不易删除，请谨慎操作\n');

    // 创建客户端
    const client = new FeishuProjectClient();

    // 执行配置
    await client.createQualityMetricsFields();

  } catch (error: any) {
    console.error('\n❌ 程序执行出错:', error.message);
    process.exit(1);
  }
}

// 运行主程序
if (require.main === module) {
  main().catch(console.error);
}

export { main };