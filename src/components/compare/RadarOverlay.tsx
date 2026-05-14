'use client';

import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getModel } from '@/data/models';
import { getBenchmark } from '@/data/benchmarks';
import { getModelBenchmarkScores } from '@/lib/rankings';
import type { BenchmarkCategory } from '@/types';
import { CATEGORY_NAMES } from '@/types';

interface RadarOverlayProps {
  modelIds: string[];
}

const RADAR_CATEGORIES: BenchmarkCategory[] = [
  'coding', 'math', 'science', 'knowledge', 'agent', 'speed', 'value', 'longcontext'
];

const MODEL_PALETTE = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
];

export function RadarOverlay({ modelIds }: RadarOverlayProps) {
  const chartData = useMemo(() => {
    const categoryDataMap: Record<string, Record<string, number[]>> = {};
    for (const id of modelIds) {
      categoryDataMap[id] = {};
      const model = getModel(id);
      const scores = getModelBenchmarkScores(id);
      for (const [bmId, bmScore] of Object.entries(scores)) {
        if (!bmScore) continue;
        const bm = getBenchmark(bmId);
        if (!bm) continue;
        if (!categoryDataMap[id][bm.category]) categoryDataMap[id][bm.category] = [];
        const normalized = Math.min(100, Math.max(0, (bmScore.score / (bmScore.score + 50)) * 100));
        categoryDataMap[id][bm.category].push(normalized);
      }
      // Speed
      if (model?.speedToks) {
        categoryDataMap[id]['speed'] = [Math.min(100, (model.speedToks / 200) * 100)];
      }
      // Value
      if (model?.priceBlended && model.priceBlended > 0) {
        const aaScore = scores['aa-intelligence']?.score;
        if (aaScore) {
          categoryDataMap[id]['value'] = [Math.min(100, (aaScore / model.priceBlended) * 5)];
        }
      }
      // Long context
      const lcrScore = scores['aa-lcr']?.score;
      if (lcrScore !== undefined && lcrScore !== null) {
        categoryDataMap[id]['longcontext'] = [lcrScore];
      } else if (model && model.contextWindow > 0) {
        categoryDataMap[id]['longcontext'] = [Math.min(100, (model.contextWindow / 1000000) * 100)];
      }
    }

    const result: Record<string, string | number>[] = [];
    for (const cat of RADAR_CATEGORIES) {
      const entry: Record<string, string | number> = {
        category: CATEGORY_NAMES[cat] || cat,
      };
      let hasAny = false;
      for (const id of modelIds) {
        const scores = categoryDataMap[id]?.[cat];
        if (scores && scores.length > 0) {
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          entry[id] = avg;
          hasAny = true;
        } else {
          entry[id] = 0;
        }
      }
      if (hasAny) result.push(entry);
    }
    return { data: result, models: modelIds.map((id) => getModel(id)).filter(Boolean) };
  }, [modelIds]);

  if (chartData.models.length === 0 || chartData.data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">能力雷达对比</h3>
        <p className="text-sm text-[var(--color-muted)] text-center py-8">请选择至少一个模型进行对比</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">能力雷达对比</h3>
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={chartData.data} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          {chartData.models.map((m, idx) => (
            <Radar
              key={m!.id}
              name={m!.name}
              dataKey={m!.id}
              stroke={MODEL_PALETTE[idx % MODEL_PALETTE.length]}
              fill={MODEL_PALETTE[idx % MODEL_PALETTE.length]}
              fillOpacity={0.08}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
            iconSize={8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
