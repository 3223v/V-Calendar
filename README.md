# V-Calendar

一款基于 Electron + Vue 3 + TypeScript 的**智能语音日历闹钟系统**，支持语音交互和 AI 自然语言解析。

## 功能特性

### 日历视图
- **月视图**：显示整月日历，包含农历、节假日、事件标记
- **周视图**：按周显示时间轴，支持事件拖拽和时间槽选择
- **日视图**：单日详细时间轴，精确到小时的事件管理
- **视图切换**：支持月/周/日三种视图无缝切换

### 农历与节假日
- 农历日期显示（初一显示月份）
- 二十四节气标注
- 法定节假日识别（中国大陆）
- 非工作日绿色"休"字标记
- 调休工作日红色"班"字标记

### 事件管理
- 创建/编辑/删除事件
- 支持全天事件和定时事件
- 事件分类（工作、个人、重要、节假日、自定义）
- 事件搜索和过滤
- 数据导入导出（JSON/CSV 格式）
- 自动备份机制（最多保留 5 个备份）

### 闹钟提醒
- 为事件设置提前提醒（5分钟 ~ 1天）
- 系统通知提醒
- 贪睡功能（可配置贪睡时间）
- 闹钟状态持久化

### 时间槽选择
- 点击日历时间槽选择时间段
- 新建事件自动填入选中的日期和时间
- 支持月视图、周视图、日视图的时间槽选择

### AI 语音交互 ✨
- **语音识别**：支持语音输入日程信息（智谱 ASR）
- **自然语言解析**：AI 自动解析口语化指令（LangGraph + LLM）
- **上下文感知**：注入历史对话和事件上下文，支持深度分析
- **多操作支持**：NLP 系统支持输出多个创建/更新/删除操作
- **智能匹配**：删除/修改操作必须匹配现有事件，防止误操作
- **对话式 UI**：消息气泡样式，支持多种状态展示
- **对话持久化**：用户输入和 AI 输出完整保存到本地

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 桌面框架 | Electron 39.x |
| 前端框架 | Vue 3.5 + Composition API |
| 类型系统 | TypeScript 5.x |
| 构建工具 | electron-vite 5.x + Vite 7.x |
| 状态管理 | Pinia 3.x |
| AI 框架 | LangChain / LangGraph |
| 农历/节假日 | chinese-days |
| 日期处理 | dayjs |
| 本地存储 | electron-store |
| 代码规范 | ESLint + Prettier |

## 项目结构

```
V-Calendar/
├── doc/                          # 项目文档
│   ├── 技术文档.md               # 详细技术文档
│   └── 需求文档.md               # 需求规格说明
├── valendar/                     # 主应用
│   ├── src/
│   │   ├── main/                 # 主进程
│   │   │   ├── index.ts         # 主进程入口
│   │   │   ├── ipc/             # IPC 通信处理
│   │   │   │   ├── event.ipc.ts
│   │   │   │   ├── alarm.ipc.ts
│   │   │   │   ├── settings.ipc.ts
│   │   │   │   ├── data.ipc.ts
│   │   │   │   └── conversation.ipc.ts
│   │   │   ├── services/        # 服务层
│   │   │   │   ├── storage.service.ts
│   │   │   │   ├── alarm.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   └── types/           # 类型定义
│   │   ├── preload/             # 预加载脚本
│   │   │   ├── index.ts
│   │   │   ├── api/             # API 封装
│   │   │   └── types/           # 类型定义
│   │   └── renderer/            # 渲染进程 (Vue 应用)
│   │       └── src/
│   │           ├── main.ts      # Vue 入口
│   │           ├── App.vue      # 根组件
│   │           ├── components/  # Vue 组件
│   │           │   ├── calendar/    # 日历视图
│   │           │   ├── event/       # 事件管理
│   │           │   ├── conversation/# 对话界面
│   │           │   ├── settings/    # 设置页面
│   │           │   └── alarm/       # 闹钟弹窗
│   │           ├── composables/ # 组合式函数
│   │           │   ├── useCalendar.ts
│   │           │   ├── useLunar.ts
│   │           │   ├── useHoliday.ts
│   │           │   └── useAlarm.ts
│   │           ├── stores/      # Pinia 状态管理
│   │           │   ├── calendar.store.ts
│   │           │   ├── event.store.ts
│   │           │   ├── alarm.store.ts
│   │           │   ├── settings.store.ts
│   │           │   └── conversation.store.ts
│   │           ├── services/    # AI 服务层
│   │           │   ├── asr/     # 语音识别
│   │           │   └── nlu/     # 自然语言理解
│   │           ├── utils/       # 工具函数
│   │           └── types/       # 类型定义
│   ├── package.json
│   ├── electron.vite.config.ts
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

### 其他命令
```bash
# 类型检查
npm run typecheck

