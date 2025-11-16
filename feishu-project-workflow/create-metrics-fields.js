// 创建质量指标字段的简化脚本
const axios = require('axios');

// 质量指标字段定义
const metricsFields = [
    // Lead Time 相关
    {
        key: 'requirement_created_time',
        name: '需求创建时间',
        type: 'datetime',
        description: '需求首次创建的时间',
        required: true
    },
    {
        key: 'solution_start_time',
        name: '方案开始时间',
        type: 'datetime',
        description: '开始设计方案的时间'
    },
    {
        key: 'solution_end_time',
        name: '方案完成时间',
        type: 'datetime',
        description: '方案设计完成的时间'
    },
    {
        key: 'review_start_time',
        name: '评审开始时间',
        type: 'datetime',
        description: '第一次评审的时间'
    },
    {
        key: 'review_end_time',
        name: '评审通过时间',
        type: 'datetime',
        description: '评审最终通过的时间'
    },
    {
        key: 'deployment_time',
        name: '上线时间',
        type: 'datetime',
        description: '功能正式上线的时间',
        required: true
    },
    {
        key: 'lead_time_days',
        name: 'Lead Time (天)',
        type: 'number',
        description: '从需求创建到上线的总天数',
        formula: 'DATEDIFF(deployment_time, requirement_created_time, "day")'
    },

    // 评审通过率相关
    {
        key: 'review_result',
        name: '评审结果',
        type: 'select',
        options: ['一次通过', '修改后通过', '多次修改后通过', '未通过'],
        description: '评审的最终结果',
        required: true
    },
    {
        key: 'review_attempt_count',
        name: '评审轮次',
        type: 'number',
        description: '评审进行的总轮次',
        default: 1
    },
    {
        key: 'is_first_pass',
        name: '是否一次通过',
        type: 'boolean',
        description: '评审是否一次通过',
        formula: 'review_result == "一次通过"'
    },

    // 并行吞吐量相关
    {
        key: 'parallel_tasks_count',
        name: '并行任务数',
        type: 'number',
        description: '同时进行的任务数量'
    },
    {
        key: 'team_members_count',
        name: '参与人数',
        type: 'number',
        description: '参与该需求的团队成员数'
    },
    {
        key: 'throughput_score',
        name: '吞吐量评分',
        type: 'number',
        description: '团队吞吐量评分（1-10）'
    },

    // PRD返工率相关
    {
        key: 'prd_version',
        name: 'PRD版本号',
        type: 'text',
        description: '产品需求文档版本',
        default: 'v1.0'
    },
    {
        key: 'prd_rework_count',
        name: 'PRD返工次数',
        type: 'number',
        description: 'PRD被打回修改的次数',
        default: 0
    },
    {
        key: 'prd_rework_reasons',
        name: 'PRD返工原因',
        type: 'multitext',
        description: '每次PRD返工的原因记录'
    },
    {
        key: 'has_prd_rework',
        name: '是否有PRD返工',
        type: 'boolean',
        description: 'PRD是否经历过返工',
        formula: 'prd_rework_count > 0'
    },

    // 试点到推广相关
    {
        key: 'pilot_start_time',
        name: '试点开始时间',
        type: 'datetime',
        description: '功能开始试点的时间'
    },
    {
        key: 'pilot_end_time',
        name: '试点结束时间',
        type: 'datetime',
        description: '试点阶段结束的时间'
    },
    {
        key: 'full_release_time',
        name: '全面推广时间',
        type: 'datetime',
        description: '功能全面推广的时间'
    },
    {
        key: 'iteration_count',
        name: '迭代次数',
        type: 'number',
        description: '从试点到全面推广的迭代次数',
        default: 0
    },
    {
        key: 'pilot_feedback_score',
        name: '试点反馈评分',
        type: 'number',
        description: '试点用户的平均反馈评分（1-5）'
    },
    {
        key: 'pilot_to_ga_days',
        name: '试点到GA天数',
        type: 'number',
        description: '从试点到全面推广的天数',
        formula: 'DATEDIFF(full_release_time, pilot_start_time, "day")'
    }
];

// 创建字段的函数
async function createFields(config) {
    const baseURL = 'https://project.feishu.cn/open_api';

    const client = axios.create({
        baseURL: baseURL,
        headers: {
            'Content-Type': 'application/json',
            'X-PLUGIN-TOKEN': config.pluginToken,
            'X-USER-KEY': config.userKey
        },
        timeout: 30000
    });

    console.log('===== 开始创建质量指标字段 =====\n');
    console.log(`项目空间: ${config.projectKey}`);
    console.log(`工作项类型: requirement`);
    console.log(`准备创建 ${metricsFields.length} 个字段\n`);

    const results = [];

    for (let i = 0; i < metricsFields.length; i++) {
        const field = metricsFields[i];
        const progress = `[${i + 1}/${metricsFields.length}]`;

        try {
            console.log(`${progress} 创建字段: ${field.name} (${field.key})`);

            const response = await client.post(
                `/${config.projectKey}/field/requirement/create`,
                field,
                {
                    headers: {
                        'X-IDEM-UUID': generateUUID()
                    }
                }
            );

            if (response.data.err_code === 0) {
                console.log(`  ✅ 成功\n`);
                results.push({ ...field, success: true });
            } else {
                console.log(`  ❌ 失败: ${response.data.err_msg}\n`);
                results.push({ ...field, success: false, error: response.data.err_msg });
            }
        } catch (error) {
            console.log(`  ❌ 错误: ${error.message}\n`);
            results.push({ ...field, success: false, error: error.message });
        }

        // 避免触发限流
        await delay(200);
    }

    // 生成报告
    const report = {
        timestamp: new Date().toISOString(),
        project: config.projectKey,
        total: metricsFields.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
    };

    const fs = require('fs').promises;
    await fs.writeFile(
        './metrics-fields-report.json',
        JSON.stringify(report, null, 2)
    );

    console.log('\n===== 字段创建完成 =====');
    console.log(`成功: ${report.success} 个`);
    console.log(`失败: ${report.failed} 个`);
    console.log('\n详细报告已保存到 metrics-fields-report.json');

    // 如果有失败的字段，列出详情
    if (report.failed > 0) {
        console.log('\n失败的字段:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
    const fs = require('fs').promises;

    try {
        const configData = await fs.readFile('./auth-config.json', 'utf8');
        const config = JSON.parse(configData);
        await createFields(config);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('错误: 找不到 auth-config.json 文件');
            console.error('请复制 auth-config-template.json 并填入您的认证信息');
        } else {
            console.error('错误:', error.message);
        }
    }
}

// 如果直接运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createFields, metricsFields };