# V-Calendar

一款基于 Electron + Vue 3 + TypeScript 的智能日历桌面应用。

## 功能特性

### 日历视图
- **月视图**：显示整月日历，包含农历、节假日、事件标记
- **周视图**：按周显示时间轴，支持事件拖拽和时间槽选择
- **日视图**：单日详细时间轴，精确到小时的事件管理

### 农历与节假日
- 农历日期显示（初一显示月份）
- 二十四节气标注
- 法定节假日识别
- 非工作日绿色"休"字标记
- 调休工作日红色"班"字标记

### 事件管理
- 创建/编辑/删除事件
- 支持全天事件和定时事件
- 事件分类（工作、个人、重要、节假日、自定义）
- 事件搜索和过滤
- 数据导入导出（JSON格式）
- 自动备份机制

### 闹钟提醒
- 为事件设置提前提醒
- 系统通知提醒
- 贪睡功能

### 时间槽选择
- 点击日历时间槽选择时间段
- 新建事件自动填入选中的日期和时间
- 支持月视图、周视图、日视图的时间槽选择

## 技术栈

- **前端框架**：Vue 3.5+ (Composition API)
- **类型系统**：TypeScript 5.x
- **构建工具**：electron-vite + Vite 7.x
- **状态管理**：Pinia
- **日期处理**：day.js
- **农历库**：chinese-days
- **数据存储**：electron-store (本地JSON文件)

## 项目结构

```
V-Calendar/
├── doc/                          # 项目文档
│   ├── 技术文档.md
│   └── 需求文档.md
├── valendar/                     # 主应用
│   ├── src/
│   │   ├── main/                # 主进程
│   │   │   ├── ipc/            # IPC通信处理
│   │   │   ├── services/       # 服务层
│   │   │   └── types/          # 类型定义
│   │   ├── preload/            # 预加载脚本
│   │   │   ├── api/            # API封装
│   │   │   └── types/          # 类型定义
│   │   └── renderer/           # 渲染进程
│   │       └── src/
│   │           ├── components/ # Vue组件
│   │           ├── composables/# 组合式函数
│   │           ├── stores/     # Pinia状态
│   │           └── types/      # 类型定义
│   ├── package.json
│   └── electron-builder.yml
└── README.md
```

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
cd valendar
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建应用
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 开发规范

### 代码规范
- TypeScript 严格模式
- Vue 3 Composition API + `<script setup>`
- 组件名：PascalCase
- 方法名/变量名：camelCase
- CSS类名：kebab-case

### Git 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
chore: 构建/工具相关
```

## 数据存储

### 存储位置
- Windows: `%APPDATA%/valendar/`
- macOS: `~/Library/Application Support/valendar/`
- Linux: `~/.config/valendar/`

### 存储结构
- **主数据文件**：`valendar-data.json`
- **备份目录**：`backups/` (自动保留最近5个备份)

### 数据安全
- 自动备份：创建/更新/删除事件前自动备份
- 数据验证：事件输入验证
- 备份恢复：支持从备份恢复数据

## 阶段规划

### 阶段1：基础日历 (当前)
- 完整的日历视图系统
- 事件CRUD操作
- 农历和节假日显示
- 闹钟提醒
- 数据导入导出
- 自动备份机制

### 阶段2：AI智能 (规划中)
- 语音识别
- 自然语言解析
- 对话式日程管理
- 智能日程建议

## 许可证

MIT License
