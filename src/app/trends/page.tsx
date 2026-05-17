'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, ScatterChart, LineChart } from 'lucide-react';
import { getTrendData, getProviderTrendSeries, type TrendMetric } from '@/lib/trends';
import { getAllModels } from '@/data/models';
import { TrendFilters } from '@/components/trends/TrendFilters';
import { TrendChart } from '@/components/trends/TrendChart';
import { ProviderTrendChart } from '@/components/trends/ProviderTrendChart';
import { cn } from '@/lib/cn';

type ChartMode = 'line' | 'scatter';

export default function TrendsPage() {
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [metric, setMetric] = useState<TrendMetric>('aa-intelligence');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [maxModels, setMaxModels] = useState(20);

  const trendData = useMemo(() => {
    if (selectedModels.length > 0) {
      return getTrendData(metric, selectedModels);
    }
    let modelIds: string[] | undefined;
    if (selectedProviders.length > 0) {
      modelIds = getAllModels()
        .filter(m => selectedProviders.includes(m.provider))
        .map(m => m.id);
    }
    const allData = getTrendData(metric, modelIds);
    if (allData.length > maxModels) {
      return allData.slice(-maxModels);
    }
    return allData;
  }, [metric, selectedProviders, selectedModels, maxModels]);

  const providerSeries = useMemo(() => {
    let series = getProviderTrendSeries(metric);
    if (selectedProviders.length > 0) {
      series = series.filter(s => selectedProviders.includes(s.provider));
    }
    if (selectedModels.length > 0) {
      const modelSet = new Set(selectedModels);
      series = series.map(s => ({
        ...s,
        points: s.points.filter(p => modelSet.has(p.modelId)),
      })).filter(s => s.points.length > 0);
    }
    return series;
  }, [metric, selectedProviders, selectedModels]);

  return (
    <div className="space-y-6">
      <section className="gradient-hero rounded-2xl py-8 px-6 text-center space-y-3 animate-fade-in">
        <div className="inline-flex items-center gap-2 text-[var(--color-accent)]">
          <TrendingUp className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
          模型能力趋势
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-lg mx-auto">
          {chartMode === 'line'
            ? '各厂商模型能力随时间演进折线图，同厂商模型以直线连接显示增长轨迹'
            : '按模型发布日期展示各厂商能力分布，支持自定义指标和筛选'}
        </p>
      </section>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-6">
        {/* View toggle */}
        <div className="flex items-center gap-2 pb-4 border-b border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-muted)] mr-2">视图：</span>
          <button
            onClick={() => setChartMode('line')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              chartMode === 'line'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
            )}
          >
            <LineChart className="h-3.5 w-3.5" />
            厂商趋势折线图
          </button>
          <button
            onClick={() => setChartMode('scatter')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              chartMode === 'scatter'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
            )}
          >
            <ScatterChart className="h-3.5 w-3.5" />
            模型散点图
          </button>
        </div>

        <TrendFilters
          selectedProviders={selectedProviders}
          onProvidersChange={setSelectedProviders}
          selectedModels={selectedModels}
          onModelsChange={setSelectedModels}
          metric={metric}
          onMetricChange={setMetric}
          maxModels={maxModels}
          onMaxModelsChange={setMaxModels}
        />

        <div className="pt-2">
          {chartMode === 'line' ? (
            <ProviderTrendChart data={providerSeries} metric={metric} showLegend={selectedProviders.length > 0 || selectedProviders.length === 0} />
          ) : (
            <TrendChart data={trendData} metric={metric} />
          )}
        </div>
      </div>

      {/* Model list table */}
      {trendData.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              模型列表 ({trendData.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)]">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)]">模型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)]">厂商</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)]">发布日期</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-muted)]">分数</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((d, i) => (
                  <tr key={d.modelId} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-6 py-3 text-[var(--color-muted)]">{i + 1}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.providerColor }} />
                        <span className="text-[var(--color-foreground)] font-medium">{d.modelName}</span>
                        {d.isOpenSource && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-success)]/15 text-[var(--color-success)]">
                            开源
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[var(--color-muted)]">{d.provider}</td>
                    <td className="px-6 py-3 text-[var(--color-muted)] font-mono text-xs">{d.releaseDate}</td>
                    <td className="px-6 py-3 text-right font-mono font-medium text-[var(--color-foreground)]">{d.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
