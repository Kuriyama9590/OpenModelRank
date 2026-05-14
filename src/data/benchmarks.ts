import { Benchmark } from '@/types';

export const benchmarks: Record<string, Benchmark> = {
  'swe-bench-verified': {
    id: 'swe-bench-verified',
    name: 'SWE-bench Verified',
    shortName: 'SWE',
    category: 'coding',
    unit: '%',
    higherIsBetter: true,
    description: '解决真实GitHub Issue的通过率',
    longDescription:
      'SWE-bench Verified 测评模型解决真实开源项目中的GitHub Issue的能力。模型需要在给定代码库和Issue描述的情况下，生成代码修复。Verified子集包含500个经过人工过滤的高质量任务。评估使用mini-SWE-agent v2作为统一脚手架。',
    sourceUrl: 'https://www.swebench.com/verified.html',
  },
  'live-code-bench': {
    id: 'live-code-bench',
    name: 'LiveCodeBench v6',
    shortName: 'LiveCode',
    category: 'coding',
    unit: '%',
    higherIsBetter: true,
    description: '在线竞赛编程题目通过率',
    longDescription:
      'LiveCodeBench 收集来自 Codeforces、AtCoder 等在线编程竞赛平台的真题，测试模型在未见过的编程问题上的表现。v6版本包含了最新的竞赛题目。',
    sourceUrl: 'https://livecodebench.github.io/leaderboard',
  },
  'humaneval-plus': {
    id: 'humaneval-plus',
    name: 'HumanEval+',
    shortName: 'HE+',
    category: 'coding',
    unit: '%',
    higherIsBetter: true,
    description: '基础代码生成 pass@1',
    longDescription:
      'HumanEval+ 是 HumanEval 的增强版，增加了更多测试用例以检测模型代码生成质量。测量 greedy pass@1 分数。',
    sourceUrl: 'https://evalplus.github.io/leaderboard.html',
  },
  'gpqa-diamond': {
    id: 'gpqa-diamond',
    name: 'GPQA Diamond',
    shortName: 'GPQA',
    category: 'science',
    unit: '%',
    higherIsBetter: true,
    description: '研究生级科学推理',
    longDescription:
      'GPQA Diamond 包含研究生水平的物理、化学和生物多选题，由领域专家验证。测试模型的深度科学推理能力。',
    sourceUrl: 'https://github.com/idavidrein/gpqa',
  },
  'aime': {
    id: 'aime',
    name: 'AIME',
    shortName: 'AIME',
    category: 'math',
    unit: '%',
    higherIsBetter: true,
    description: '美国数学邀请赛',
    longDescription:
      'AIME (American Invitational Mathematics Examination) 是选拔美国IMO代表队的竞赛级数学考试。模型需要解答15道高难度数学题。最新使用AIME 2025/2026题目。',
    sourceUrl: 'https://maa.org/math-competitions/',
  },
  'math-500': {
    id: 'math-500',
    name: 'MATH-500',
    shortName: 'MATH',
    category: 'math',
    unit: '%',
    higherIsBetter: true,
    description: '数学竞赛题库',
    longDescription:
      'MATH-500 包含500道竞赛级数学题，覆盖代数、几何、概率等多个领域。',
    sourceUrl: 'https://github.com/hendrycks/math',
  },
  'mmlu-pro': {
    id: 'mmlu-pro',
    name: 'MMLU-Pro',
    shortName: 'MMLU',
    category: 'knowledge',
    unit: '%',
    higherIsBetter: true,
    description: '多学科专业知识',
    longDescription:
      'MMLU-Pro 覆盖数学、物理、化学、生物、法律、历史等57个学科，测试模型的广泛知识覆盖和专业理解能力。',
    sourceUrl: 'https://github.com/TIGER-AI-Lab/MMLU-Pro',
  },
  'hle': {
    id: 'hle',
    name: 'HLE',
    shortName: 'HLE',
    category: 'knowledge',
    unit: '%',
    higherIsBetter: true,
    description: '人类最后的考试',
    longDescription:
      'HLE (Humanity\'s Last Exam) 是目前最难的AI测试集，包含来自数百个专业领域的高难度封闭式问题。分数 = 无工具 / 有工具。',
    sourceUrl: 'https://lastexam.ai/',
  },
  'aa-intelligence': {
    id: 'aa-intelligence',
    name: 'AA Intelligence Index',
    shortName: 'AA Index',
    category: 'composite',
    unit: 'score',
    higherIsBetter: true,
    description: 'Artificial Analysis 综合智能指数',
    longDescription:
      'Artificial Analysis Intelligence Index v4.0 综合了10项评测：GDPval-AA, τ²-Bench Telecom, Terminal-Bench Hard, SciCode, AA-LCR, AA-Omniscience, IFBench, HLE, GPQA Diamond, CritPt。分数范围0-100。',
    sourceUrl: 'https://artificialanalysis.ai',
  },
  'swe-bench-pro': {
    id: 'swe-bench-pro',
    name: 'SWE-bench Pro',
    shortName: 'SWE-Pro',
    category: 'coding',
    unit: '%',
    higherIsBetter: true,
    description: '专业工程师级编程任务',
    longDescription:
      'SWE-bench Pro 是SWE-bench的升级版，包含更复杂、更贴近专业软件工程师日常工作的任务。',
    sourceUrl: 'https://www.swebench.com',
  },
  'gdpval-aa': {
    id: 'gdpval-aa',
    name: 'GDPval-AA',
    shortName: 'GDPval',
    category: 'agent',
    unit: 'Elo',
    higherIsBetter: true,
    description: '真实世界工作任务的智能体表现',
    longDescription:
      'Artificial Analysis 对 OpenAI GDPval 数据集的实现。模型通过 Web + Shell 在智能体循环中完成 44 个职业的真实工作。',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/gdpval-aa',
  },
  'tau2-bench': {
    id: 'tau2-bench',
    name: 'τ²-Bench Telecom',
    shortName: 'τ²-Bench',
    category: 'agent',
    unit: '%',
    higherIsBetter: true,
    description: '双控制对话式AI基准',
    longDescription:
      '模拟技术支持场景，智能体和用户都必须协调行动来解决电信服务问题。',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/tau2-bench',
  },
  'terminal-bench': {
    id: 'terminal-bench',
    name: 'Terminal-Bench Hard',
    shortName: 'Term-Bench',
    category: 'agent',
    unit: '%',
    higherIsBetter: true,
    description: '终端环境的智能体编程与运维',
    longDescription:
      '评估AI在终端环境中完成软件工程、系统管理和数据处理任务的能力。',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/terminalbench-hard',
  },
  'aa-lcr': {
    id: 'aa-lcr',
    name: 'AA-LCR',
    shortName: 'LCR',
    category: 'longcontext',
    unit: '%',
    higherIsBetter: true,
    description: '长上下文推理',
    longDescription:
      'Artificial Analysis 长上下文推理基准。评估模型从 10K-100K token 长文档中提取、推理和综合信息的能力。',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/artificial-analysis-long-context-reasoning',
  },
  'scicode': {
    id: 'scicode',
    name: 'SciCode',
    shortName: 'SciCode',
    category: 'coding',
    unit: '%',
    higherIsBetter: true,
    description: '科学计算代码生成',
    longDescription:
      '科学家策划的编程基准，包含 16 个科学学科的 288 个测试子问题。',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/scicode',
  },
  'ifbench': {
    id: 'ifbench',
    name: 'IFBench',
    shortName: 'IFBench',
    category: 'instruction',
    unit: '%',
    higherIsBetter: true,
    description: '指令遵循精确度',
    longDescription:
      '评估模型精确遵循 58 个多样化、可验证的约束条件的能力。',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/ifbench',
  },
  'aa-omniscience': {
    id: 'aa-omniscience',
    name: 'AA-Omniscience',
    shortName: 'Omnisci',
    category: 'knowledge',
    unit: '%',
    higherIsBetter: true,
    description: '知识准确性与幻觉',
    longDescription:
      'AA-Omniscience 测量模型的事实回忆和幻觉率，覆盖经济相关的多个领域。',
    sourceUrl: 'https://artificialanalysis.ai/evaluations/omniscience',
  },
};

export function getBenchmark(id: string): Benchmark | undefined {
  return benchmarks[id];
}

export function getAllBenchmarks(): Benchmark[] {
  return Object.values(benchmarks);
}

export function getBenchmarksByCategory(): Record<string, Benchmark[]> {
  const result: Record<string, Benchmark[]> = {};
  for (const b of Object.values(benchmarks)) {
    if (!result[b.category]) result[b.category] = [];
    result[b.category].push(b);
  }
  return result;
}
