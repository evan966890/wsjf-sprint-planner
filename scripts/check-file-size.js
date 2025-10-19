#!/usr/bin/env node

/**
 * 文件大小检查脚本
 *
 * 用途：防止单个文件过度膨胀，保持代码可维护性
 * 使用：npm run check-file-size
 *
 * 规则：
 * - 🚫 错误（Error）: 超过 500 行
 * - ⚠️  警告（Warning）: 超过 300 行
 * - ℹ️  信息（Info）: 超过 200 行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  ERROR_THRESHOLD: 500,    // 错误阈值（严格限制）
  WARNING_THRESHOLD: 300,  // 警告阈值（建议拆分）
  INFO_THRESHOLD: 200,     // 信息阈值（开始关注）

  // 要检查的目录
  SCAN_DIRS: ['src'],

  // 要检查的文件扩展名
  FILE_EXTENSIONS: ['.ts', '.tsx', '.js', '.jsx'],

  // 忽略的目录
  IGNORE_DIRS: ['node_modules', 'dist', 'build', '.git'],

  // 忽略的文件（例如自动生成的文件）
  IGNORE_FILES: [],
};

// ============================================================================
// 核心逻辑
// ============================================================================

class FileSizeChecker {
  constructor() {
    this.results = {
      errors: [],
      warnings: [],
      infos: [],
      total: 0,
      scanned: 0,
    };
  }

  /**
   * 计算文件行数
   */
  countLines(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      // 排除空行来计算更准确的代码行数
      const lines = content.split('\n').filter(line => line.trim() !== '');
      return lines.length;
    } catch (error) {
      console.error(`❌ 无法读取文件: ${filePath}`, error.message);
      return 0;
    }
  }

  /**
   * 检查单个文件
   */
  checkFile(filePath) {
    const lines = this.countLines(filePath);
    this.results.scanned++;

    const fileInfo = {
      path: filePath,
      lines,
      relPath: path.relative(process.cwd(), filePath),
    };

    if (lines >= CONFIG.ERROR_THRESHOLD) {
      this.results.errors.push(fileInfo);
    } else if (lines >= CONFIG.WARNING_THRESHOLD) {
      this.results.warnings.push(fileInfo);
    } else if (lines >= CONFIG.INFO_THRESHOLD) {
      this.results.infos.push(fileInfo);
    }

    this.results.total = Math.max(this.results.total, lines);
  }

  /**
   * 递归扫描目录
   */
  scanDirectory(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      console.error(`❌ 无法读取目录: ${dir}`, error.message);
      return;
    }

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      // 跳过忽略的目录
      if (entry.isDirectory()) {
        if (CONFIG.IGNORE_DIRS.includes(entry.name) || entry.name.startsWith('.')) {
          return;
        }
        this.scanDirectory(fullPath);
      }
      // 检查符合条件的文件
      else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (CONFIG.FILE_EXTENSIONS.includes(ext) && !CONFIG.IGNORE_FILES.includes(entry.name)) {
          this.checkFile(fullPath);
        }
      }
    });
  }

  /**
   * 执行检查
   */
  run() {
    console.log('🔍 开始检查文件大小...\n');

    CONFIG.SCAN_DIRS.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath);
      } else {
        console.warn(`⚠️  目录不存在: ${dir}`);
      }
    });

    this.printResults();
    return this.hasErrors();
  }

  /**
   * 打印结果
   */
  printResults() {
    console.log('='.repeat(80));
    console.log('📊 检查结果');
    console.log('='.repeat(80));
    console.log(`已扫描文件: ${this.results.scanned}`);
    console.log(`最大文件行数: ${this.results.total}`);
    console.log('');

    // 打印错误
    if (this.results.errors.length > 0) {
      console.log('🚫 错误（必须立即处理）:');
      this.results.errors
        .sort((a, b) => b.lines - a.lines)
        .forEach(({ relPath, lines }) => {
          console.log(`   ❌ ${relPath} - ${lines} 行 (超过 ${CONFIG.ERROR_THRESHOLD} 行)`);
        });
      console.log('');
    }

    // 打印警告
    if (this.results.warnings.length > 0) {
      console.log('⚠️  警告（建议本周内处理）:');
      this.results.warnings
        .sort((a, b) => b.lines - a.lines)
        .forEach(({ relPath, lines }) => {
          console.log(`   ⚠️  ${relPath} - ${lines} 行 (超过 ${CONFIG.WARNING_THRESHOLD} 行)`);
        });
      console.log('');
    }

    // 打印信息
    if (this.results.infos.length > 0) {
      console.log('ℹ️  信息（开始关注，避免继续增长）:');
      this.results.infos
        .sort((a, b) => b.lines - a.lines)
        .slice(0, 10) // 只显示前 10 个
        .forEach(({ relPath, lines }) => {
          console.log(`   ℹ️  ${relPath} - ${lines} 行`);
        });
      if (this.results.infos.length > 10) {
        console.log(`   ... 还有 ${this.results.infos.length - 10} 个文件 (已省略)`);
      }
      console.log('');
    }

    // 总结
    console.log('='.repeat(80));
    if (this.results.errors.length === 0 && this.results.warnings.length === 0) {
      console.log('✅ 太棒了！所有文件都在合理范围内。');
    } else if (this.results.errors.length === 0) {
      console.log('🟡 还不错，但建议处理警告文件以保持代码质量。');
    } else {
      console.log('🔴 发现严重问题！请立即处理超过 500 行的文件。');
    }
    console.log('='.repeat(80));
    console.log('');

    // 提供建议
    if (this.results.errors.length > 0 || this.results.warnings.length > 0) {
      console.log('💡 重构建议:');
      console.log('   1. 提取常量到 constants/ 目录');
      console.log('   2. 提取工具函数到 utils/ 目录');
      console.log('   3. 提取业务逻辑到 hooks/ 目录');
      console.log('   4. 拆分 UI 组件到多个子组件');
      console.log('   5. 查看详细指南: docs/architecture-guide.md');
      console.log('');
    }
  }

  /**
   * 判断是否有错误
   */
  hasErrors() {
    return this.results.errors.length > 0;
  }
}

// ============================================================================
// 执行
// ============================================================================

const checker = new FileSizeChecker();
const hasErrors = checker.run();

// 如果有严重错误，返回非零退出码（用于 CI/CD）
if (hasErrors) {
  console.error('❌ 检查失败：存在超过限制的文件。');
  process.exit(1);
} else {
  console.log('✅ 检查通过。');
  process.exit(0);
}
