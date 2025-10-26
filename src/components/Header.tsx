/**
 * 应用头部组件
 *
 * 功能：
 * - 应用标题和图例
 * - 说明书按钮
 * - 用户信息显示
 * - 紧凑模式切换
 * - 导入按钮
 * - 导出菜单（Excel、PDF、PNG）
 * - 退出登录
 */

import {
  HelpCircle,
  Download,
  User as UserIcon,
  LogOut,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Upload,
  Star,
  Cloud
} from 'lucide-react';
import type { User } from '../storage';

interface HeaderProps {
  currentUser: User | null;
  compact: boolean;
  onToggleCompact: () => void;
  onShowHandbook: () => void;
  onImport: () => void;
  onFeishuImport: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportPNG: () => void;
  onLogout: () => void;
  showExportMenu: boolean;
  onToggleExportMenu: () => void;
}

export function Header({
  currentUser,
  compact,
  onToggleCompact,
  onShowHandbook,
  onImport,
  onFeishuImport,
  onExportExcel,
  onExportPDF,
  onExportPNG,
  onLogout,
  showExportMenu,
  onToggleExportMenu,
}: HeaderProps) {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* 标题区域 - 两行显示 */}
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">小米国际 WSJF-Lite Tools</h1>
            <p className="text-xs text-gray-400 mt-0.5">by Evan (tianyuan8@xiaomi.com)</p>
          </div>

          {/* 图例 - 左对齐 */}
          <div className="flex items-center gap-3 text-xs text-gray-300">
            {/* BV颜色图例 */}
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-100 to-blue-200" title="局部"></div>
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-400 to-blue-500" title="明显"></div>
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-600 to-blue-700" title="撬动核心"></div>
                <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-800 to-blue-900" title="战略平台"></div>
              </div>
              <span>业务影响度</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-red-600 to-red-900 rounded-sm"></div>
              <span>强DDL</span>
            </div>

            <div className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span>权重</span>
            </div>
          </div>

          <button
            onClick={onShowHandbook}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
          >
            <HelpCircle size={14} />
            <span>说明书</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <UserIcon size={16} className="text-blue-400" />
              <span className="text-sm text-white">{currentUser.name}</span>
              <span className="text-xs text-gray-400">({currentUser.email})</span>
            </div>
          )}

          <button
            onClick={onToggleCompact}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium"
          >
            {compact ? '宽松视图' : '紧凑视图'}
          </button>

          {/* 导入按钮 */}
          <button
            onClick={onImport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
          >
            <Upload size={16} />
            导入
          </button>

          {/* 从飞书导入按钮 */}
          <button
            onClick={onFeishuImport}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
            title="从飞书项目导入需求"
          >
            <Cloud size={16} />
            从飞书导入
          </button>

          <div className="relative">
            <button
              onClick={onToggleExportMenu}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
            >
              <Download size={16} />
              导出
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <button
                  onClick={onExportExcel}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                >
                  <FileSpreadsheet size={18} className="text-green-600" />
                  导出为 Excel
                </button>
                <button
                  onClick={onExportPDF}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                >
                  <FileText size={18} className="text-red-600" />
                  导出为 PDF
                </button>
                <button
                  onClick={onExportPNG}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                >
                  <ImageIcon size={18} className="text-blue-600" />
                  导出为图片
                </button>
              </div>
            )}
          </div>

          {currentUser && (
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
            >
              <LogOut size={16} />
              退出
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
