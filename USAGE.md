# OpenModelRank 使用手册

## 快速开始

打开 `http://localhost:3001`（或你的部署地址）即可看到大模型能力排行榜。

---

## 页面说明

### 1. 综合排行榜 (首页)

首页展示两种排名的切换：

| 视图 | 说明 | 数据来源 |
|------|------|---------|
| **AA Index** (默认) | Artificial Analysis 综合智能指数 v4.0，整合 10 项独立评测的第三方排名 | artificialanalysis.ai |
| **综合排名** | 本站基于多维度数据的加权排名 | 官方排行榜 + 模型技术报告 |

#### 表格列说明

| 列 | 说明 |
|-----|------|
| # | 排名 |
| 模型 | 模型名称 + 厂商标签 + 数据完整度星标(⭐⭐⭐) |
| 综合分/分数 | AA Index 得分(0-60) 或本站综合分(0-100) |
| SWE | SWE-bench Verified 代码修复通过率 |
| GPQA | GPQA Diamond 研究生级科学推理 |
| HLE | Humanity's Last Exam 最难测试 |
| MMLU | MMLU-Pro 多学科知识 |
| AIME | 美国数学邀请赛 |
| AA Index | Artificial Analysis 智能指数 |

#### 操作

- **搜索**: 顶部搜索框输入模型名或厂商名
- **排序**: 点击任意列标题排序
- **切换**: 点击"综合排名"或"AA Index"按钮切换视图
- **详情**: 点击模型名进入详情页

---

### 2. 模型详情页

路径: `/models/{模型ID}`

#### 页面内容

| 区域 | 内容 |
|------|------|
| **头部** | 模型名称、厂商、发布日期、开源/闭源标签、推理模型标签 |
| **雷达图** | 6 维度能力可视化: 代码、数学、科学、知识、智能体、综合 |
| **分数卡片** | 每个 Benchmark 的分数、排名、数据来源标注 |
| **同类对比** | 该模型在各 Benchmark 中的 Top 4 排名条 |
| **数据声明** | 数据来源和更新日期 |

#### Benchmark 卡片颜色含义

| 颜色 | 含义 |
|------|------|
| 🟢 绿色 | 分数 ≥ 80%，顶级水平 |
| 🟡 黄色 | 分数 50-79%，中等 |
| ⚪ 灰色 | 分数 < 50%，或暂无数据 |

---

### 3. Benchmark 专项页

路径: `/benchmarks/{Benchmark ID}`

展示单个 Benchmark 的完整排行榜。

#### 表格列

| 列 | 说明 |
|-----|------|
| # | 排名 |
| 模型 | 模型名 + 厂商 |
| Score | 原始分数 |
| Date | 测试日期 |
| Scaffold | 评估框架（SWE-bench 标注，不同框架不直接可比） |
| Verified | 🟢=官方排行榜数据，🟡=厂商自报数据 |

---

### 4. 模型对比工具

路径: `/compare`

- 最多选择 **4 个**模型同时对比
- 雷达图叠加：不同颜色区分不同模型
- 对比表格：行=Benchmark，列=模型，最高分高亮
- URL 可分享: `?models=gpt-5-5,claude-opus-4-7`

---

### 5. 关于页面

路径: `/about`

数据来源说明、免责声明、联系方式。

---

## Benchmark 说明

### SWE-bench Verified
- **测什么**: 模型解决真实 GitHub Issue 的能力
- **怎么测**: 给定代码库 + Issue 描述，模型生成修复代码
- **可信度**: 官方排行榜使用 mini-SWE-agent v2 统一脚手架，可跨模型对比。厂商自报分数使用自家框架，标记为 🟡。

### GPQA Diamond
- **测什么**: 研究生级物理、化学、生物多选题
- **怎么测**: 领域专家验证的高难度科学题
- **可信度**: 🟢 高，独立的学术基准

### HLE (Humanity's Last Exam)
- **测什么**: 目前最难的 AI 测试，覆盖数百个专业领域
- **怎么测**: 无工具环境下的封闭式问题
- **可信度**: 🟢 高，由学术界和工业界联合维护

### MMLU-Pro
- **测什么**: 57 个学科的专业知识
- **可信度**: 🟢 高，经典基准

### AIME
- **测什么**: 美国数学竞赛题 (AMC → AIME)
- **可信度**: 🟡 中，各模型测试条件可能有差异

### LiveCodeBench
- **测什么**: 在线编程竞赛真题
- **可信度**: 🟡 中，题目实时更新

### HumanEval+
- **测什么**: 基础代码生成
- **可信度**: 🟢 高，但已较旧(大多为 2025 数据)

### AA Intelligence Index
- **测什么**: 综合 10 项独立评测的加权能力指数
- **可信度**: 🟢🟢 最高，唯一独立全面的第三方评测
- **包含**: GDPval-AA, τ²-Bench, Terminal-Bench, SciCode, AA-LCR, AA-Omniscience, IFBench, HLE, GPQA Diamond, CritPt

