'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label,
} from 'recharts';
import { type ProviderTrendSeries, type TrendMetric } from '@/lib/trends';
import { CATEGORY_NAMES, type BenchmarkCategory } from '@/types';

interface ProviderTrendChartProps {
  data: ProviderTrendSeries[];
  metric: TrendMetric;
  showLegend: boolean;
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
  payload: Record<string, number | string | null> & { timestamp: number; dateLabel: string };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg text-xs space-y-1.5 min-w-[180px]">
      <div className="font-medium text-[var(--color-foreground)]">{label}</div>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--color-muted)]">{entry.name}</span>
          </div>
          <span className="text-[var(--color-foreground)] font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ProviderTrendChart({ data, metric, showLegend }: ProviderTrendChartProps) {
  const metricLabel = useMemo(() => {
    if (metric === 'composite') return '综合排名分';
    if (metric === 'aa-intelligence') return 'AA Intelligence Index';
    return CATEGORY_NAMES[metric as BenchmarkCategory] ?? metric;
  }, [metric]);

  // Build unified chart data with per-provider columns
  const { chartData } = useMemo(() => {
    if (data.length === 0) return { chartData: [], providerKeys: [] };

    // Collect all unique timestamps
    const allTimestamps = new Set<number>();
    const dateLabels = new Map<number, string>();
    for (const series of data) {
      for (const p of series.points) {
        allTimestamps.add(p.timestamp);
        dateLabels.set(p.timestamp, p.releaseDate);
      }
    }
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Build lookup: provider -> { timestamp -> score }
    const providerScoreMap = new Map<string, Map<number, number>>();
    for (const series of data) {
      const tsMap = new Map<number, number>();
      for (const p of series.points) {
        tsMap.set(p.timestamp, p.score);
      }
      providerScoreMap.set(series.provider, tsMap);
    }

    // Build unified data rows
    const rows = sortedTimestamps.map(ts => {
      const row: Record<string, number | string | null> = {
        timestamp: ts,
        dateLabel: dateLabels.get(ts) || '',
      };
      for (const series of data) {
        row[series.provider] = providerScoreMap.get(series.provider)?.get(ts) ?? null;
      }
      return row;
    });

    return { chartData: rows };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[var(--color-muted)] text-lg">暂无数据</p>
        <p className="text-[var(--color-muted)] text-sm mt-1">请调整筛选条件</p>
      </div>
    );
  }

  const xMin = chartData.length > 0 ? (chartData[0].timestamp as number) : 0;
  const xMax = chartData.length > 0 ? (chartData[chartData.length - 1].timestamp as number) : 0;
  const padding = (xMax - xMin) * 0.05 || 86400000 * 30;

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={480}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={[xMin - padding, xMax + padding]}
            tickFormatter={ts => {
              const d = new Date(ts as number);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          >
            <Label value="发布日期" position="bottom" offset={10} style={{ fill: 'var(--color-muted)', fontSize: 12 }} />
          </XAxis>
          <YAxis
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          >
            <Label value={metricLabel} angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--color-muted)', fontSize: 12 }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--color-muted)' }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {data.map(series => (
            <Line
              key={series.provider}
              type="linear"
              dataKey={series.provider}
              name={series.provider}
              stroke={series.providerColor}
              strokeWidth={2}
              dot={{ r: 5, fill: series.providerColor, strokeWidth: 0 }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: 'var(--color-background)' }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Provider model summary */}
      <div className="flex flex-wrap gap-2 justify-center">
        {data.map(series => (
          <span
            key={series.provider}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.providerColor }} />
            <span className="text-[var(--color-foreground)] font-medium">{series.provider}</span>
            <span className="text-[var(--color-muted)]">({series.points.length} 模型)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
