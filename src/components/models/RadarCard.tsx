'use client';

import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { getBenchmark } from '@/data/benchmarks';
import { getModel } from '@/data/models';
import type { BenchmarkCategory } from '@/types';
import { CATEGORY_NAMES } from '@/types';

interface RadarCardProps {
  modelId: string;
  benchmarkScores: Record<string, { score: number; rank: number; total: number } | null>;
}

const RADAR_CATEGORIES: BenchmarkCategory[] = [
  'coding', 'math', 'science', 'knowledge', 'agent', 'speed', 'value', 'longcontext'
];

export function RadarCard({ modelId, benchmarkScores }: RadarCardProps) {
  const chartData = useMemo(() => {
    const model = getModel(modelId);
    const categoryScores: Record<string, number[]> = {};

    for (const [bmId, bmScore] of Object.entries(benchmarkScores)) {
      if (!bmScore) continue;
      const bm = getBenchmark(bmId);
      if (!bm) continue;
      if (!categoryScores[bm.category]) categoryScores[bm.category] = [];
      const normalized = Math.min(100, Math.max(0, (bmScore.score / (bmScore.score + 50)) * 100));
      categoryScores[bm.category].push(normalized);
    }

    // Speed dimension from model.speedToks
    if (model?.speedToks) {
      categoryScores['speed'] = [Math.min(100, (model.speedToks / 200) * 100)];
    }
    // Value dimension from AA Index / price
    if (model?.priceBlended && model.priceBlended > 0) {
      const aaScore = benchmarkScores['aa-intelligence']?.score;
      if (aaScore) {
        categoryScores['value'] = [Math.min(100, (aaScore / model.priceBlended) * 5)];
      }
    }
    // Long context from AA-LCR + context window
    const lcrScore = benchmarkScores['aa-lcr']?.score;
    if (lcrScore !== undefined && lcrScore !== null) {
      categoryScores['longcontext'] = [lcrScore];
    } else if (model && model.contextWindow > 0) {
      categoryScores['longcontext'] = [Math.min(100, (model.contextWindow / 1000000) * 100)];
    }

    const result: { category: string; score: number }[] = [];
    for (const cat of RADAR_CATEGORIES) {
      const scores = categoryScores[cat];
      if (scores && scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        result.push({
          category: CATEGORY_NAMES[cat] || cat,
          score: Math.round(avg),
        });
      }
    }
    return result;
  }, [modelId, benchmarkScores]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">能力雷达图</h3>
        <p className="text-sm text-[var(--color-muted)] text-center py-8">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">能力雷达图</h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={22.5}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-muted)', fontSize: 9 }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
