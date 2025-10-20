/**
 * 技术进展状态类型定义
 *
 * 本文件定义技术进展的所有可能状态值
 * 作用：通过TypeScript的联合类型提供编译时类型安全
 *
 * 使用场景：
 * - Requirement.techProgress 字段的类型约束
 * - 编辑表单的下拉选项
 * - 需求分类和筛选逻辑
 *
 * @version 1.5.0
 * @since 2025-01-20
 */

/**
 * 技术进展状态联合类型
 *
 * 状态说明：
 * - 待评估: 新建需求的默认状态，产品待填写需求详情
 * - 未评估: 兼容旧数据的状态（v1.4.0之前）
 * - 已评估工作量: 研发已评估工作量，可以排期
 * - 技术方案设计中: 复杂需求需要先做技术方案
 * - 已完成技术方案: 技术方案评审通过，可以排期
 * - 开发中: 需求正在开发
 * - 联调测试中: 开发完成，进入测试阶段
 * - 已上线: 需求已部署上线
 */
export type TechProgressStatus =
  | '待评估'              // 默认状态 - 新建需求
  | '未评估'              // 兼容旧数据
  | '已评估工作量'        // 可排期
  | '技术方案设计中'      // 设计阶段
  | '已完成技术方案'      // 可排期
  | '开发中'              // 开发阶段
  | '联调测试中'          // 测试阶段
  | '已上线';             // 已完成

/**
 * 产品进展状态联合类型
 */
export type ProductProgressStatus =
  | '待评估'
  | '需求评审中'
  | '设计中'
  | '设计评审中'
  | '开发中'
  | '已完成';

/**
 * 技术进展状态元数据
 * 用于UI展示和业务逻辑判断
 */
export interface TechProgressMeta {
  /** 状态值 */
  status: TechProgressStatus;
  /** 显示名称 */
  label: string;
  /** 是否可排期（可拖拽到迭代池） */
  canSchedule: boolean;
  /** 状态说明 */
  description: string;
  /** 显示颜色（Tailwind CSS类） */
  color: string;
}

/**
 * 所有技术进展状态的元数据配置
 */
export const TECH_PROGRESS_META_MAP: Record<TechProgressStatus, TechProgressMeta> = {
  '待评估': {
    status: '待评估',
    label: '待评估',
    canSchedule: false,
    description: '新建需求，待产品补充详细信息',
    color: 'text-gray-500'
  },
  '未评估': {
    status: '未评估',
    label: '未评估',
    canSchedule: false,
    description: '未完成技术评估（兼容旧数据）',
    color: 'text-gray-500'
  },
  '已评估工作量': {
    status: '已评估工作量',
    label: '已评估工作量',
    canSchedule: true,
    description: '研发已评估工作量，可以排期',
    color: 'text-green-600'
  },
  '技术方案设计中': {
    status: '技术方案设计中',
    label: '技术方案设计中',
    canSchedule: true,
    description: '正在设计技术方案',
    color: 'text-blue-600'
  },
  '已完成技术方案': {
    status: '已完成技术方案',
    label: '已完成技术方案',
    canSchedule: true,
    description: '技术方案评审通过，可以排期',
    color: 'text-green-600'
  },
  '开发中': {
    status: '开发中',
    label: '开发中',
    canSchedule: true,
    description: '需求正在开发',
    color: 'text-blue-600'
  },
  '联调测试中': {
    status: '联调测试中',
    label: '联调测试中',
    canSchedule: true,
    description: '开发完成，进入联调测试',
    color: 'text-purple-600'
  },
  '已上线': {
    status: '已上线',
    label: '已上线',
    canSchedule: true,
    description: '需求已部署上线',
    color: 'text-green-700'
  }
};
