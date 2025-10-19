/**
 * WSJF Sprint Planner - API配置
 *
 * AI模型API配置，用于AI智能字段映射功能
 *
 * 支持两种AI模型：
 * 1. OpenAI（海外部署推荐）- GPT-3.5-Turbo
 * 2. DeepSeek（中国大陆部署推荐）- DeepSeek-Chat
 *
 * ⚠️ 安全警告：永远不要在此文件中直接写入API Key！
 *
 * 📖 正确的配置方法：
 *
 * 1. 复制 .env.example 为 .env.local
 *    ```bash
 *    cp .env.example .env.local
 *    ```
 *
 * 2. 在 .env.local 中填入真实的 API Key
 *    ```
 *    VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
 *    VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
 *    ```
 *
 * 3. 重启开发服务器
 *    ```bash
 *    npm run dev
 *    ```
 *
 * 🔑 API Key获取方式：
 *
 * - OpenAI: https://platform.openai.com/api-keys
 *   适用于海外服务器部署或可访问OpenAI服务的环境
 *
 * - DeepSeek: https://platform.deepseek.com/api_keys
 *   适用于中国大陆服务器部署（如腾讯云、阿里云等）
 *   DeepSeek在国内访问速度更快，价格更优惠
 *
 * 🔒 安全说明：
 *
 * - .env.local 文件已被 .gitignore 忽略，不会提交到代码库
 * - 密钥会自动从环境变量加载，无需修改此文件
 * - 生产环境请在部署平台（Vercel/腾讯云）配置环境变量
 *
 * 详细安全规范见：ai-templates/SENSITIVE_DATA_SECURITY.md
 */

/**
 * OpenAI API Key
 * 从环境变量 VITE_OPENAI_API_KEY 自动加载
 */
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

/**
 * DeepSeek API Key
 * 从环境变量 VITE_DEEPSEEK_API_KEY 自动加载
 */
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';

// 开发环境下检查配置
if (import.meta.env.DEV) {
  if (!OPENAI_API_KEY && !DEEPSEEK_API_KEY) {
    console.warn('⚠️ 未检测到 API Key 配置');
    console.warn('请复制 .env.example 为 .env.local 并填入真实的 API Key');
    console.warn('详见：src/config/api.ts 顶部注释');
  }
}
