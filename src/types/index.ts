export interface Model {
  id: string;
  name: string;
  provider: string;
  providerColor: string;
  isReasoning: boolean;
  isOpenSource: boolean;
  releaseDate: string;
  description: string;
  paramSize?: string;
  contextWindow: number;
  website?: string;
  speedToks?: number;
  priceBlended?: number;
  latencyTTFT?: number;
  totalResponse?: number;
}

export type BenchmarkCategory =
  | 'coding'
  | 'math'
  | 'science'
  | 'knowledge'
  | 'agent'
  | 'instruction'
  | 'composite'
  | 'speed'
  | 'value'
  | 'longcontext';

export interface Benchmark {
  id: string;
  name: string;
  shortName: string;
  category: BenchmarkCategory;
  unit: string;
  higherIsBetter: boolean;
  description: string;
  longDescription: string;
  sourceUrl: string;
}

export interface ModelResult {
  modelId: string;
  benchmarkId: string;
  score: number;
  date: string;
  scaffold?: string;
  verified: boolean;
}

export interface CompositeScore {
  modelId: string;
  total: number;
  rank: number;
  breakdown: Record<string, number>;
}

export interface TableColumn {
  id: string;
  label: string;
  sortable: boolean;
  category?: BenchmarkCategory;
}

export const CATEGORY_NAMES: Record<BenchmarkCategory, string> = {
  coding: '代码',
  math: '数学',
  science: '科学',
  knowledge: '知识',
  agent: '智能体',
  instruction: '指令遵循',
  composite: '综合',
  speed: '速度',
  value: '性价比',
  longcontext: '长文本',
};

export const CATEGORY_COLORS: Record<BenchmarkCategory, string> = {
  coding: '#3b82f6',
  math: '#ef4444',
  science: '#10b981',
  knowledge: '#f59e0b',
  agent: '#8b5cf6',
  instruction: '#06b6d4',
  composite: '#6b7280',
  speed: '#f97316',
  value: '#ec4899',
  longcontext: '#14b8a6',
};
