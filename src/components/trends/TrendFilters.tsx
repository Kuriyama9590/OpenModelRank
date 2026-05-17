'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/cn';
import { searchModels } from '@/lib/search';
import { getModel, getAllModels } from '@/data/models';
import { getUniqueProviders, METRIC_OPTIONS, type TrendMetric } from '@/lib/trends';
import type { Model } from '@/types';

interface TrendFiltersProps {
  selectedProviders: string[];
  onProvidersChange: (providers: string[]) => void;
  selectedModels: string[];
  onModelsChange: (ids: string[]) => void;
  metric: TrendMetric;
  onMetricChange: (metric: TrendMetric) => void;
  maxModels: number;
  onMaxModelsChange: (n: number) => void;
}

export function TrendFilters({
  selectedProviders,
  onProvidersChange,
  selectedModels,
  onModelsChange,
  metric,
  onMetricChange,
  maxModels,
  onMaxModelsChange,
}: TrendFiltersProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Model[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const providers = getUniqueProviders();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(val: string) {
    setQuery(val);
    if (val.trim()) {
      setSearchResults(searchModels(val).filter(m => !selectedModels.includes(m.id)));
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }

  function addModel(id: string) {
    if (selectedModels.includes(id)) return;
    onModelsChange([...selectedModels, id]);
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
  }

  function removeModel(id: string) {
    onModelsChange(selectedModels.filter(s => s !== id));
  }

  function toggleProvider(p: string) {
    if (selectedProviders.includes(p)) {
      onProvidersChange(selectedProviders.filter(x => x !== p));
    } else {
      onProvidersChange([...selectedProviders, p]);
    }
  }

  function selectAllProviders() {
    onProvidersChange([]);
  }

  return (
    <div className="space-y-4">
      {/* Metric selector */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-[var(--color-muted)] shrink-0">指标：</label>
        <select
          value={metric}
          onChange={e => onMetricChange(e.target.value as TrendMetric)}
          className={cn(
            'rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
            'py-2 px-3 text-sm text-[var(--color-foreground)]',
            'focus:outline-none focus:border-[var(--color-accent)]'
          )}
        >
          {METRIC_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <label className="text-sm text-[var(--color-muted)] ml-4 shrink-0">显示数量：</label>
        <select
          value={maxModels}
          onChange={e => onMaxModelsChange(Number(e.target.value))}
          className={cn(
            'rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
            'py-2 px-3 text-sm text-[var(--color-foreground)]',
            'focus:outline-none focus:border-[var(--color-accent)]'
          )}
        >
          {[5, 10, 15, 20, 30, 50].map(n => (
            <option key={n} value={n}>{n} 个</option>
          ))}
        </select>
      </div>

      {/* Provider filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--color-muted)]" />
          <span className="text-sm text-[var(--color-muted)]">厂商筛选：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={selectAllProviders}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              selectedProviders.length === 0
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
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
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
                )}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom model picker */}
      <div className="space-y-2">
        <span className="text-sm text-[var(--color-muted)]">自定义模型（可选，覆盖厂商筛选）：</span>
        <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
          {selectedModels.map(id => {
            const model = getModel(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: model?.providerColor }} />
                {model?.name ?? id}
                <button
                  onClick={() => removeModel(id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--color-accent)]/30 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
        <div ref={containerRef} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="搜索并添加模型..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => query.trim() && setShowResults(true)}
            className={cn(
              'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
              'py-2 pl-10 pr-4 text-sm text-[var(--color-foreground)]',
              'placeholder:text-[var(--color-muted)]',
              'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
              'transition-colors'
            )}
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden z-50">
              {searchResults.slice(0, 8).map(m => (
                <button
                  key={m.id}
                  onClick={() => addModel(m.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: m.providerColor }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-[var(--color-foreground)] truncate">{m.name}</span>
                    <span className="text-xs text-[var(--color-muted)]">{m.provider}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
