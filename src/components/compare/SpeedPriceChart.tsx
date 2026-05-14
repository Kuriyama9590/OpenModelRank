'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getModel } from '@/data/models';
import { models } from '@/data/models';

interface SpeedPriceProps {
  modelIds: string[];
  metric: 'speed' | 'price' | 'latency' | 'context';
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const METRICS = {
  speed: { key: 'speedToks' as const, label: 'Output Speed (tok/s)', unit: ' tok/s', higherBetter: true },
  price: { key: 'priceBlended' as const, label: 'Blended Price ($/M)', unit: ' $/M', higherBetter: false },
  latency: { key: 'latencyTTFT' as const, label: 'Latency TTFT (s)', unit: 's', higherBetter: false },
  context: { key: 'contextWindow' as const, label: 'Context Window (K)', unit: 'K', higherBetter: true },
};

export function SpeedPriceChart({ modelIds, metric }: SpeedPriceProps) {
  const config = METRICS[metric];
  const data = modelIds
    .map((id, idx) => {
      const model = models[id];
      if (!model) return null;
      const raw = model[config.key];
      let val = raw ?? 0;
      if (metric === 'context') val = Math.round(val / 1000);
      return { name: model.name.slice(0, 18), value: val, color: COLORS[idx % COLORS.length], raw };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && d.raw !== undefined);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-muted)]">
        暂无{config.label}数据
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">{config.label}</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50 + 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 100, right: 30, top: 5, bottom: 5 }}>
          <CartesianGrid stroke="var(--color-border)" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: 'var(--color-foreground)', fontSize: 11 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: unknown) => [`${value}${config.unit}`, config.label]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
