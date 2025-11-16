/**
 * 飞书项目API客户端
 * 基于官方API实现字段管理功能
 */

import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { config } from './config';

interface FieldConfig {
  name: string;
  alias: string;
  description: string;
  type: string;
  unit?: string;
}

interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export class FeishuProjectClient {
  private baseUrl: string;
  private pluginId: string;
  private pluginSecret: string;
  private userKey: string;
  private projectKey: string;
  private pluginToken: string | null = null;
  private axiosInstance: AxiosInstance;

  constructor() {
    const { feishuProject } = config;
    this.baseUrl = feishuProject.baseUrl;
    this.pluginId = feishuProject.pluginId;
    this.pluginSecret = feishuProject.pluginSecret;
    this.userKey = feishuProject.userKey;
    this.projectKey = feishuProject.projectKey;

    // 调试信息
    console.log('🔧 配置信息:');
    console.log('- BaseURL:', this.baseUrl);
    console.log('- Project Key:', this.projectKey);
    console.log('- Plugin ID:', this.pluginId ? this.pluginId.substring(0, 10) + '...' : 'not set');

    // 创建axios实例，显式配置HTTPS
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      // 显式使用HTTPS agent
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // 允许自签名证书
      })
    });

    // 添加响应拦截器
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        console.error('API请求失败:', error.message);
        if (error.response) {
          console.error('响应状态:', error.response.status);
          console.error('响应数据:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取插件Token
   */
  async authenticate(): Promise<boolean> {
    console.log('🔑 开始获取插件Token...');
    const authUrl = '/open_api/authen/plugin_token';
    console.log('- 认证URL:', this.baseUrl + authUrl);

    try {
      const response = await this.axiosInstance.post<ApiResponse<{ token: string }>>(
        authUrl,
        {
          plugin_id: this.pluginId,
          plugin_secret: this.pluginSecret
        }
      );

      if (response.data.code === 0) {
        this.pluginToken = response.data.data.token;
        console.log('✅ Token获取成功:', this.pluginToken.substring(0, 20) + '...');

        // 设置默认headers
        this.axiosInstance.defaults.headers['X-PLUGIN-TOKEN'] = this.pluginToken;
        this.axiosInstance.defaults.headers['X-USER-KEY'] = this.userKey;

        return true;
      } else {
        console.error('❌ 获取Token失败:', response.data.msg);
        return false;
      }
    } catch (error: any) {
      console.error('❌ 认证请求异常:', error.message);
      return false;
    }
  }

  /**
   * 创建自定义字段
   */
  async createField(workItemType: string, field: FieldConfig): Promise<boolean> {
    if (!this.pluginToken) {
      console.error('❌ 未认证，请先调用authenticate()');
      return false;
    }

    console.log(`📝 创建字段: ${field.name}`);

    try {
      // 使用捕获的实际API格式
      const endpoint = `/goapi/v3/settings/${this.projectKey}/${workItemType}/field`;

      const payload = {
        sync_uuid: '',
        field: {
          scope: [workItemType],
          authorized_roles: ['_anybody'],  // 任何人可访问
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
          project: this.projectKey,
          key: `field_${this.generateFieldKey()}`
        }
      };

      const response = await this.axiosInstance.post<ApiResponse>(endpoint, payload, {
        headers: {
          'x-meego-csrf-token': await this.getCsrfToken(),
          'x-meego-source': 'web/-1.0.0.1490',
          'x-meego-from': 'web',
          'x-meego-scope': 'workObjectSettingfieldManagement',
          'x-lark-gw': '1',
          'locale': 'zh',
          'x-content-language': 'zh'
        }
      });

      if (response.data.code === 0) {
        console.log(`✅ 字段 "${field.name}" 创建成功!`);
        return true;
      } else {
        console.error(`❌ 创建失败: ${response.data.msg}`);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ 创建字段异常:`, error.message);
      return false;
    }
  }

  /**
   * 获取CSRF Token（如果需要）
   */
  private async getCsrfToken(): Promise<string> {
    // 这里可以通过其他API获取CSRF Token
    // 暂时返回一个占位符
    return 'csrf-token-placeholder';
  }

  /**
   * 生成字段key
   */
  private generateFieldKey(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  /**
   * 创建所有质量指标字段
   */
  async createQualityMetricsFields(): Promise<void> {
    console.log('\n🚀 开始创建质量指标字段...\n');
    console.log('='.repeat(60));

    // 1. 认证
    const authenticated = await this.authenticate();
    if (!authenticated) {
      console.error('❌ 认证失败，无法继续');
      return;
    }

    // 2. 创建字段
    const fields = config.qualityFields;
    let successCount = 0;

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      console.log(`\n[${i + 1}/${fields.length}] 创建字段: ${field.name}`);

      const success = await this.createField('story', field);
      if (success) {
        successCount++;
      }

      // 避免请求过快
      if (i < fields.length - 1) {
        await this.delay(1000);
      }
    }

    // 3. 输出结果
    console.log('\n' + '='.repeat(60));
    console.log(`📊 结果: ${successCount}/${fields.length} 个字段创建成功`);
    console.log('='.repeat(60));

    if (successCount === fields.length) {
      console.log('\n🎉 所有质量指标字段创建成功!');
      console.log('请访问以下地址验证:');
      console.log(`${this.baseUrl}/${this.projectKey}/setting/workObject/story?menuTab=fieldManagement`);
    } else {
      console.log('\n⚠️ 部分字段创建失败，请检查错误信息');
    }
  }

  /**
   * 延时函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default FeishuProjectClient;