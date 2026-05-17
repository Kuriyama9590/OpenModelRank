import { getBenchmark } from '@/data/benchmarks';
import { getModel, models } from '@/data/models';
import { results } from '@/data/results';
import type { BenchmarkCategory } from '@/types';
import { CATEGORY_NAMES } from '@/types';

export const RADAR_CATEGORIES: BenchmarkCategory[] = [
  'coding', 'math', 'science', 'knowledge', 'agent', 'speed', 'value', 'longcontext'
];

export interface RadarEntry {
  category: string;
  score: number;
  hasData: boolean;
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function collectRawCategoryScores(modelId: string): Record<string, number> {
  const categoryRawScores: Record<string, number[]> = {};

  for (const r of results) {
    if (r.modelId !== modelId) continue;
    const bm = getBenchmark(r.benchmarkId);
    if (!bm) continue;
    if (!categoryRawScores[bm.category]) categoryRawScores[bm.category] = [];
    categoryRawScores[bm.category].push(r.score);
  }

  const model = getModel(modelId);
  const categoryAvg: Record<string, number> = {};

  for (const [cat, scores] of Object.entries(categoryRawScores)) {
    categoryAvg[cat] = avg(scores);
  }

  if (!model) return categoryAvg;

  if (model.speedToks) {
    categoryAvg['speed'] = model.speedToks;
  }

  const aaScore = results.find(r => r.modelId === modelId && r.benchmarkId === 'aa-intelligence')?.score;
  if (model.priceBlended && model.priceBlended > 0 && aaScore) {
    categoryAvg['value'] = aaScore / model.priceBlended;
  }

  const lcrScore = results.find(r => r.modelId === modelId && r.benchmarkId === 'aa-lcr')?.score;
  if (lcrScore !== undefined && lcrScore !== null) {
    categoryAvg['longcontext'] = lcrScore;
  } else if (model.contextWindow > 0) {
    categoryAvg['longcontext'] = model.contextWindow / 10000;
  }

  return categoryAvg;
}

export function computeCategoryMaxScores(): Record<string, number> {
  const maxScores: Record<string, number> = {};
  for (const cat of RADAR_CATEGORIES) {
    maxScores[cat] = 0;
  }
  for (const modelId of Object.keys(models)) {
    const catScores = collectRawCategoryScores(modelId);
    for (const cat of RADAR_CATEGORIES) {
      if (catScores[cat] > maxScores[cat]) {
        maxScores[cat] = catScores[cat];
      }
    }
  }
  return maxScores;
}

export function computeModelRadarData(
  modelId: string,
  benchmarkScores: Record<string, { score: number; rank: number; total: number } | null>,
  maxScores: Record<string, number>,
): RadarEntry[] {
  const categoryScores: Record<string, number[]> = {};

  for (const [bmId, bmScore] of Object.entries(benchmarkScores)) {
    if (!bmScore) continue;
    const bm = getBenchmark(bmId);
    if (!bm) continue;
    if (!categoryScores[bm.category]) categoryScores[bm.category] = [];
    categoryScores[bm.category].push(bmScore.score);
  }

  const model = getModel(modelId);
  if (model?.speedToks) {
    categoryScores['speed'] = [model.speedToks];
  }
  if (model?.priceBlended && model.priceBlended > 0) {
    const aaScore = benchmarkScores['aa-intelligence']?.score;
    if (aaScore) {
      categoryScores['value'] = [aaScore / model.priceBlended];
    }
  }
  const lcrScore = benchmarkScores['aa-lcr']?.score;
  if (lcrScore !== undefined && lcrScore !== null) {
    categoryScores['longcontext'] = [lcrScore];
  } else if (model && model.contextWindow > 0) {
    categoryScores['longcontext'] = [model.contextWindow / 10000];
  }

  return RADAR_CATEGORIES.map(cat => {
    const scores = categoryScores[cat];
    const max = maxScores[cat];
    if (scores && scores.length > 0 && max > 0) {
      const modelAvg = avg(scores);
      return { category: CATEGORY_NAMES[cat] || cat, score: Math.round((modelAvg / max) * 100), hasData: true };
    }
    return { category: CATEGORY_NAMES[cat] || cat, score: 0, hasData: false };
  });
}
