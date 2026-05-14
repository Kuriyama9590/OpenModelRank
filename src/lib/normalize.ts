import { results } from '@/data/results';
import { benchmarks } from '@/data/benchmarks';

const MIN_DATA_POINTS = 3;

export function getAllScores(benchmarkId: string): number[] {
  const bm = benchmarks[benchmarkId];
  if (!bm) return [];
  const rs = results.filter(r => r.benchmarkId === benchmarkId && r.verified);
  return rs.map(r => r.score);
}

export function canNormalize(benchmarkId: string): boolean {
  return getAllScores(benchmarkId).length >= MIN_DATA_POINTS;
}

export function normalizeScore(score: number, allScores: number[]): number {
  if (allScores.length < 2) return 50;

  const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const variance = allScores.reduce((a, b) => a + (b - mean) * (b - mean), 0) / allScores.length;
  const stddev = Math.sqrt(variance);

  if (stddev < 0.5) return 50;

  const z = (score - mean) / stddev;

    const raw = 50 + z * 16.67;
    return Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
}

export function getBenchmarkScoresMap(): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const r of results) {
    if (!result[r.benchmarkId]) result[r.benchmarkId] = {};
    result[r.benchmarkId][r.modelId] = Math.max(r.score, result[r.benchmarkId][r.modelId] || 0);
  }
  return result;
}
