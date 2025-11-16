#!/usr/bin/env node
/**
 * 创建剩余的4个质量指标字段
 * 跳过已创建的Lead Time字段
 */

const axios = require('axios');
const https = require('https');

// 使用之前成功的配置
const PLUGIN_TOKEN = 'p-0bbb0f4f-e42f-471e-b3a7-5d7149e2476d';
const USER_KEY = '7541721806923694188';
const PROJECT_KEY = 'iretail';
const BASE_URL = 'https://project.f.mioffice.cn';
const CSRF_TOKEN = 'EB0Lt4gu-nmqg-Cq8M-2pgo-Qy0DvtsKkqGC'; // 已验证有效的CSRF Token

// 剩余4个质量指标字段（Lead Time已创建）
const remainingFields = [
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
        'x-meego-csrf-token': CSRF_TOKEN,
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
      const msg = response.data?.msg || response.data?.error?.msg || '未知错误';
      if (msg.includes('已存在') || msg.includes('exist')) {
        console.log(`⚠️ 字段 "${field.name}" 已存在，跳过`);
        return true;
      }
      console.error(`❌ 创建失败: ${msg}`);
      return false;
    }
  } catch (error) {
    if (error.response) {
      const errorMsg = error.response.data?.error?.msg || error.response.data?.msg || '';
      if (errorMsg.includes('已存在') || errorMsg.includes('exist')) {
        console.log(`⚠️ 字段 "${field.name}" 可能已存在，跳过`);
        return true;
      }
      console.error(`❌ 创建字段失败:`, error.response.data);
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
║     🚀 继续创建剩余的质量指标字段                           ║
║                                                              ║
║     已创建: Lead Time（交付周期）✅                         ║
║     待创建: 4个字段                                          ║
╚══════════════════════════════════════════════════════════════╝
  `);

  console.log('📋 配置信息:');
  console.log('- 项目:', PROJECT_KEY);
  console.log('- Token:', PLUGIN_TOKEN.substring(0, 20) + '...');
  console.log('- CSRF Token:', CSRF_TOKEN.substring(0, 20) + '...');
  console.log('- 待创建字段数:', remainingFields.length);
  console.log('\n' + '='.repeat(60));

  let successCount = 0;

  for (let i = 0; i < remainingFields.length; i++) {
    const field = remainingFields[i];
    console.log(`\n[${i + 1}/${remainingFields.length}] 处理字段...`);

    const success = await createField(field);
    if (success) {
      successCount++;
    }

    // 避免请求过快
    if (i < remainingFields.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 结果: ${successCount}/${remainingFields.length} 个字段创建成功`);

  if (successCount === remainingFields.length) {
    console.log('\n🎉 所有剩余的质量指标字段创建成功!');
    console.log('\n✅ 已完成的5个字段:');
    console.log('1. Lead Time（交付周期）');
    console.log('2. 评审一次通过率');
    console.log('3. 并行事项吞吐量');
    console.log('4. PRD返工率');
    console.log('5. 试点到GA迭代周期');
    console.log('\n请访问以下地址验证:');
    console.log(`${BASE_URL}/${PROJECT_KEY}/setting/workObject/story?menuTab=fieldManagement`);
  } else {
    console.log(`\n⚠️ ${successCount} 个字段成功，${remainingFields.length - successCount} 个失败`);
  }
}

// 运行主程序
main().catch(console.error);