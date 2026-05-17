'use client';

import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/cn';
import { RADAR_4D_DIMENSIONS, type Radar4DEntry } from '@/lib/trends';

interface QuadrantRadarChartProps {
  data: Radar4DEntry[];
  showLabels: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: Radar4DEntry }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg text-xs space-y-1.5 min-w-[160px]">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.providerColor }} />
        <span className="font-semibold text-[var(--color-foreground)]">{d.modelName}</span>
      </div>
      <div className="text-[var(--color-muted)]">{d.provider}</div>
      <div className="pt-1 space-y-0.5">
        <div className="flex justify-between"><span className="text-[var(--color-muted)]">综合能力</span><span className="text-[var(--color-foreground)] font-medium">{d.capability}</span></div>
        <div className="flex justify-between"><span className="text-[var(--color-muted)]">性价比</span><span className="text-[var(--color-foreground)] font-medium">{d.value}</span></div>
        <div className="flex justify-between"><span className="text-[var(--color-muted)]">输出速度</span><span className="text-[var(--color-foreground)] font-medium">{d.speed}</span></div>
        <div className="flex justify-between"><span className="text-[var(--color-muted)]">长上下文</span><span className="text-[var(--color-foreground)] font-medium">{d.context}</span></div>
      </div>
      {d.isOpenSource && (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-success)]/15 text-[var(--color-success)] mt-1">
          开源
        </span>
      )}
    </div>
  );
}

interface RadarChartDataPoint {
  dimension: string;
  [modelKey: string]: number | string;
}

export function QuadrantRadarChart({ data, showLabels }: QuadrantRadarChartProps) {
  const [compareModels, setCompareModels] = useState<string[]>([]);

  if (data.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[var(--color-muted)] text-lg">数据不足</p>
        <p className="text-[var(--color-muted)] text-sm mt-1">需要至少 3 个具有完整数据的模型</p>
      </div>
    );
  }

  // Build radar chart data: each row is a dimension, each column is a model
  const radarData: RadarChartDataPoint[] = RADAR_4D_DIMENSIONS.map(dim => {
    const point: RadarChartDataPoint = { dimension: dim.label };
    for (const d of data) {
      point[d.modelId] = d[dim.key as keyof Radar4DEntry] as number;
    }
    return point;
  });

  const modelsInView = compareModels.length > 0 ? compareModels : data.slice(0, 5).map(d => d.modelId);
  const modelMap = new Map(data.map(d => [d.modelId, d]));

  function toggleModel(id: string) {
    if (compareModels.includes(id)) {
      setCompareModels(compareModels.filter(x => x !== id));
    } else if (compareModels.length < 8) {
      setCompareModels([...compareModels, id]);
    }
  }

  return (
    <div className="space-y-5">
      {/* Model selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">对比模型：</span>
          <button
            onClick={() => setCompareModels([])}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              compareModels.length === 0
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
            )}
          >
            Top 5 默认
          </button>
          {compareModels.map(id => {
            const d = modelMap.get(id);
            if (!d) return null;
            return (
              <button
                key={id}
                onClick={() => toggleModel(id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                  'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                )}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.providerColor }} />
                {d.modelName}
              </button>
            );
          })}
        </div>

        {/* Available models to add */}
        {compareModels.length < 8 && (
          <div className="flex flex-wrap gap-2">
            {data
              .filter(d => !compareModels.includes(d.modelId))
              .slice(0, 12)
              .map(d => (
                <button
                  key={d.modelId}
                  onClick={() => toggleModel(d.modelId)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)] transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: d.providerColor }} />
                  {d.modelName}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Radar chart */}
      <ResponsiveContainer width="100%" height={480}>
        <RadarChart data={radarData} margin={{ top: 10, right: 60, bottom: 10, left: 60 }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {modelsInView.map((id) => {
            const d = modelMap.get(id);
            if (!d) return null;
            return (
              <Radar
                key={id}
                dataKey={id}
                stroke={d.providerColor}
                fill={d.providerColor}
                fillOpacity={0.08}
                strokeWidth={2}
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>

      {/* Model labels */}
      {showLabels && (
        <div className="flex flex-wrap gap-2 justify-center">
          {modelsInView.map(id => {
            const d = modelMap.get(id);
            if (!d) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.providerColor }} />
                <span className="text-[var(--color-foreground)]">{d.modelName}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Dimension explanation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs text-[var(--color-muted)]">
        {RADAR_4D_DIMENSIONS.map(dim => (
          <div key={dim.key} className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] py-2 px-3">
            <span className="font-medium text-[var(--color-foreground)]">{dim.label}</span>
            <p className="mt-0.5 text-[10px]">
              {dim.key === 'capability' && 'AA Intelligence Index 归一'}
              {dim.key === 'value' && '能力/价格比 归一'}
              {dim.key === 'speed' && '输出 tok/s 归一'}
              {dim.key === 'context' && '上下文窗口 归一'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