---

## 数据可靠性

### 数据分级

| 标记 | 颜色 | 含义 |
|------|:--:|------|
| Verified 🟢 | 绿 | 来自官方排行榜（同等测试条件下可对比） |
| Self-reported 🟡 | 黄 | 厂商自行报告（测试条件、脚手架可能不同） |

### 脚手架差异 (SWE-bench)

同一个模型在不同评估框架下分数差异可达 5-10 个百分点：
- **mini-SWE-agent v2**: 官方统一脚手架，可跨模型对比 ✅
- **自研框架**: 厂商自己的 Agent 框架，不可直接对比 ⚠️
- **Claude Code scaffold**: MiniMax 使用的框架，不可对比 ⚠️

> 综合排名计算中，自报分数 (verified=false) 会乘以 0.90 的惩罚系数。

---

## 综合排名计算方法

### 参与条件

1. 至少覆盖 **2 个不同能力类别**（代码/数学/科学/知识/智能体/指令遵循/综合）
2. 至少 **2 个 Benchmark** 有数据

### 计算步骤

1. **类别聚合**: 将同一类别下的 Benchmark 分数取平均
2. **归一化**: 使用 z-score 标准化（均值为 50，标准差 16.67）
3. **自报惩罚**: 非官方排行榜数据 × 0.90
4. **加权求和**: 按类别权重计算加权平均

### 类别权重

| 类别 | 权重 |
|------|:---:|
| 代码 | 0.25 |
| 科学 | 0.18 |
| 数学 | 0.15 |
| 知识 | 0.15 |
| 综合 (AA Index) | 0.12 |
| 智能体 | 0.10 |
| 指令遵循 | 0.05 |

---

## 常见问题

### Q: 为什么有的模型不在综合排名里？
数据覆盖不足（少于 2 个能力类别或少于 2 个 Benchmark）。这些模型仍可在 AA Index 排名和详情页中查看。

### Q: 为什么 SWE-bench 同一个模型有两个分数？
不同评估脚手架（mini-SWE-agent vs 自研框架）。默认使用 mini-SWE-agent v2 的官方分数。

### Q: 综合排名和 AA Index 哪个更可靠？
**AA Index** 是独立第三方评测，最全面的横向对比。综合排名是本站额外计算，可以提供更细粒度的能力维度分解。

### Q: 为什么 Kimi K2.6 排名较低？
Kimi K2.6 的大多数 Benchmark 分数来自厂商自报（非官方排行榜），在综合排名中应用了 0.90 的惩罚系数。

### Q: 如何反馈数据错误？
通过 GitHub Issue 或邮件联系。

---

## 本地运行

### 重要说明

**本网站是纯静态站点，没有后端服务。** 所有数据（模型信息、跑分）预编译在 HTML 中，无需数据库，无需服务器端运行。`out/` 目录可直接部署到任意静态托管。

### 快速启动

#### 方式一：直接预览构建结果（推荐，无需安装依赖）

```bash
# 进入 out 目录
cd out

# 启动静态文件服务器（需要 npx，首次会下载 serve 包）
npx serve -s . -p 3001
```

然后打开浏览器访问 `http://localhost:3001`。

> `serve` 是一个零配置静态文件服务器。`-s` 表示单页应用模式（未匹配路由回退到 index.html），`-p` 指定端口。

#### 方式二：开发模式（需要 node.js + pnpm）

```bash
# 1. 安装依赖（仅首次）
pnpm install

# 2. 启动 Next.js 开发服务器，支持热更新
pnpm dev

# 访问 http://localhost:3000
```

#### 方式三：构建 + 预览

```bash
pnpm install
pnpm build        # 输出到 out/ 目录
npx serve -s out/ # 预览
```

### 部署到服务器

`out/` 目录是纯静态 HTML/CSS/JS，可任意部署：

```bash
# 方式 A: serve（开发用零配置）
npx serve -s out/ -p 80

# 方式 B: nginx（生产推荐）
# 将 out/ 目录内容复制到 nginx 的 html 目录
# cp -r out/* /usr/share/nginx/html/

# 方式 C: Python（临时用）
# cd out && python3 -m http.server 8080

# 方式 D: GitHub Pages / Netlify / Cloudflare Pages
# 上传 out/ 目录即可
```

### 项目结构

```
model-leaderboard/
├── src/
│   ├── data/           # 模型、Benchmark、跑分数据
│   ├── lib/            # 排名算法、搜索、归一化
│   ├── components/     # React 组件
│   └── app/            # 页面路由
├── out/                # 构建产物（静态站点，部署此目录）
├── scripts/            # 辅助脚本
├── USAGE.md            # 本手册
└── package.json
```

## 技术栈

- Next.js 16 (App Router + Static Export)
- TypeScript
- Tailwind CSS v4
- Recharts (图表)
- Fuse.js (搜索)
- shadcn/ui 组件
