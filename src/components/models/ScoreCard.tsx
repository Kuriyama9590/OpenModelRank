'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { getBenchmark } from '@/data/benchmarks';

interface ScoreCardProps {
  benchmarkId: string;
  score: { score: number; rank: number; total: number } | null;
}

export function ScoreCard({ benchmarkId, score }: ScoreCardProps) {
  const bm = getBenchmark(benchmarkId);

  if (!bm) return null;

  const hasScore = score !== null;

  const scoreColor = hasScore
    ? score.score >= 80
      ? 'text-[var(--color-success)]'
      : score.score >= 50
        ? 'text-[var(--color-warning)]'
        : 'text-[var(--color-muted)]'
    : '';

  return (
    <Link
      href={`/benchmarks/${benchmarkId}`}
      className={cn(
        'block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4',
        'hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-hover)] transition-colors hover:no-underline'
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[var(--color-foreground)] truncate">
            {bm.name}
          </span>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--color-muted)]/15 text-[var(--color-muted)]">
            {bm.shortName}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          {hasScore ? (
            <>
              <span className={cn('text-2xl font-bold tabular-nums', scoreColor)}>
                {score.score}
              </span>
              <span className="text-sm text-[var(--color-muted)]">{bm.unit}</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-[var(--color-muted)]">--</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {hasScore ? (
            <span className="text-xs text-[var(--color-muted)]">
              第{score.rank}/共{score.total}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-muted)]">暂无数据</span>
          )}
        </div>
      </div>
    </Link>
  );
}
