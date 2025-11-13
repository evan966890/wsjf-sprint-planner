import { useState } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import type { SprintPool } from '../types';

// 日期工具函数
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextMonday = (fromDate: Date = new Date()): Date => {
  const date = new Date(fromDate);
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
};

const getTwoWeekRange = (startDate: Date): { start: string; end: string } => {
  const end = new Date(startDate);
  end.setDate(end.getDate() + 13); // 14天 - 1
  return {
    start: formatDate(startDate),
    end: formatDate(end)
  };
};

// ============================================================================
// UI组件 - 编辑迭代池弹窗 (Edit Sprint Modal Component)
// ============================================================================

/**
 * 编辑迭代池弹窗组件
 *
 * 功能说明：
 * - 编辑迭代池的基本信息（名称、时间范围、总人天）
 * - 设置资源预留百分比（Bug修复、重构、其他）
 * - 实时计算净可用人天
 *
 * 资源计算逻辑：
 * - 总预留 = Bug预留% + 重构预留% + 其他预留%
 * - 预留人天 = 总人天 × 总预留% / 100
 * - 净可用 = 总人天 - 预留人天
 *
 * @param sprint - 要编辑的迭代池对象
 * @param onSave - 保存回调函数
 * @param onClose - 关闭回调函数
 */
const EditSprintModal = ({
  sprint,
  onSave,
  onClose
}: {
  sprint: SprintPool;
  onSave: (sprint: SprintPool) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(sprint);

  // 快速选择双周的函数
  const selectTwoWeeks = (weeksFromNow: number) => {
    const today = new Date();
    const nextMonday = getNextMonday(today);
    // 计算目标双周的起始日期
    const targetStartDate = new Date(nextMonday);
    targetStartDate.setDate(nextMonday.getDate() + (weeksFromNow * 14));

    const range = getTwoWeekRange(targetStartDate);
    setForm({
      ...form,
      startDate: range.start,
      endDate: range.end
    });
  };

  // 健壮性检查：确保所有预留百分比是有效数字
  const bugReserve = Math.max(0, Math.min(100, Number(form.bugReserve) || 0));
  const refactorReserve = Math.max(0, Math.min(100, Number(form.refactorReserve) || 0));
  const otherReserve = Math.max(0, Math.min(100, Number(form.otherReserve) || 0));

  // 计算总预留百分比
  const totalReserve = bugReserve + refactorReserve + otherReserve;

  // 计算预留人天（健壮性：避免除以0或负数）
  const totalDays = Math.max(0, Number(form.totalDays) || 0);
  const reservedDays = Math.round(totalDays * totalReserve / 100);

  // 计算净可用人天
  const netAvailable = totalDays - reservedDays;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px]">
        <div className="p-5 border-b border-gray-200 bg-gray-900 text-white rounded-t-xl flex items-center justify-between">
          <h3 className="text-xl font-semibold">编辑迭代池</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">迭代名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">迭代时间范围</label>
              <div className="flex items-center gap-1">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">快速选择双周：</span>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => selectTwoWeeks(0)}
                className="flex-1 px-2 py-1.5 bg-teal-50 text-teal-700 text-xs rounded-lg hover:bg-teal-100 transition border border-teal-200"
              >
                下个双周
              </button>
              <button
                type="button"
                onClick={() => selectTwoWeeks(1)}
                className="flex-1 px-2 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100 transition border border-gray-200"
              >
                再下个双周
              </button>
              <button
                type="button"
                onClick={() => selectTwoWeeks(2)}
                className="flex-1 px-2 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-lg hover:bg-gray-100 transition border border-gray-200"
              >
                第三个双周
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">开始日期</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({...form, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">结束日期</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({...form, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">总可用工作量（天）</label>
            <input
              type="number"
              value={form.totalDays}
              onChange={(e) => setForm({...form, totalDays: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bug预留%</label>
              <input
                type="number"
                value={form.bugReserve}
                onChange={(e) => setForm({...form, bugReserve: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">重构预留%</label>
              <input
                type="number"
                value={form.refactorReserve}
                onChange={(e) => setForm({...form, refactorReserve: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">其他预留%</label>
              <input
                type="number"
                value={form.otherReserve}
                onChange={(e) => setForm({...form, otherReserve: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-1">
            <div className="text-sm text-gray-700">
              不可用工作量: <span className="font-semibold text-red-600">{reservedDays}</span>天 ({totalReserve}%)
            </div>
            <div className="text-sm font-medium text-teal-900 border-t border-teal-200 pt-2">
              净可用资源: <span className="text-2xl font-bold text-teal-600">{netAvailable}</span>天
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            取消
          </button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2"
          >
            <Save size={18} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSprintModal;
