# OpenModelRank — 大模型能力排行榜

一个开源的大模型评测排行榜站点，展示 LLM 在多项 Benchmark 上的评测分数和排名，并提供在线竞技场功能，允许用户对自己的模型进行实时评测。

## 功能特性

- **排行榜** — 基于 z-score 归一化 + 类别加权的综合排名算法
- **模型对比** — 选择多个模型进行多维度雷达图 / 柱状图对比
- **竞技场** — 提供模型 API，用 20 道精选题目进行实时评测（数学、编程、知识、推理、指令遵循）
- **模糊搜索** — Fuse.js 驱动的模型搜索
- **深色主题** — 全站深色 UI，响应式布局

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **图表**: Recharts
- **搜索**: Fuse.js

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发服务器
pnpm dev
# 访问 http://localhost:3000

# 构建
pnpm build

# 代码检查
pnpm lint
```

### 竞技场功能配置

竞技场功能需要 DeepSeek API 作为评分模型。在项目根目录创建 `.env.local` 文件：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com   # 可选，默认值
```

用户在竞技场页面填写自己的模型 API 地址、模型名称和 API Key，系统会通过 20 道题目对模型进行评测并生成报告。

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页排行榜
│   ├── models/[slug]/        # 模型详情页
│   ├── benchmarks/[slug]/    # Benchmark 详情页
│   ├── compare/              # 模型对比工具
│   ├── arena/                # 大模型竞技场
│   ├── about/                # 关于页
│   └── api/arena/run/        # 竞技场评测 API (SSE 流式)
├── components/
│   ├── layout/               # Header 等布局组件
│   └── arena/                # 竞技场组件 (Form/Progress/Results)
├── data/
│   ├── models.ts             # 模型定义
│   ├── benchmarks.ts         # Benchmark 定义
│   ├── results.ts            # 评测结果数据
│   └── arena-questions.ts    # 竞技场题目 (20题×5类别)
├── lib/
│   ├── rankings.ts           # 综合排名算法
│   ├── normalize.ts          # z-score 归一化
│   ├── search.ts             # Fuse.js 模糊搜索
│   └── arena/
│       ├── runner.ts         # 评测流程引擎 (AsyncGenerator)
│       ├── scorer.ts         # DeepSeek 评分调用
│       └── client.ts         # 被测模型 API 调用
└── types/                    # TypeScript 类型定义
```

## 数据说明

排行榜数据硬编码在 `src/data/` 目录的 TypeScript 文件中，无数据库依赖。

- **数据来源**: `verified: true` 来自官方排行榜，`verified: false` 为厂商自报（乘 0.90 惩罚系数）
- **新增模型**: 编辑 `src/data/models.ts`
- **新增 Benchmark**: 编辑 `src/data/benchmarks.ts`（需设置 category）
- **新增结果**: 编辑 `src/data/results.ts`（同一模型同一 Benchmark 多条数据取最高分）

## 部署

```bash
pnpm build
```

构建产物在 `out/` 目录。由于竞技场功能依赖 API 路由，需要部署到支持 Serverless Functions 的平台（如 Vercel、Netlify 等），不能作为纯静态站点部署。

## License

MIT
