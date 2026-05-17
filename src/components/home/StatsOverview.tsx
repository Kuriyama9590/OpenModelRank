'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { models } from '@/data/models';
import { computeCompositeRankings } from '@/lib/rankings';
import { getModel } from '@/data/models';

interface StatsOverviewProps {
  modelCount: number;
  benchmarkCount: number;
}

export function StatsOverview({ modelCount, benchmarkCount }: StatsOverviewProps) {
  const topModels = useMemo(() => {
    const rankings = computeCompositeRankings();
    return rankings.slice(0, 8).map(r => {
      const model = getModel(r.modelId);
      return {
        name: model?.name || r.modelId,
        score: r.total,
        provider: model?.provider || '',
        providerColor: model?.providerColor || '#6b7280',
        rank: r.rank,
      };
    });
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '评测模型', value: modelCount, suffix: '个', icon: '🤖' },
          { label: '评测基准', value: benchmarkCount, suffix: '项', icon: '📊' },
          { label: '数据条目', value: '500+', suffix: '', icon: '📈' },
          { label: '更新日期', value: '2026.05', suffix: '', icon: '🔄' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="stat-card rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)]/30"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="text-xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-[var(--color-foreground)] tabular-nums">
              {stat.value}{stat.suffix}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Top models bar chart */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">综合排名 Top 8</h3>
            <p className="text-xs text-[var(--color-muted)] mt-1">基于多维度 Benchmark 加权评分</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
            综合分 (0-100)
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topModels} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: 'var(--color-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--color-foreground)' }}
                itemStyle={{ color: 'var(--color-muted)' }}
                formatter={(value, _name, props) => [
                  `${value} 分 · 第${(props.payload as { rank?: number }).rank ?? ''}名`,
                  (props.payload as { provider?: string }).provider ?? '',
                ]}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                {topModels.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'var(--color-accent)'}
                    fillOpacity={1 - index * 0.08}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