# 代码规范检查
npm run lint

# 代码格式化
npm run format
```

## AI 功能配置

### 语音识别 (ASR)
1. 进入设置页面 → 语音识别
2. 填写智谱 API Key（需在 [智谱开放平台](https://open.bigmodel.cn/) 注册）
3. 使用 GLM-ASR-2512 模型进行语音转文字

### 自然语言理解 (NLU)
1. 进入设置页面 → NLU 系统
2. 配置 API 地址（支持 OpenAI 兼容接口）
3. 填写 API Key 和模型名称
4. 支持智谱、DeepSeek、月之暗面等模型

### 对话设置
- **自动执行倒计时**：3/5/10/15/30 秒可选
- **执行策略**：
  - `best`：自动执行最高置信度方案
  - `manual`：手动选择后执行
  - `abandon`：超时自动放弃

## 开发规范

### 代码规范
- TypeScript 严格模式
- Vue 3 Composition API + `<script setup>`
- 组件名：PascalCase（如 `EventForm.vue`）
- 方法名/变量名：camelCase
- CSS 类名：kebab-case

### Git 提交规范
```
feat: 新功能
fix: 修复 bug
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
  - 事件列表（events）
  - 应用设置（settings）
  - 闹钟列表（alarms）
  - 对话历史（conversationHistory）
- **备份目录**：`backups/`（自动保留最近 5 个备份）

### 对话持久化
- 用户输入完整保存为文本
- AI 输出保存为文本 + JSON 数组
- 支持多会话管理和历史查看
- 语音识别结果自动插入到输入框

### 数据安全
- 自动备份：创建/更新/删除事件前自动备份
- 数据验证：事件输入验证（标题、日期、时间格式等）
- 备份恢复：支持从备份恢复数据

## 功能演示

### 语音创建日程
```
用户语音："明天下午三点开会"
AI 解析：创建事件 "开会"
         日期：明天
         时间：15:00
         分类：工作
         置信度：0.9
```

### 对话式状态展示
```
用户输入："明天下午三点开会"
助手消息：正在思考中...
助手消息：已为您解析到以下操作：
         [创建] 开会
                日期：明天
                时间：15:00
                分类：工作
                置信度：0.9
         ✅ 已执行
```

### 多操作支持
```
用户输入："明天上午九点开会，下午两点还有个面试"
AI 解析：[创建] 开会
              日期：明天
              时间：09:00
         [创建] 面试
              日期：明天
              时间：14:00
```

### 文字对话操作
```
用户输入："下周一到周三去北京出差"
AI 解析：创建事件 "去北京出差"
         日期：下周一 ~ 下周三
         全天事件
         分类：工作
```

## 阶段规划

### 阶段1：基础日历 ✅ (已完成)
- 完整的日历视图系统
- 事件 CRUD 操作
- 农历和节假日显示
- 闹钟提醒
- 数据导入导出
- 自动备份机制

### 阶段2：AI 智能 ✅ (已完成)
- 语音识别（智谱 ASR）
- 自然语言解析（LangGraph + LLM）
- 对话式日程管理
- 上下文感知（历史对话 + 事件注入）
- 多操作支持
- 智能匹配验证

### 阶段3：增强功能 (规划中)
- 事件重复规则完善
- 多语言国际化
- 日历订阅（.ics）
- 数据统计可视化
- 键盘快捷键

### 阶段4：高级功能 (规划中)
- AI 智能日程建议
- 跨设备同步（云端）
- 插件系统
- 移动端应用

## 项目文档

详细的技术文档请参考 `doc/` 目录：
- [技术文档](./doc/技术文档.md) - 系统架构、核心模块、数据存储
- [ASR 文档](./doc/asr.md) - 语音识别详细使用说明
- [NLU 文档](./doc/nlu.md) - 自然语言理解系统设计和工作流

## 许可证

MIT License
