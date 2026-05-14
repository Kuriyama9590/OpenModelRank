'use client';

import { ExternalLink } from 'lucide-react';
import { getBenchmark } from '@/data/benchmarks';
import { CATEGORY_NAMES } from '@/types';

interface BenchmarkInfoProps {
  benchmarkId: string;
}

export function BenchmarkInfo({ benchmarkId }: BenchmarkInfoProps) {
  const bm = getBenchmark(benchmarkId);

  if (!bm) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-8 text-center text-[var(--color-muted)]">
        评测集未找到
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
            {bm.name}
          </h1>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
            {CATEGORY_NAMES[bm.category]}
          </span>
        </div>

        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          {bm.longDescription}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-muted)]/10">
            单位: {bm.unit}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-muted)]/10">
            方向: {bm.higherIsBetter ? '越高越好' : '越低越好'}
          </span>
          {bm.sourceUrl && (
            <a
              href={bm.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors hover:no-underline"
            >
              <ExternalLink className="h-3 w-3" />
              数据来源
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
