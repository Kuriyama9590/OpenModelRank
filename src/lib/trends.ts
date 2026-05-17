import { models, getAllModels } from '@/data/models';
import { results } from '@/data/results';
import { benchmarks } from '@/data/benchmarks';
import { computeCompositeRankings } from './rankings';
import type { BenchmarkCategory } from '@/types';

export interface TrendPoint {
  modelId: string;
  modelName: string;
  provider: string;
  providerColor: string;
  releaseDate: string;
  score: number;
  isOpenSource: boolean;
}

export interface ScatterPoint {
  modelId: string;
  modelName: string;
  provider: string;
  providerColor: string;
  price: number;
  score: number;
  contextWindow: number;
  speedToks: number;
  isOpenSource: boolean;
}

export type TrendMetric = 'composite' | 'aa-intelligence' | BenchmarkCategory;

function getMetricScore(modelId: string, metric: TrendMetric): number | null {
  if (metric === 'composite') {
    const rankings = computeCompositeRankings();
    const entry = rankings.find(r => r.modelId === modelId);
    return entry?.total ?? null;
  }

  if (metric === 'aa-intelligence') {
    const r = results
      .filter(r => r.modelId === modelId && r.benchmarkId === 'aa-intelligence')
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return r?.score ?? null;
  }

  // Category average
  const categoryScores: number[] = [];
  for (const r of results) {
    if (r.modelId !== modelId) continue;
    const bm = benchmarks[r.benchmarkId];
    if (!bm || bm.category !== metric) continue;
    categoryScores.push(r.score);
  }
  if (categoryScores.length === 0) return null;
  return categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
}

export function getTrendData(metric: TrendMetric, modelIds?: string[]): TrendPoint[] {
  const allModels = modelIds ? modelIds.map(id => models[id]).filter(Boolean) : getAllModels();

  return allModels
    .map(m => {
      const score = getMetricScore(m.id, metric);
      if (score === null) return null;
      return {
        modelId: m.id,
        modelName: m.name,
        provider: m.provider,
        providerColor: m.providerColor,
        releaseDate: m.releaseDate,
        score: Math.round(score * 10) / 10,
        isOpenSource: m.isOpenSource,
      };
    })
    .filter((p): p is TrendPoint => p !== null)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
}

export function getScatterData(): ScatterPoint[] {
  return getAllModels()
    .map(m => {
      const aaResult = results
        .filter(r => r.modelId === m.id && r.benchmarkId === 'aa-intelligence')
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (!aaResult || !m.priceBlended || m.priceBlended <= 0) return null;

      return {
        modelId: m.id,
        modelName: m.name,
        provider: m.provider,
        providerColor: m.providerColor,
        price: m.priceBlended,
        score: aaResult.score,
        contextWindow: m.contextWindow,
        speedToks: m.speedToks ?? 0,
        isOpenSource: m.isOpenSource,
      };
    })
    .filter((p): p is ScatterPoint => p !== null);
}

export function getUniqueProviders(): string[] {
  const providers = new Set<string>();
  for (const m of getAllModels()) {
    providers.add(m.provider);
  }
  return Array.from(providers).sort();
}

// ========== 四维雷达图 (成本/能力) ==========

export interface Radar4DDimension {
  key: string;
  label: string;
}

export const RADAR_4D_DIMENSIONS: Radar4DDimension[] = [
  { key: 'capability', label: '综合能力' },
  { key: 'value', label: '性价比' },
  { key: 'speed', label: '输出速度' },
  { key: 'context', label: '长上下文' },
];

export interface Radar4DEntry {
  modelId: string;
  modelName: string;
  provider: string;
  providerColor: string;
  isOpenSource: boolean;
  capability: number;
  value: number;
  speed: number;
  context: number;
}

function normalizeArray(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map(v => ((v - min) / (max - min)) * 100);
}

export function getQuadrantRadarData(): Radar4DEntry[] {
  const allModels = getAllModels();

  // Collect raw values
  const raw: { modelId: string; capability: number; value: number; speed: number; context: number }[] = [];

  for (const m of allModels) {
    const aaScore = results
      .filter(r => r.modelId === m.id && r.benchmarkId === 'aa-intelligence')
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.score;

    if (aaScore === undefined) continue;
    if (!m.priceBlended || m.priceBlended <= 0) continue;
    if (m.priceBlended === 0) continue; // Skip free-tier models for radar comparison

    raw.push({
      modelId: m.id,
      capability: aaScore,
      value: aaScore / m.priceBlended,
      speed: m.speedToks ?? 0,
      context: m.contextWindow ?? 0,
    });
  }

  if (raw.length < 3) return [];

  const normCap = normalizeArray(raw.map(r => r.capability));
  const normVal = normalizeArray(raw.map(r => r.value));
  const normSpd = normalizeArray(raw.map(r => r.speed));
  const normCtx = normalizeArray(raw.map(r => r.context));

  return raw.map((r, i) => {
    const m = models[r.modelId]!;
    return {
      modelId: r.modelId,
      modelName: m.name,
      provider: m.provider,
      providerColor: m.providerColor,
      isOpenSource: m.isOpenSource,
      capability: Math.round(normCap[i]),
      value: Math.round(normVal[i]),
      speed: Math.round(normSpd[i]),
      context: Math.round(normCtx[i]),
    };
  });
}

// ========== 厂商能力增长折线图 ==========

export interface ProviderTrendLine {
  modelId: string;
  modelName: string;
  releaseDate: string;
  timestamp: number;
  score: number;
  isOpenSource: boolean;
}

export interface ProviderTrendSeries {
  provider: string;
  providerColor: string;
  points: ProviderTrendLine[];
}

export function getProviderTrendSeries(metric: TrendMetric): ProviderTrendSeries[] {
  const allData = getTrendData(metric);

  const byProvider = new Map<string, TrendPoint[]>();
  for (const d of allData) {
    const list = byProvider.get(d.provider) || [];
    list.push(d);
    byProvider.set(d.provider, list);
  }

  const series: ProviderTrendSeries[] = [];
  for (const [provider, points] of byProvider) {
    if (points.length < 1) continue;
    const sorted = points.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    series.push({
      provider,
      providerColor: sorted[0].providerColor,
      points: sorted.map(p => ({
        modelId: p.modelId,
        modelName: p.modelName,
        releaseDate: p.releaseDate,
        timestamp: new Date(p.releaseDate + '-01').getTime(),
        score: p.score,
        isOpenSource: p.isOpenSource,
      })),
    });
  }

  // Sort by earliest model date
  series.sort((a, b) => a.points[0].releaseDate.localeCompare(b.points[0].releaseDate));
  return series;
}

export const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: 'composite', label: '综合排名分' },
  { value: 'aa-intelligence', label: 'AA Intelligence Index' },
  { value: 'coding', label: '代码能力' },
  { value: 'math', label: '数学能力' },
  { value: 'science', label: '科学推理' },
  { value: 'knowledge', label: '知识广度' },
  { value: 'agent', label: '智能体' },
  { value: 'instruction', label: '指令遵循' },
];
