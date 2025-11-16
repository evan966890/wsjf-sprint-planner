#!/usr/bin/env node
/**
 * 快速创建质量指标字段 - 使用已获取的Token
 */

const axios = require('axios');
const https = require('https');

// 使用刚刚通过curl获取的token
const PLUGIN_TOKEN = 'p-0bbb0f4f-e42f-471e-b3a7-5d7149e2476d';
const USER_KEY = '7541721806923694188';
const PROJECT_KEY = 'iretail';
const BASE_URL = 'https://project.f.mioffice.cn';

// 质量指标字段定义（用户要求的5个字段）
const qualityFields = [
  {
    name: 'Lead Time（交付周期）',
    alias: 'quality_lead_time',
    description: '从需求创建到上线的平均时间（天）',
    type: 'number'
  },
  {
    name: '评审一次通过率',
    alias: 'quality_review_pass_rate',
    description: '评审一次通过的比例（%）',
    type: 'number'
  },
  {
    name: '并行事项吞吐量',
    alias: 'quality_throughput',
    description: '团队并行处理的工作项数量',
    type: 'number'
  },
  {
    name: 'PRD返工率',
    alias: 'quality_prd_rework_rate',
    description: '需求文档返工的比例（%）',
    type: 'number'
  },
  {
    name: '试点到GA迭代周期',
    alias: 'quality_pilot_to_ga',
    description: '从试点到全面推广的迭代次数',
    type: 'number'
  }
];

// 创建axios实例
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-PLUGIN-TOKEN': PLUGIN_TOKEN,
    'X-USER-KEY': USER_KEY
  },
  // 处理代理
  proxy: false,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// 生成字段key
function generateFieldKey() {
  return Math.random().toString(36).substring(2, 8);
}

// 创建单个字段
async function createField(field) {
  console.log(`\n📝 创建字段: ${field.name}`);

  const endpoint = `/goapi/v3/settings/${PROJECT_KEY}/story/field`;

  const payload = {
    sync_uuid: '',
    field: {
      scope: ['story'],
      authorized_roles: ['_anybody'],
      plg_key: '',
      validity: {
        condition_group: { conjunction: '' },
        usage_mode: '',
        value: null
      },
      default_value: {
        condition_group: { conjunction: '' },
        usage_mode: '',
        value: null,
        bqls: []
      },
      alias: field.alias,
      name: field.name,
      tooltip: field.description,
      type: field.type,
      project: PROJECT_KEY,
      key: `field_${generateFieldKey()}`
    }
  };

  try {
    const response = await client.post(endpoint, payload, {
      headers: {
        'x-meego-csrf-token': 'EB0Lt4gu-nmqg-Cq8M-2pgo-Qy0DvtsKkqGC',
        'x-meego-source': 'web/-1.0.0.1490',
        'x-meego-from': 'web',
        'x-meego-scope': 'workObjectSettingfieldManagement',
        'x-lark-gw': '1',
        'locale': 'zh',
        'x-content-language': 'zh'
      }
    });

    if (response.data && (response.data.code === 0 || response.data.error?.code === 0)) {
      console.log(`✅ 字段 "${field.name}" 创建成功!`);
      return true;
    } else {
      console.error(`❌ 创建失败:`, response.data);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ 创建字段失败:`, error.response.data);
      if (error.response.data?.error?.msg?.includes('已存在')) {
        console.log(`⚠️ 字段可能已存在，跳过...`);
        return true;
      }
    } else {
      console.error(`❌ 请求失败:`, error.message);
    }
    return false;
  }
}

// 主函数
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🚀 飞书项目质量指标快速配置工具                         ║
║                                                              ║
║     正在使用预获取的Token创建字段...                        ║
╚══════════════════════════════════════════════════════════════╝
  `);

  console.log('📋 配置信息:');
  console.log('- 项目:', PROJECT_KEY);
  console.log('- Token:', PLUGIN_TOKEN.substring(0, 20) + '...');
  console.log('- 字段数量:', qualityFields.length);
  console.log('\n' + '='.repeat(60));

  let successCount = 0;

  for (let i = 0; i < qualityFields.length; i++) {
    const field = qualityFields[i];
    console.log(`\n[${i + 1}/${qualityFields.length}] 处理字段...`);

    const success = await createField(field);
    if (success) {
      successCount++;
    }

    // 避免请求过快
    if (i < qualityFields.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 结果: ${successCount}/${qualityFields.length} 个字段创建成功`);

  if (successCount === qualityFields.length) {
    console.log('\n🎉 所有质量指标字段创建成功!');
    console.log('\n请访问以下地址验证:');
    console.log(`${BASE_URL}/${PROJECT_KEY}/setting/workObject/story?menuTab=fieldManagement`);
  } else if (successCount > 0) {
    console.log('\n⚠️ 部分字段创建成功，请检查上面的错误信息');
  } else {
    console.log('\n❌ 字段创建失败，请检查权限和配置');
  }
}

// 运行主程序
main().catch(console.error);