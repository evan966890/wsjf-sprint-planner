/**
 * WSJF Sprint Planner - API配置
 *
 * AI模型API配置
 * 用于AI智能字段映射功能
 *
 * 支持两种AI模型：
 * 1. OpenAI（海外部署推荐）- GPT-3.5-Turbo
 * 2. DeepSeek（中国大陆部署推荐）- DeepSeek-Chat
 *
 * OpenAI配置说明：
 * 1. 将您的OpenAI API Key填入下方OPENAI_API_KEY常量
 * 2. 获取方式：访问 https://platform.openai.com/api-keys 创建API Key
 * 3. 适用于海外服务器部署或可访问OpenAI服务的环境
 *
 * DeepSeek配置说明：
 * 1. 将您的DeepSeek API Key填入下方DEEPSEEK_API_KEY常量
 * 2. 获取方式：访问 https://platform.deepseek.com/api_keys 创建API Key
 * 3. 适用于中国大陆服务器部署（如腾讯云、阿里云等）
 * 4. DeepSeek在国内访问速度更快，价格更优惠
 *
 * 用户可在导入界面自由切换使用哪个AI模型
 */
export const OPENAI_API_KEY = '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'; // 请在此处填入您的OpenAI API Key
export const DEEPSEEK_API_KEY = 'sk-7a09262cd91d4e91b7439d0097426b4c'; // 请在此处填入您的DeepSeek API Key
