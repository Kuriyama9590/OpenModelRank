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
  ReferenceLine,
  Label,
} from 'recharts';
import type { ScatterPoint } from '@/lib/trends';

interface PriceCapabilityChartProps {
  data: ScatterPoint[];
  showLabels: boolean;
}

interface TooltipPayloadItem {
  payload: ScatterPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.providerColor }} />
        <span className="font-semibold text-[var(--color-foreground)]">{d.modelName}</span>
      </div>
      <div className="text-[var(--color-muted)]">{d.provider}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
        <span className="text-[var(--color-muted)]">能力分数</span>
        <span className="text-[var(--color-foreground)] font-medium text-right">{d.score}</span>
        <span className="text-[var(--color-muted)]">混合价格</span>
        <span className="text-[var(--color-foreground)] font-medium text-right">${d.price}/M</span>
        <span className="text-[var(--color-muted)]">上下文窗口</span>
        <span className="text-[var(--color-foreground)] font-medium text-right">{(d.contextWindow / 1000).toFixed(0)}K</span>
        {d.speedToks > 0 && (
          <>
            <span className="text-[var(--color-muted)]">输出速度</span>
            <span className="text-[var(--color-foreground)] font-medium text-right">{d.speedToks} tok/s</span>
          </>
        )}
      </div>
      {d.isOpenSource && (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-success)]/15 text-[var(--color-success)] mt-1">
          开源
        </span>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BubbleDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  // Scale context window to radius: 128K->5, 1M->14
  const r = Math.max(5, Math.min(14, 5 + (Math.log2(payload.contextWindow / 128000)) * 3));
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={payload.providerColor}
        fillOpacity={0.7}
        stroke={payload.providerColor}
        strokeWidth={1.5}
        strokeOpacity={0.3}
      />
    </g>
  );
}

export function PriceCapabilityChart({ data, showLabels }: PriceCapabilityChartProps) {
  const { xMedian, yMedian } = useMemo(() => {
    if (data.length === 0) return { xMedian: 0, yMedian: 0 };
    const prices = data.map(d => d.price).sort((a, b) => a - b);
    const scores = data.map(d => d.score).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    return {
      xMedian: prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid],
      yMedian: scores.length % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid],
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[var(--color-muted)] text-lg">暂无数据</p>
        <p className="text-[var(--color-muted)] text-sm mt-1">需要同时具备价格和 AA Intelligence 分数的模型</p>
      </div>
    );
  }

  const xDomain = [0, Math.max(...data.map(d => d.price)) * 1.15];
  const yMin = Math.max(0, Math.min(...data.map(d => d.score)) - 5);
  const yMax = Math.min(100, Math.max(...data.map(d => d.score)) + 5);

  return (
    <div className="space-y-4">
      {/* Quadrant labels */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs text-[var(--color-muted)] px-4">
        <div className="rounded-lg bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 py-2 px-3">
          <span className="font-medium text-[var(--color-success)]">高性价比区</span>
          <br />低价高能力
        </div>
        <div className="rounded-lg bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 py-2 px-3">
          <span className="font-medium text-[var(--color-accent)]">旗舰区</span>
          <br />高价高能力
        </div>
        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] py-2 px-3">
          <span className="text-[var(--color-muted)]">经济区</span>
          <br />低价低能力
        </div>
        <div className="rounded-lg bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 py-2 px-3">
          <span className="font-medium text-[var(--color-danger)]">低性价比区</span>
          <br />高价低能力
        </div>
      </div>

      {/* Size legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-[var(--color-muted)]">
        <span>气泡大小 = 上下文窗口</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-muted)]/40" />
          <span>128K</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-5 rounded-full bg-[var(--color-muted)]/40" />
          <span>512K</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-7 h-7 rounded-full bg-[var(--color-muted)]/40" />
          <span>1M</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={520}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="price"
            type="number"
            domain={xDomain}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            tickFormatter={v => `$${v}`}
          >
            <Label value="混合价格 ($/M tokens)" position="bottom" offset={10} style={{ fill: 'var(--color-muted)', fontSize: 12 }} />
          </XAxis>
          <YAxis
            dataKey="score"
            type="number"
            domain={[yMin, yMax]}
            tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
          >
            <Label value="AA Intelligence Index" angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--color-muted)', fontSize: 12 }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Quadrant divider lines */}
          <ReferenceLine
            x={xMedian}
            stroke="var(--color-muted)"
            strokeDasharray="6 4"
            strokeOpacity={0.4}
          />
          <ReferenceLine
            y={yMedian}
            stroke="var(--color-muted)"
            strokeDasharray="6 4"
            strokeOpacity={0.4}
          />

          <Scatter data={data} shape={<BubbleDot />}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.providerColor} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Model labels below chart */}
      {showLabels && (
        <div className="flex flex-wrap gap-2 justify-center">
          {data.map(d => (
            <span
              key={d.modelId}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.providerColor }} />
              <span className="text-[var(--color-foreground)]">{d.modelName}</span>
              <span className="text-[var(--color-muted)]">${d.price}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
