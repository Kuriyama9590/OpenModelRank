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
import { computeModelRadarData, computeCategoryMaxScores } from '@/lib/radar';

interface RadarCardProps {
  modelId: string;
  benchmarkScores: Record<string, { score: number; rank: number; total: number } | null>;
}

export function RadarCard({ modelId, benchmarkScores }: RadarCardProps) {
  const chartData = useMemo(() => {
    const maxScores = computeCategoryMaxScores();
    return computeModelRadarData(modelId, benchmarkScores, maxScores);
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
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 gradient-card">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">能力雷达图</h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="var(--color-border)" strokeDasharray="3 3" />
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
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
