'use client';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
  unit: string;
  rank: number;
  total: number;
}

export function ScoreBar({ label, score, maxScore, unit, rank, total }: ScoreBarProps) {
  const pct = maxScore > 0 ? Math.min(100, Math.max(0, (score / maxScore) * 100)) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-foreground)] truncate">{label}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
            {score}
            <span className="text-xs text-[var(--color-muted)] ml-0.5">{unit}</span>
          </span>
          <span className="text-xs text-[var(--color-muted)] tabular-nums">
            第{rank}/共{total}
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
