'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { getModel } from '@/data/models';
import { getAllBenchmarks } from '@/data/benchmarks';
import { getModelBenchmarkScores } from '@/lib/rankings';

interface CompareTableProps {
  modelIds: string[];
}

export function CompareTable({ modelIds }: CompareTableProps) {
  const benchmarks = useMemo(() => getAllBenchmarks(), []);
  const models = useMemo(() => modelIds.map((id) => getModel(id)).filter(Boolean), [modelIds]);

  const scoresMap = useMemo(() => {
    const map: Record<string, Record<string, { score: number; rank: number; total: number } | null>> = {};
    for (const id of modelIds) {
      map[id] = getModelBenchmarkScores(id);
    }
    return map;
  }, [modelIds]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  评测集
                </span>
              </th>
              {models.map((m) => (
                <th key={m!.id} className="px-4 py-3 text-center">
                  <Link
                    href={`/models/${m!.id}`}
                    className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors hover:no-underline"
                  >
                    {m!.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {benchmarks.map((bm) => {
              const allScores = modelIds
                .map((id) => scoresMap[id]?.[bm.id])
                .filter((s): s is { score: number; rank: number; total: number } => s !== null && s !== undefined);
              const bestScore = allScores.length > 0
                ? bm.higherIsBetter
                  ? Math.max(...allScores.map((s) => s.score))
                  : Math.min(...allScores.map((s) => s.score))
                : null;

              return (
                <tr
                  key={bm.id}
                  className="hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/benchmarks/${bm.id}`}
                      className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors hover:no-underline"
                    >
                      {bm.name}
                    </Link>
                  </td>
                  {modelIds.map((id) => {
                    const s = scoresMap[id]?.[bm.id];
                    const isBest = s !== null && s !== undefined && bestScore !== null && s.score === bestScore;
                    return (
                      <td key={id} className="px-4 py-3 text-center">
                        {s ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={cn(
                                'text-sm font-semibold tabular-nums',
                                isBest
                                  ? 'text-[var(--color-accent)]'
                                  : 'text-[var(--color-foreground)]'
                              )}
                            >
                              {s.score}
                            </span>
                            <span className="text-[10px] text-[var(--color-muted)] tabular-nums">
                              第{s.rank}/共{s.total}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--color-muted)]">--</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
