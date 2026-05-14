import { CompositeScore, BenchmarkCategory } from '@/types';
import { benchmarks } from '@/data/benchmarks';
import { normalizeScore } from './normalize';
import { models } from '@/data/models';
import { results } from '@/data/results';

const CATEGORY_WEIGHTS: Record<BenchmarkCategory, number> = {
  coding: 0.22,
  math: 0.13,
  science: 0.15,
  knowledge: 0.12,
  agent: 0.10,
  instruction: 0.04,
  composite: 0.14,
  speed: 0.04,
  value: 0.03,
  longcontext: 0.03,
};

const MIN_CATEGORIES = 2;
const MIN_BENCHMARKS = 2;
const TIME_DECAY_MONTHS = 12;
const TIME_DECAY_FACTOR = 0.90;
const SELF_REPORT_PENALTY = 0.90;

export function getModelScore(modelId: string, benchmarkId: string): number | null {
  const rs = results
    .filter(r => r.modelId === modelId && r.benchmarkId === benchmarkId)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (rs.length === 0) return null;
  return rs[0].score;
}

export function getTopModels(benchmarkId: string, limit = 5): { modelId: string; score: number }[] {
  const scores = getBenchmarkScores(benchmarkId);
  return scores.slice(0, limit);
}

export function getBenchmarkScores(benchmarkId: string): { modelId: string; score: number }[] {
  const seen = new Set<string>();
  const entries: { modelId: string; date: string; score: number }[] = [];
  for (const r of results) {
    if (r.benchmarkId !== benchmarkId) continue;
    if (!seen.has(r.modelId)) {
      seen.add(r.modelId);
      entries.push({ modelId: r.modelId, date: r.date, score: r.score });
    }
  }
  const bm = benchmarks[benchmarkId];
  if (bm && bm.higherIsBetter) {
    entries.sort((a, b) => b.score - a.score);
  } else {
    entries.sort((a, b) => a.score - b.score);
  }
  return entries.map(e => ({ modelId: e.modelId, score: e.score }));
}

export function computeCompositeRankings(): CompositeScore[] {
  const modelIds = Object.keys(models);

  const allScoresMap: Record<string, Record<string, { score: number; verified: boolean; date: string }>> = {};
  for (const bm of Object.values(benchmarks)) {
    allScoresMap[bm.id] = {};
    for (const r of results) {
      if (r.benchmarkId !== bm.id) continue;
      const existing = allScoresMap[bm.id][r.modelId];
      if (!existing || r.score > existing.score) {
        allScoresMap[bm.id][r.modelId] = { score: r.score, verified: r.verified, date: r.date };
      }
    }
  }

  const benchmarkAllScores: Record<string, number[]> = {};
  for (const bmId of Object.keys(allScoresMap)) {
    benchmarkAllScores[bmId] = Object.values(allScoresMap[bmId])
      .filter(r => r.verified)
      .map(r => r.score);
  }

  const composites: CompositeScore[] = [];

  for (const modelId of modelIds) {
    const categoryScores: Record<string, number[]> = {};
    let totalBenchmarks = 0;
    const coveredCategories = new Set<string>();

    for (const bm of Object.values(benchmarks)) {
      const entry = allScoresMap[bm.id]?.[modelId];
      if (entry === undefined) continue;
      const allS = benchmarkAllScores[bm.id];
      if (!allS || allS.length < 2) continue;

      let score = entry.score;

      if (!entry.verified) {
        score = score * SELF_REPORT_PENALTY;
      }

      const normalized = normalizeScore(score, allS);
      if (normalized < 0) continue;
      if (!categoryScores[bm.category]) categoryScores[bm.category] = [];
      categoryScores[bm.category].push(normalized);
      totalBenchmarks++;
      coveredCategories.add(bm.category);
    }

    if (coveredCategories.size < MIN_CATEGORIES) continue;
    if (totalBenchmarks < MIN_BENCHMARKS) continue;

    let total = 0;
    let totalWeight = 0;
    const breakdown: Record<string, number> = {};

    for (const [cat, scores] of Object.entries(categoryScores)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const weight = CATEGORY_WEIGHTS[cat as BenchmarkCategory] || 0.08;
      total += avg * weight;
      totalWeight += weight;
      breakdown[cat] = Math.round(avg);
    }

    if (totalWeight === 0) continue;
    total = total / totalWeight;

    composites.push({
      modelId,
      total: Math.round(total * 10) / 10,
      rank: 0,
      breakdown,
    });
  }

  composites.sort((a, b) => b.total - a.total);
  composites.forEach((c, i) => (c.rank = i + 1));

  return composites;
}

export function getModelBenchmarkScores(modelId: string): Record<string, { score: number; rank: number; total: number } | null> {
  const result: Record<string, { score: number; rank: number; total: number } | null> = {};
  for (const bm of Object.values(benchmarks)) {
    const allScores = getBenchmarkScores(bm.id);
    const entry = allScores.find(s => s.modelId === modelId);
    if (entry) {
      result[bm.id] = { score: entry.score, rank: allScores.indexOf(entry) + 1, total: allScores.length };
    } else {
      result[bm.id] = null;
    }
  }
  return result;
}

export function computeCoverage(modelId: string): { categories: number; benchmarks: number; maxCategories: number } {
  const covered = new Set<string>();
  const bms = new Set<string>();
  for (const r of results) {
    if (r.modelId === modelId) {
      const bm = benchmarks[r.benchmarkId];
      if (bm) {
        covered.add(bm.category);
        bms.add(bm.id);
      }
    }
  }
  return { categories: covered.size, benchmarks: bms.size, maxCategories: 6 };
}
