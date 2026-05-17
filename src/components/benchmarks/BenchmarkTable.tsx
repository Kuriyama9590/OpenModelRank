'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { getModel } from '@/data/models';
import { getResultsByBenchmark } from '@/data/results';

interface BenchmarkTableProps {
  benchmarkId: string;
}

type SortKey = 'rank' | 'name' | 'score' | 'date';

function SortIcon({ sortKey, columnKey, sortDir }: { sortKey: SortKey; columnKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== columnKey)
    return <span className="text-[var(--color-muted)] opacity-30 ml-1">&uarr;&darr;</span>;
  return sortDir === 'asc' ? (
    <ChevronUp className="inline h-3 w-3 text-[var(--color-accent)] ml-1" />
  ) : (
    <ChevronDown className="inline h-3 w-3 text-[var(--color-accent)] ml-1" />
  );
}

export function BenchmarkTable({ benchmarkId }: BenchmarkTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rawResults = getResultsByBenchmark(benchmarkId);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'score' ? 'desc' : 'asc');
    }
  }

  const sorted = useMemo(() => {
    const items = rawResults.map((r, idx) => ({ ...r, _idx: idx }));
    items.sort((a, b) => {
      const modelA = getModel(a.modelId);
      const modelB = getModel(b.modelId);
      let cmp = 0;
      switch (sortKey) {
        case 'rank':
          cmp = a.score - b.score;
          break;
        case 'name':
          cmp = (modelA?.name ?? a.modelId).localeCompare(modelB?.name ?? b.modelId);
          break;
        case 'score':
          cmp = a.score - b.score;
          break;
        case 'date':
          cmp = a.date.localeCompare(b.date);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [rawResults, sortKey, sortDir]);

  if (rawResults.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-8 text-center text-[var(--color-muted)] text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left">
                <button
                  className="flex items-center gap-1 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-foreground)] transition-colors"
                  onClick={() => handleSort('rank')}
                >
                  # <SortIcon sortKey={sortKey} columnKey="rank" sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  className="flex items-center gap-1 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-foreground)] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  模型 <SortIcon sortKey={sortKey} columnKey="name" sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <button
                  className="flex items-center gap-1 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-foreground)] transition-colors mx-auto"
                  onClick={() => handleSort('score')}
                >
                  Score <SortIcon sortKey={sortKey} columnKey="score" sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <button
                  className="flex items-center gap-1 text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-foreground)] transition-colors mx-auto"
                  onClick={() => handleSort('date')}
                >
                  Date <SortIcon sortKey={sortKey} columnKey="date" sortDir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  Scaffold
                </span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  Verified
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {sorted.map((r, idx) => {
              const model = getModel(r.modelId);
              return (
                <tr
                  key={`${r.modelId}-${r.date}-${r._idx}`}
                  className="hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <td className="px-4 py-3 text-sm tabular-nums text-[var(--color-muted)]">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/models/${r.modelId}`}
                        className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-accent)] truncate transition-colors hover:no-underline"
                      >
                        {model?.name ?? r.modelId}
                      </Link>
                      {model && (
                        <span
                          className="shrink-0 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-none"
                          style={{
                            backgroundColor: model.providerColor + '20',
                            color: model.providerColor,
                          }}
                        >
                          {model.provider}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 score-bar max-w-[80px]">
                        <div
                          className="score-bar-fill bg-[var(--color-accent)]"
                          style={{ width: `${Math.min(100, Math.max(0, r.score))}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-[var(--color-foreground)] min-w-[40px] text-right">
                        {r.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm tabular-nums text-[var(--color-muted)]">
                    {r.date}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-[var(--color-muted)]">
                    {r.scaffold ? (
                      <span className="text-xs">{r.scaffold}</span>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.verified ? (
                      <CheckCircle className="inline h-4 w-4 text-[var(--color-success)]" />
                    ) : (
                      <AlertTriangle className="inline h-4 w-4 text-[var(--color-warning)]" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
