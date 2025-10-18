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
 * 重要提示：
 * 为了安全起见，请不要直接在代码中填写API Key！
 *
 * 配置方法：
 * 1. 创建 .env.local 文件（已被git忽略，不会提交到代码库）
 * 2. 在文件中添加以下内容：
 *    VITE_OPENAI_API_KEY=your_openai_key_here
 *    VITE_DEEPSEEK_API_KEY=your_deepseek_key_here
 * 3. 重启开发服务器
 *
 * OpenAI API Key获取方式：
 * - 访问 https://platform.openai.com/api-keys 创建API Key
 * - 适用于海外服务器部署或可访问OpenAI服务的环境
 *
 * DeepSeek API Key获取方式：
 * - 访问 https://platform.deepseek.com/api_keys 创建API Key
 * - 适用于中国大陆服务器部署（如腾讯云、阿里云等）
 * - DeepSeek在国内访问速度更快，价格更优惠
 *
 * 临时配置方法（仅用于测试，不推荐）：
 * 如果确实需要在代码中临时配置（如个人开发环境），请：
 * 1. 将下方的空字符串替换为您的API Key
 * 2. 绝对不要提交这些更改到Git仓库
 * 3. 使用完后立即恢复为空字符串
 */

// 优先使用环境变量，如果没有则使用下方的临时配置
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''; // 请勿在此直接填入API Key，使用.env.local文件
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''; // 请勿在此直接填入API Key，使用.env.local文件
