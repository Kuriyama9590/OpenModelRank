# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

OpenModelRank — 大模型能力排行榜 + 在线竞技场。展示 LLM 在多项 Benchmark 上的评测分数和排名，同时提供竞技场功能让用户对自有模型进行实时评测。

## 命令

```bash
pnpm dev          # 开发服务器 (localhost:3000)
pnpm build        # 构建
pnpm lint         # ESLint 检查
npx tsx scripts/check-rankings.ts  # 运行排名验证脚本
```

## 架构

**框架**: Next.js 16 App Router。竞技场 API 路由需要服务端支持，不能纯静态导出。

**数据流**:
- 排行榜数据硬编码在 `src/data/` 的 TypeScript 文件中（无数据库）
- 竞技场评测报告存储在 `data/arena-reports.db`（better-sqlite3，`src/lib/db.ts` 管理连接和迁移）
- 竞技场评分由 DeepSeek API 完成（`src/lib/arena/scorer.ts`），被测模型通过 OpenAI 兼容 API 调用（`src/lib/arena/client.ts`）

**组件模式**: 服务端组件计算数据并传给客户端组件。客户端组件标记 `'use client'`。

**路径别名**: `@/*` → `./src/*`

## 编码规范

- 回复用户时使用中文，代码和注释保持英文
- UI 语言: 中文 (HTML lang="zh-CN")
- 深色主题: `<html class="dark">`，颜色通过 CSS 变量定义在 globals.css
- Tailwind CSS v4: CSS-first 配置 (无 tailwind.config)，使用 `@theme inline` 指令
- 图表: Recharts (RadarChart, BarChart)
- 工具函数: `cn()` = clsx + tailwind-merge
- 数据质量: `verified: true` 来自官方排行榜，`verified: false` 厂商自报(乘 0.90 惩罚系数)

## 数据模型

类型定义在 `src/types/index.ts`。

**BenchmarkCategory** = coding | math | science | knowledge | agent | instruction | composite | speed | value | longcontext

**ArenaCategory** = math | coding | knowledge | reasoning | instruction | agent | creative | roleplay

**ModelResult**: { modelId, benchmarkId, score, date, scaffold?, verified }

## 添加数据

- 新模型: 在 `src/data/models.ts` 添加条目
- 新 Benchmark: 在 `src/data/benchmarks.ts` 添加条目 (需设置 category)
- 新结果: 在 `src/data/results.ts` 数组末尾添加 ModelResult 条目
- 同一模型同一 Benchmark 多条数据时取最高分
- 新竞技场题目: 在 `src/data/arena-questions/` 对应类别文件中添加

## 环境配置

- Git 代理: `http.proxy` / `https.proxy` = `http://127.0.0.1:7890` (全局已配置)

## 禁止事项

- 不要擅自修改 rankings.ts 中的类别权重，除非用户明确要求
- 不要修改 normalize.ts 中的归一化公式参数
- 不要在雷达图中用全局平均值填充缺失维度（会导致所有模型形状雷同）
- 不要把数据从 TypeScript 迁移到外部 JSON/数据库，除非用户明确要求
- 不要引入新的 UI 框架或组件库，保持现有技术栈
- 不要添加未请求的功能、注释或文档
