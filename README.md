# Electron 应用

这是一个现代化的Electron桌面应用，具有简洁的架构和友好的用户界面。

## 功能特点

- 现代化UI设计，响应式布局
- 桌面通知系统
- 跨平台兼容性（Windows、macOS、Linux）
- 内置开发者工具

## 环境要求

- Node.js (v14或更高版本)
- pnpm (v6或更高版本)

## 安装步骤

```bash
# 克隆仓库
git clone <仓库URL>
cd electron-app

# 安装依赖
pnpm install
```

## 开发命令

```bash
# 启动开发服务器
pnpm dev

# 打包应用程序
pnpm build
```

## 项目结构

```
electron-app/
├── build/           # 构建资源
├── electron/        # Electron主进程
├── src/             # 前端源代码
└── package.json     # 项目依赖和脚本
```
