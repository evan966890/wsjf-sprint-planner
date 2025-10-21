/**
 * 应用头部组件
 *
 * 功能：
 * - 应用标题和说明书
 * - 用户信息显示
 * - 导出菜单（Excel、PDF、PNG）
 * - 导入按钮
 * - 添加迭代池按钮
 */

import { HelpCircle, Download, User as UserIcon, LogOut, Plus, FileSpreadsheet, FileText, Image as ImageIcon, Upload } from 'lucide-react';

interface HeaderProps {
  currentUser: { username: string } | null;
  onOpenHandbook: () => void;
  onOpenImport: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onExportPNG: () => void;
  onAddSprintPool: () => void;
  onLogout: () => void;
  showExportMenu: boolean;
  onToggleExportMenu: () => void;
}

export function Header({
  currentUser,
  onOpenHandbook,
  onOpenImport,
  onExportExcel,
  onExportPDF,
  onExportPNG,
  onAddSprintPool,
  onLogout,
  showExportMenu,
  onToggleExportMenu,
}: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg sticky top-0 z-20">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* 左侧：标题 */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">WSJF 加权优先级排期工具</h1>
          <button
            onClick={onOpenHandbook}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm"
          >
            <HelpCircle size={18} />
            说明书
          </button>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-3">
          {/* 导入按钮 */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            <Upload size={18} />
            导入
          </button>

          {/* 导出下拉菜单 */}
          <div className="relative">
            <button
              onClick={onToggleExportMenu}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
            >
              <Download size={18} />
              导出
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                <button
                  onClick={onExportExcel}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  导出为 Excel
                </button>
                <button
                  onClick={onExportPDF}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText size={16} />
                  导出为 PDF
                </button>
                <button
                  onClick={onExportPNG}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <ImageIcon size={16} />
                  导出为图片
                </button>
              </div>
            )}
          </div>

          {/* 添加迭代池 */}
          <button
            onClick={onAddSprintPool}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition font-medium"
          >
            <Plus size={18} />
            添加迭代池
          </button>

          {/* 用户信息 */}
          {currentUser && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
              <UserIcon size={18} />
              <span className="font-medium">{currentUser.username}</span>
              <button
                onClick={onLogout}
                className="ml-2 p-1 hover:bg-white/20 rounded transition"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
