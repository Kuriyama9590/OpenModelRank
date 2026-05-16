'use client';

import { useRef, useEffect } from 'react';
import { ARENA_CATEGORY_NAMES, ARENA_CATEGORY_COLORS, type ArenaCategory } from '@/data/arena-questions';
import type { QuestionResult } from '@/lib/arena/runner';

export interface QuestionStreamState {
  questionId: string;
  category: ArenaCategory;
  status: 'calling_model' | 'scoring';
  modelText: string;
  scorerReasoning: string;
  scorerContent: string;
}

interface ArenaProgressProps {
  completed: number;
  total: number;
  streams: QuestionStreamState[];
  completedResults: QuestionResult[];
}

function MiniStreamPanel({ stream }: { stream: QuestionStreamState }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const color = ARENA_CATEGORY_COLORS[stream.category];

  const displayText =
    stream.status === 'calling_model'
      ? stream.modelText || '等待模型响应...'
      : stream.scorerReasoning
        ? stream.scorerReasoning + (stream.scorerContent ? '\n' + stream.scorerContent : '')
        : stream.scorerContent || '等待评分...';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayText]);

  return (
    <div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <span className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-[var(--color-foreground)] truncate">
          {ARENA_CATEGORY_NAMES[stream.category]}
        </span>
        <span className="text-xs text-[var(--color-muted)] truncate ml-auto">
          {stream.status === 'calling_model' ? '调用' : '评分'}
        </span>
      </div>
      {/* Streaming text */}
      <div
        ref={scrollRef}
        className="p-2 flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-[var(--color-muted)] whitespace-pre-wrap break-words"
        style={{ minHeight: '56px', maxHeight: '120px' }}
      >
        {displayText}
        <span className="inline-block w-1 h-3 bg-[var(--color-accent)] animate-pulse ml-0.5 align-middle" />
      </div>
    </div>
  );
}

export function ArenaProgress({
  completed,
  total,
  streams,
  completedResults,
}: ArenaProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-foreground)]">
            进度 {completed} / {total}
          </span>
          <span className="text-[var(--color-muted)]">
            {streams.length > 0
              ? `${streams.length} 题评测中`
              : '等待中'}
            {' '}&middot; {pct}%
          </span>
        </div>
        <div className="h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Concurrent streaming grid */}
      {streams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {streams.map((s) => (
            <MiniStreamPanel key={s.questionId} stream={s} />
          ))}
        </div>
      )}

      {/* Completed results preview */}
      {completedResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm text-[var(--color-muted)]">已完成题目</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {completedResults.map((r) => (
              <div
                key={r.questionId}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--color-background)]"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: ARENA_CATEGORY_COLORS[r.category] }}
                />
                <span className="text-xs text-[var(--color-muted)] flex-1 truncate">
                  {ARENA_CATEGORY_NAMES[r.category]} — {r.questionId}
                </span>
                <span className="text-xs font-mono text-[var(--color-foreground)]">
                  {r.score}/{r.maxScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
