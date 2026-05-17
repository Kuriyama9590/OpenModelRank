'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getModel } from '@/data/models';
import { CATEGORY_NAMES, CATEGORY_COLORS } from '@/types';

interface RankingEntry {
  modelId: string;
  score: number;
  rank: number;
}

interface BenchmarkRanking {
  benchmarkId: string;
  benchmarkName: string;
  benchmarkShortName: string;
  category: string;
  unit: string;
  entries: RankingEntry[];
}

interface LeaderboardTableProps {
  rankings: BenchmarkRanking[];
}

type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return <ChevronsUpDown className="h-3 w-3 text-[var(--color-muted)] opacity-50" />;
  }
  return dir === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-[var(--color-accent)]" />
  ) : (
    <ChevronDown className="h-3 w-3 text-[var(--color-accent)]" />
  );
}

function ScoreDisplay({ score, unit }: { score: number; unit: string }) {
  const formatted = unit === 'score' ? score.toFixed(1) : `${score.toFixed(1)}${unit}`;
  const colorClass =
    score >= 80
      ? 'text-[var(--color-success)]'
      : score >= 50
        ? 'text-[var(--color-foreground)]'
        : 'text-[var(--color-muted)]';

  const barPct = Math.min(100, Math.max(0, score));
  const barColor =
    score >= 80
      ? 'bg-[var(--color-success)]'
      : score >= 50
        ? 'bg-[var(--color-accent)]'
        : 'bg-[var(--color-muted)]';

  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <div className="flex-1 score-bar">
        <div className={cn('score-bar-fill', barColor)} style={{ width: `${barPct}%` }} />
      </div>
      <span className={cn('tabular-nums font-medium text-sm w-14 text-right', colorClass)}>{formatted}</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className={cn('rank-badge', `rank-${rank}`)}>{rank}</span>;
  }
  return <span className={cn('rank-badge rank-default')}>{rank}</span>;
}

function BenchmarkSection({ ranking }: { ranking: BenchmarkRanking }) {
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAll, setShowAll] = useState(false);

  const categoryName = CATEGORY_NAMES[ranking.category as keyof typeof CATEGORY_NAMES] || ranking.category;
  const categoryColor = CATEGORY_COLORS[ranking.category as keyof typeof CATEGORY_COLORS] || '#6b7280';

  const sorted = useMemo(() => {
    const items = [...ranking.entries];
    items.sort((a, b) => sortDir === 'asc' ? a.score - b.score : b.score - a.score);
    return items;
  }, [ranking.entries, sortDir]);

  const displayed = showAll ? sorted : sorted.slice(0, 10);
  const hasMore = sorted.length > 10;

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
        >
          {categoryName}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          {ranking.benchmarkName}
        </h3>
        <span className="text-xs text-[var(--color-muted)]">
          {ranking.entries.length}个模型
        </span>
        <button
          onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
          className="ml-auto flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          分数 <SortIcon active dir={sortDir} />
        </button>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {displayed.map((entry, idx) => {
          const model = getModel(entry.modelId);
          if (!model) return null;
          const rank = sortDir === 'desc' ? idx + 1 : sorted.length - idx;
          return (
            <div
              key={entry.modelId}
              className="flex items-center px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <RankBadge rank={rank} />
              <div className="flex items-center gap-2 min-w-0 flex-1 ml-3">
                <Link
                  href={`/models/${model.id}`}
                  className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-accent)] truncate transition-colors hover:no-underline"
                >
                  {model.name}
                </Link>
                <span
                  className="shrink-0 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-none"
                  style={{
                    backgroundColor: model.providerColor + '20',
                    color: model.providerColor,
                  }}
                >
                  {model.provider}
                </span>
              </div>
              <ScoreDisplay score={entry.score} unit={ranking.unit} />
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-4 py-2.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] bg-[var(--color-surface)] border-t border-[var(--color-border)] transition-colors"
        >
          {showAll ? '收起' : `展开全部 ${sorted.length} 个模型`}
        </button>
      )}
    </div>
  );
}

export function LeaderboardTable({ rankings }: LeaderboardTableProps) {
  return (
    <div className="space-y-6">
      {rankings.map(r => (
        <BenchmarkSection key={r.benchmarkId} ranking={r} />
      ))}
    </div>
  );
}
