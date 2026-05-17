'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from 'recharts';
import { type TrendPoint, type TrendMetric } from '@/lib/trends';
import { CATEGORY_NAMES, type BenchmarkCategory } from '@/types';

interface TrendChartProps {
  data: TrendPoint[];
  metric: TrendMetric;
}

interface TooltipPayloadItem {
  payload: TrendPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg text-xs space-y-1">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.providerColor }} />
        <span className="font-semibold text-[var(--color-foreground)]">{d.modelName}</span>
      </div>
      <div className="text-[var(--color-muted)]">{d.provider} · {d.releaseDate}</div>
      <div className="text-[var(--color-foreground)] font-medium">
        分数：{d.score}
      </div>
      {d.isOpenSource && (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-success)]/15 text-[var(--color-success)]">
          开源
        </span>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={payload.providerColor}
      fillOpacity={0.85}
      stroke={payload.providerColor}
      strokeWidth={1.5}
      strokeOpacity={0.4}
    />
  );
}

export function TrendChart({ data, metric }: TrendChartProps) {
  const metricLabel = useMemo(() => {
    if (metric === 'composite') return '综合排名分';
    if (metric === 'aa-intelligence') return 'AA Intelligence Index';
    return CATEGORY_NAMES[metric as BenchmarkCategory] ?? metric;
  }, [metric]);

  // Group data by provider for legend
  const providers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of data) {
      if (!seen.has(d.provider)) seen.set(d.provider, d.providerColor);
    }
    return Array.from(seen.entries());
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[var(--color-muted)] text-lg">暂无数据</p>
        <p className="text-[var(--color-muted)] text-sm mt-1">请调整筛选条件</p>
      </div>
    );
  }

  // Build chart data with numeric x (timestamp)
  const chartData = data.map(d => ({
    ...d,
    x: new Date(d.releaseDate + '-01').getTime(),
    y: d.score,
  }));

  const xMin = Math.min(...chartData.map(d => d.x));
  const xMax = Math.max(...chartData.map(d => d.x));
  const padding = (xMax - xMin) * 0.05 || 86400000 * 30;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {providers.map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {name}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={480}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[xMin - padding, xMax + padding]}
            tickFormatter={ts => {
              const d = new Date(ts);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          >
            <Label value="发布日期" position="bottom" offset={10} style={{ fill: 'var(--color-muted)', fontSize: 12 }} />
          </XAxis>
          <YAxis
            dataKey="y"
            type="number"
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          >
            <Label value={metricLabel} angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--color-muted)', fontSize: 12 }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={chartData} shape={<ScatterDot />}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.providerColor} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
