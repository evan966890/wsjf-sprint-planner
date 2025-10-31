/**
 * 飞书OAuth回调页面
 *
 * 处理飞书授权回调，获取access_token后跳转回主页
 * 文件大小控制: < 200行
 */

import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { handleOAuthCallback, loadFeishuConfig } from '../services/feishu';

export function FeishuCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理授权...');
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    handleCallback();

    // 组件卸载时清理timeout
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleCallback = async () => {
    try {
      // 从URL获取code参数
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        throw new Error('URL中缺少授权码(code)参数');
      }

      setMessage('正在获取访问令牌...');

      // 加载配置
      const config = loadFeishuConfig();
      if (!config) {
        throw new Error('未找到飞书配置，请先配置Plugin ID和Secret');
      }

      // 使用code换取token
      await handleOAuthCallback(config);

      setStatus('success');
      setMessage('授权成功！正在返回...');

      // 2秒后跳转回主页
      redirectTimeoutRef.current = setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('[FeishuCallback] Error:', error);
      setStatus('error');
      setMessage(
        error instanceof Error
          ? `授权失败: ${error.message}`
          : '授权失败，请重试'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          {/* 状态图标 */}
          <div className="mb-6 flex justify-center">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {status === 'loading' && '处理授权中'}
            {status === 'success' && '授权成功！'}
            {status === 'error' && '授权失败'}
          </h1>

          {/* 消息 */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* 错误时显示返回按钮 */}
          {status === 'error' && (
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              返回主页
            </button>
          )}

          {/* 成功时显示自动跳转提示 */}
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              2秒后自动跳转到主页...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
