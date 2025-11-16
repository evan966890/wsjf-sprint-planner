#!/usr/bin/env python3
"""
飞书项目质量指标配置 - 主程序
一键配置5个质量指标到飞书项目
"""

import sys
import os
from pathlib import Path

def print_banner():
    """打印程序横幅"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🚀 飞书项目(Meego)质量指标自动化配置系统                ║
║                                                              ║
║     配置即代码 - 告别手动配置的痛苦                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

功能选择：
1. 🚀 立即同步    - 将配置应用到飞书项目
2. 🔍 调试API     - 使用Chrome DevTools调试
3. ✅ 验证配置    - 检查配置是否成功
4. 📊 生成报告    - 查看当前配置状态
5. 📖 查看文档    - 打开README文档
6. ❌ 退出
    """)

def main():
    """主函数"""
    print_banner()

    while True:
        try:
            choice = input("\n请选择功能 (1-6): ").strip()

            if choice == "1":
                print("\n开始同步配置...")
                os.system("python sync_config.py")

            elif choice == "2":
                print("\n启动API调试...")
                os.system("python mcp_debugger.py")

            elif choice == "3":
                print("\n验证配置...")
                os.system("python verify_config.py")

            elif choice == "4":
                print("\n生成配置报告...")
                os.system("python sync_config.py --dry-run")

            elif choice == "5":
                print("\n打开文档...")
                if sys.platform == "win32":
                    os.system("start README.md")
                elif sys.platform == "darwin":
                    os.system("open README.md")
                else:
                    os.system("xdg-open README.md")

            elif choice == "6":
                print("\n👋 感谢使用，再见！")
                break

            else:
                print("\n❌ 无效选项，请输入 1-6")

            input("\n按回车键继续...")

        except KeyboardInterrupt:
            print("\n\n👋 程序已退出")
            break
        except Exception as e:
            print(f"\n❌ 发生错误: {e}")
            input("\n按回车键继续...")

if __name__ == "__main__":
    # 检查必要文件
    required_files = [
        "quality-metrics.yaml",
        "sync_config.py",
        "mcp_debugger.py"
    ]

    missing_files = [f for f in required_files if not Path(f).exists()]

    if missing_files:
        print(f"❌ 缺少必要文件: {', '.join(missing_files)}")
        print("请确保所有文件都在当前目录中")
        sys.exit(1)

    main()