import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import * as storage from '../storage';

// ============================================================================
// UI组件 - 登录/注册弹窗 (Login Modal Component)
// ============================================================================

/**
 * 登录/注册弹窗组件
 *
 * 功能说明：
 * - 用户首次访问时显示，要求输入姓名和邮箱
 * - 验证邮箱格式
 * - 将用户信息保存到LocalStorage
 * - 支持自动登录（如果已有用户信息）
 *
 * 数据持久化：
 * - 使用storage模块保存用户信息
 * - 登录后可在系统中标识需求提交人
 *
 * @param onLogin - 登录成功回调函数
 */
const LoginModal = ({ onLogin }: { onLogin: (user: storage.User) => void }) => {
  const [name, setName] = useState('');      // 用户姓名
  const [email, setEmail] = useState('');    // 用户邮箱
  const [error, setError] = useState('');    // 错误提示信息

  /**
   * 处理登录提交
   * - 验证输入不为空
   * - 验证邮箱格式
   * - 保存用户信息并回调
   */
  const handleSubmit = () => {
    // 验证：确保姓名和邮箱不为空
    if (!name.trim() || !email.trim()) {
      setError('请填写姓名和邮箱');
      return;
    }

    // 验证：邮箱格式检查
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    // 保存用户信息到LocalStorage并触发登录回调
    const user = storage.loginUser(name.trim(), email.trim());
    onLogin(user);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">小米国际WSJF-Lite系统beta</h2>
          <p className="text-sm text-gray-600 mt-2">请输入您的信息登录或注册</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入您的姓名"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg"
          >
            进入应用
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          无需密码，下次使用相同邮箱即可访问您的数据
        </p>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-gray-700 text-center leading-relaxed">
              <span className="font-semibold text-yellow-800">注意事项：</span>本系统为纯前端搭建，数据保存在您的浏览器缓存，更新数据后请及时导出保存在本地。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
