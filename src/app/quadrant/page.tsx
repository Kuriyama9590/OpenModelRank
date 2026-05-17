'use client';

import { useState, useMemo } from 'react';
import { Target, BarChart3, Radar } from 'lucide-react';
import { getScatterData, getUniqueProviders, getQuadrantRadarData } from '@/lib/trends';
import { getAllModels } from '@/data/models';
import { PriceCapabilityChart } from '@/components/quadrant/PriceCapabilityChart';
import { QuadrantRadarChart } from '@/components/quadrant/QuadrantRadarChart';
import { cn } from '@/lib/cn';

type ViewMode = 'scatter' | 'radar';

export default function QuadrantPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('scatter');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const [showOpenSource, setShowOpenSource] = useState<boolean | null>(null);
  const providers = getUniqueProviders();

  const scatterData = useMemo(() => {
    let data = getScatterData();
    if (selectedProviders.length > 0) {
      data = data.filter(d => selectedProviders.includes(d.provider));
    }
    if (showOpenSource === true) {
      data = data.filter(d => d.isOpenSource);
    } else if (showOpenSource === false) {
      data = data.filter(d => !d.isOpenSource);
    }
    return data;
  }, [selectedProviders, showOpenSource]);

  const radarData = useMemo(() => {
    let data = getQuadrantRadarData();
    if (selectedProviders.length > 0) {
      data = data.filter(d => selectedProviders.includes(d.provider));
    }
    if (showOpenSource === true) {
      data = data.filter(d => d.isOpenSource);
    } else if (showOpenSource === false) {
      data = data.filter(d => !d.isOpenSource);
    }
    return data;
  }, [selectedProviders, showOpenSource]);

  function toggleProvider(p: string) {
    if (selectedProviders.includes(p)) {
      setSelectedProviders(selectedProviders.filter(x => x !== p));
    } else {
      setSelectedProviders([...selectedProviders, p]);
    }
  }

  return (
    <div className="space-y-6">
      <section className="gradient-hero rounded-2xl py-8 px-6 text-center space-y-3 animate-fade-in">
        <div className="inline-flex items-center gap-2 text-[var(--color-accent)]">
          {viewMode === 'scatter' ? <Target className="h-6 w-6" /> : <Radar className="h-6 w-6" />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
          成本 × 能力分析
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-lg mx-auto">
          {viewMode === 'scatter'
            ? 'X轴 = 混合价格，Y轴 = AA Intelligence 综合能力，气泡大小 = 上下文窗口长度'
            : '四维雷达图：综合能力、性价比、输出速度、长上下文，全面对比模型'}
        </p>
      </section>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
        {/* View toggle */}
        <div className="flex items-center gap-2 pb-4 border-b border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-muted)] mr-2">视图：</span>
          <button
            onClick={() => setViewMode('scatter')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              viewMode === 'scatter'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            四象限散点图
          </button>
          <button
            onClick={() => setViewMode('radar')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              viewMode === 'radar'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
            )}
          >
            <Radar className="h-3.5 w-3.5" />
            四维雷达图
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">厂商：</span>
            <button
              onClick={() => setSelectedProviders([])}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                selectedProviders.length === 0
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                  : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
              )}
            >
              全部
            </button>
            {providers.map(p => {
              const allOfProvider = getAllModels().filter(m => m.provider === p);
              const color = allOfProvider[0]?.providerColor ?? '#888';
              const active = selectedProviders.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => toggleProvider(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                    active
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                      : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
                  )}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {p}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">类型：</span>
            <button
              onClick={() => setShowOpenSource(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showOpenSource === null
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                  : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
              )}
            >
              全部
            </button>
            <button
              onClick={() => setShowOpenSource(showOpenSource === true ? null : true)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showOpenSource === true
                  ? 'bg-[var(--color-success)] text-white'
                  : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
              )}
            >
              开源
            </button>
            <button
              onClick={() => setShowOpenSource(showOpenSource === false ? null : false)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                showOpenSource === false
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                  : 'bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
              )}
            >
              闭源
            </button>

            <label className="flex items-center gap-2 ml-auto text-xs text-[var(--color-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={e => setShowLabels(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              显示标签
            </label>
          </div>
        </div>

        {viewMode === 'scatter' ? (
          <PriceCapabilityChart data={scatterData} showLabels={showLabels} />
        ) : (
          <QuadrantRadarChart data={radarData} showLabels={showLabels} />
        )}
      </div>

      {/* Data table */}
      {(viewMode === 'scatter' ? scatterData : radarData).length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
              模型详情 ({(viewMode === 'scatter' ? scatterData : radarData).length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {viewMode === 'scatter' ? (
                <>
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted)]">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted)]">模型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted)]">厂商</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">能力分数</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">价格 ($/M)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">上下文</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">性价比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scatterData
                      .sort((a, b) => (b.score / b.price) - (a.score / a.price))
                      .map((d, i) => (
                        <tr key={d.modelId} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="px-4 py-3 text-[var(--color-muted)]">{i + 1}</td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-[var(--color-muted)]">{d.provider}</td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-foreground)]">{d.score}</td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-foreground)]">${d.price}</td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-muted)]">{(d.contextWindow / 1000).toFixed(0)}K</td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-[var(--color-accent)]">
                            {(d.score / d.price).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted)]">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted)]">模型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-muted)]">厂商</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">综合能力</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">性价比</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">输出速度</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-muted)]">长上下文</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radarData
                      .sort((a, b) => b.capability - a.capability)
                      .map((d, i) => (
                        <tr key={d.modelId} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="px-4 py-3 text-[var(--color-muted)]">{i + 1}</td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-[var(--color-muted)]">{d.provider}</td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-foreground)]">{d.capability}</td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-foreground)]">{d.value}</td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-foreground)]">{d.speed}</td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-foreground)]">{d.context}</td>
                        </tr>
                      ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
