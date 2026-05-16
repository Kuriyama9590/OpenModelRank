# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenModelRank — 大模型能力排行榜 + 在线竞技场。展示 LLM 在多项 Benchmark 上的评测分数和排名，同时提供竞技场功能让用户对自有模型进行实时评测。排行榜数据硬编码在 TypeScript 文件中，竞技场通过 API 路由调用外部模型。

## Commands

```bash
pnpm dev          # 开发服务器 (localhost:3000)
pnpm build        # 构建
pnpm lint         # ESLint 检查
npx tsx scripts/check-rankings.ts  # 运行排名验证脚本
```

## Architecture

**框架**: Next.js 16 App Router，无 `output: "export"`（竞技场 API 路由需要服务端支持）。

**数据层** (`src/data/`): 排行榜全部数据
- `models.ts` — 模型定义 (Record<string, Model>)，含 getModel/getAllModels
- `benchmarks.ts` — Benchmark 定义 (Record<string, Benchmark>)，含 getBenchmark/getAllBenchmarks/getBenchmarksByCategory
- `results.ts` — 评测结果数组 (ModelResult[])，含 getResultsByModel/getResultsByBenchmark/getLatestResult
- `arena-questions.ts` — 竞技场题目 (20题，5类别各4题)，含类型定义和工具函数

**排名引擎** (`src/lib/`):
- `rankings.ts` — 综合排名算法：z-score 归一化 → 类别加权 → 自报惩罚(0.90)。入口: computeCompositeRankings()
- `normalize.ts` — z-score 归一化 (50 ± 16.67)，需至少 3 个数据点
- `search.ts` — Fuse.js 模糊搜索 (threshold 0.4)

**竞技场** (`src/lib/arena/` + `src/app/api/arena/`):
- `runner.ts` — 评测流程引擎，AsyncGenerator 逐题调用模型+评分，yield 进度/结果/完成事件
- `client.ts` — 被测模型调用 (OpenAI 兼容 API，60s 超时，temperature=0.3)
- `scorer.ts` — DeepSeek 评分调用 (30s 超时，temperature=0.1，输出 JSON)
- `api/arena/run/route.ts` — POST API，SSE 流式返回评测事件

**页面路由** (`src/app/`):
- `/` — 首页排行榜 (服务端计算排名，传给客户端 LeaderboardTable)
- `/models/[slug]` — 模型详情 (generateStaticParams 预生成)
- `/benchmarks/[slug]` — Benchmark 详情 (generateStaticParams 预生成)
- `/compare` — 模型对比工具 (客户端组件，URL params 存状态)
- `/arena` — 大模型竞技场 (客户端组件，SSE 流式接收评测结果)
- `/about` — 关于页

**组件模式**: 服务端组件计算数据，客户端组件 ('use client') 处理交互。Header/LeaderboardTable/Compare/Arena 系列组件为客户端组件。

## Key Conventions

- 路径别名: `@/*` → `./src/*`
- UI 语言: 中文 (HTML lang="zh-CN")
- 深色主题: `<html class="dark">`，颜色通过 CSS 变量定义在 globals.css
- Tailwind CSS v4: CSS-first 配置 (无 tailwind.config)，使用 `@theme inline` 指令
- 图表: Recharts (RadarChart, BarChart)
- 工具函数: `cn()` = clsx + tailwind-merge (shadcn/ui 模式)
- 数据质量: `verified: true` 来自官方排行榜，`verified: false` 厂商自报(乘 0.90 惩罚系数)

## Data Model

**BenchmarkCategory** = coding | math | science | knowledge | agent | instruction | composite | speed | value | longcontext

**ArenaCategory** = math | coding | knowledge | reasoning | instruction

**ModelResult**: { modelId, benchmarkId, score, date, scaffold?, verified }

## Ranking Algorithm (rankings.ts)

1. 每个 Benchmark 的原始分数做 z-score 归一化 (normalize.ts)
2. 同类别 Benchmark 分数取平均
3. 自报数据 (verified=false) 先乘 0.90
4. 按类别权重加权求和: coding=0.22, science=0.15, composite=0.14, math=0.13, knowledge=0.12, agent=0.10, instruction=0.04, speed=0.04, value=0.03, longcontext=0.03
5. 门槛: 至少 2 个类别 + 2 个 Benchmark

## Arena Flow

1. 用户在 `/arena` 填写 API URL、模型名、API Key
2. 前端 POST 到 `/api/arena/run`，后端启动 AsyncGenerator
3. 逐题调用被测模型 (client.ts) → DeepSeek 评分 (scorer.ts)，通过 SSE 返回进度
4. 20 题完成后计算各类别得分和总分，返回评测报告

## Environment Variables

- `DEEPSEEK_API_KEY` — 竞技场评分模型的 API Key (必填)
- `DEEPSEEK_BASE_URL` — DeepSeek API 地址 (可选，默认 https://api.deepseek.com)

## Adding Data

- 新模型: 在 `src/data/models.ts` 添加条目
- 新 Benchmark: 在 `src/data/benchmarks.ts` 添加条目 (需设置 category)
- 新结果: 在 `src/data/results.ts` 数组末尾添加 ModelResult 条目
- 同一模型同一 Benchmark 多条数据时取最高分
- 新竞技场题目: 在 `src/data/arena-questions.ts` 添加 ArenaQuestion 条目 (需设置 category 和 scoringRubric)
