// 飞书项目流程管理配置API客户端
const axios = require('axios');
const fs = require('fs').promises;

class FeishuProjectAPI {
    constructor(config) {
        this.baseURL = 'https://project.feishu.cn/open_api';
        this.pluginToken = config.pluginToken;
        this.userKey = config.userKey;
        this.projectKey = config.projectKey;

        // 创建axios实例
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'X-PLUGIN-TOKEN': this.pluginToken,
                'X-USER-KEY': this.userKey
            },
            timeout: 30000
        });

        // 请求拦截器 - 添加幂等性UUID
        this.client.interceptors.request.use((config) => {
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
                config.headers['X-IDEM-UUID'] = this.generateUUID();
            }
            console.log(`[API请求] ${config.method.toUpperCase()} ${config.url}`);
            return config;
        });

        // 响应拦截器
        this.client.interceptors.response.use(
            (response) => {
                console.log(`[API响应] 成功 - ${response.status}`);
                return response.data;
            },
            (error) => {
                console.error(`[API错误] ${error.message}`);
                if (error.response) {
                    console.error(`错误详情:`, error.response.data);
                }
                throw error;
            }
        );
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 获取工作项类型列表
    async getWorkItemTypes() {
        try {
            const response = await this.client.get(`/${this.projectKey}/work_item_types`);
            return response.data;
        } catch (error) {
            console.error('获取工作项类型失败:', error);
            return null;
        }
    }

    // 获取流程模板列表
    async getTemplateList(workItemTypeKey) {
        try {
            const response = await this.client.get(
                `/${this.projectKey}/template_list/${workItemTypeKey}`
            );
            return response.data;
        } catch (error) {
            console.error('获取流程模板失败:', error);
            return null;
        }
    }

    // 获取字段列表
    async getFields(workItemTypeKey) {
        try {
            const response = await this.client.get(
                `/${this.projectKey}/field/${workItemTypeKey}`
            );
            return response.data;
        } catch (error) {
            console.error('获取字段列表失败:', error);
            return null;
        }
    }

    // 创建自定义字段
    async createCustomField(workItemTypeKey, fieldConfig) {
        try {
            const response = await this.client.post(
                `/${this.projectKey}/field/${workItemTypeKey}/create`,
                fieldConfig
            );
            return response.data;
        } catch (error) {
            console.error('创建自定义字段失败:', error);
            return null;
        }
    }

    // 更新流程配置
    async updateProcessConfig(workItemTypeKey, processConfig) {
        try {
            const response = await this.client.put(
                `/${this.projectKey}/process/${workItemTypeKey}/config`,
                processConfig
            );
            return response.data;
        } catch (error) {
            console.error('更新流程配置失败:', error);
            return null;
        }
    }

    // 创建流程节点
    async createProcessNode(workItemTypeKey, nodeConfig) {
        try {
            const response = await this.client.post(
                `/${this.projectKey}/process/${workItemTypeKey}/node`,
                nodeConfig
            );
            return response.data;
        } catch (error) {
            console.error('创建流程节点失败:', error);
            return null;
        }
    }

    // 创建流程转换规则
    async createTransition(workItemTypeKey, transitionConfig) {
        try {
            const response = await this.client.post(
                `/${this.projectKey}/process/${workItemTypeKey}/transition`,
                transitionConfig
            );
            return response.data;
        } catch (error) {
            console.error('创建流程转换失败:', error);
            return null;
        }
    }

    // 配置质量指标规则
    async configureMetrics(metricsConfig) {
        try {
            const response = await this.client.post(
                `/${this.projectKey}/metrics/configure`,
                metricsConfig
            );
            return response.data;
        } catch (error) {
            console.error('配置质量指标失败:', error);
            return null;
        }
    }

    // 批量创建字段
    async createFieldsBatch(workItemTypeKey, fields) {
        const results = [];
        for (const field of fields) {
            console.log(`创建字段: ${field.name}`);
            const result = await this.createCustomField(workItemTypeKey, field);
            results.push({ field: field.name, success: !!result });
            // 避免触发限流，添加延迟
            await this.delay(100);
        }
        return results;
    }

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 主配置函数
async function configureWorkflow() {
    console.log('===== 飞书项目流程管理配置 =====\n');

    // 读取配置文件
    const workflowConfig = JSON.parse(
        await fs.readFile('./workflow-config.json', 'utf8')
    );

    // 读取认证配置
    let authConfig;
    try {
        authConfig = JSON.parse(
            await fs.readFile('./auth-config.json', 'utf8')
        );
    } catch (error) {
        console.error('请先创建 auth-config.json 文件配置认证信息');
        return;
    }

    // 初始化API客户端
    const api = new FeishuProjectAPI(authConfig);

    console.log('1. 获取现有工作项类型...');
    const workItemTypes = await api.getWorkItemTypes();
    if (workItemTypes) {
        console.log('工作项类型:', workItemTypes);
    }

    console.log('\n2. 获取需求工作项的流程模板...');
    const templates = await api.getTemplateList('requirement');
    if (templates) {
        console.log('流程模板:', templates);
    }

    console.log('\n3. 创建流程管理字段...');
    const allFields = [];

    // 收集所有节点的字段
    for (const node of workflowConfig.processManagement.nodes) {
        for (const field of node.fields) {
            // 避免重复
            if (!allFields.find(f => f.key === field.key)) {
                allFields.push({
                    key: field.key,
                    name: field.name,
                    type: field.type,
                    required: field.required || false,
                    description: field.description || '',
                    options: field.options || null,
                    default: field.default || null
                });
            }
        }
    }

    console.log(`准备创建 ${allFields.length} 个字段`);
    const fieldResults = await api.createFieldsBatch('requirement', allFields);

    console.log('\n字段创建结果:');
    fieldResults.forEach(result => {
        console.log(`  - ${result.field}: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    });

    console.log('\n4. 创建流程节点...');
    for (const node of workflowConfig.processManagement.nodes) {
        console.log(`创建节点: ${node.name}`);
        const nodeResult = await api.createProcessNode('requirement', {
            id: node.id,
            name: node.name,
            type: node.type,
            fields: node.fields.map(f => f.key)
        });

        if (nodeResult) {
            console.log(`  ✅ ${node.name} 创建成功`);
        } else {
            console.log(`  ❌ ${node.name} 创建失败`);
        }

        await api.delay(100);
    }

    console.log('\n5. 创建流程转换规则...');
    for (const transition of workflowConfig.processManagement.transitions) {
        console.log(`创建转换: ${transition.name}`);
        const transitionResult = await api.createTransition('requirement', transition);

        if (transitionResult) {
            console.log(`  ✅ ${transition.name} 创建成功`);
        } else {
            console.log(`  ❌ ${transition.name} 创建失败`);
        }

        await api.delay(100);
    }

    console.log('\n6. 配置质量指标...');
    const metricsResult = await api.configureMetrics(workflowConfig.qualityMetrics);
    if (metricsResult) {
        console.log('✅ 质量指标配置成功');
    } else {
        console.log('❌ 质量指标配置失败');
    }

    console.log('\n===== 配置完成 =====');

    // 生成配置报告
    const report = {
        timestamp: new Date().toISOString(),
        project: authConfig.projectKey,
        fields: {
            total: allFields.length,
            created: fieldResults.filter(r => r.success).length,
            failed: fieldResults.filter(r => !r.success).length
        },
        nodes: workflowConfig.processManagement.nodes.length,
        transitions: workflowConfig.processManagement.transitions.length,
        metrics: Object.keys(workflowConfig.qualityMetrics).length
    };

    await fs.writeFile(
        './configuration-report.json',
        JSON.stringify(report, null, 2)
    );

    console.log('\n配置报告已保存到 configuration-report.json');
}

// 导出模块
module.exports = {
    FeishuProjectAPI,
    configureWorkflow
};

// 如果直接运行脚本
if (require.main === module) {
    configureWorkflow().catch(console.error);
}