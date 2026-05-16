'use client';

import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { ChevronDown, ChevronUp, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ARENA_CATEGORY_COLORS, type ArenaCategory } from '@/data/arena-questions';
import type { ArenaDoneEvent, QuestionResult } from '@/lib/arena/runner';

interface ArenaResultsProps {
  data: ArenaDoneEvent;
  onReset: () => void;
}

export function ArenaResults({ data, onReset }: ArenaResultsProps) {
  const { percentage, categoryScores, results, modelName, overallScore, overallMaxScore } = data;

  const radarData = categoryScores.map((c) => ({
    category: c.name,
    score: c.percentage,
    fullMark: 100,
  }));

  const barData = categoryScores.map((c) => ({
    name: c.name,
    percentage: c.percentage,
    color: ARENA_CATEGORY_COLORS[c.category as ArenaCategory],
  }));

  const grade =
    percentage >= 90 ? 'S' :
    percentage >= 80 ? 'A' :
    percentage >= 70 ? 'B' :
    percentage >= 60 ? 'C' : 'D';

  const gradeColor =
    percentage >= 90 ? 'text-yellow-400' :
    percentage >= 80 ? 'text-green-400' :
    percentage >= 70 ? 'text-blue-400' :
    percentage >= 60 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="space-y-8">
      {/* Overall score header */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
        <div className="text-center">
          <div className={cn('text-6xl font-bold', gradeColor)}>{grade}</div>
          <div className="text-sm text-[var(--color-muted)] mt-1">评级</div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{modelName}</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            总分 {overallScore} / {overallMaxScore}（{percentage}%）
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-accent)] transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          重新评测
        </button>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
          <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-4">能力雷达图</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
              />
              <Radar
                dataKey="score"
                stroke="var(--color-accent)"
                fill="var(--color-accent)"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
          <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-4">类别得分</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} width={60} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}%`, '得分率']}
              />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={24}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categoryScores.map((c) => (
          <div
            key={c.category}
            className="p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-center"
          >
            <div
              className="text-2xl font-bold"
              style={{ color: ARENA_CATEGORY_COLORS[c.category as ArenaCategory] }}
            >
              {c.percentage}%
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">{c.name}</div>
            <div className="text-xs text-[var(--color-muted)]">
              {c.score}/{c.maxScore}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed results */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--color-foreground)]">详细结果</h3>
        <div className="space-y-2">
          {results.map((r) => (
            <QuestionResultCard key={r.questionId} result={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionResultCard({ result }: { result: QuestionResult }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((result.score / result.maxScore) * 100);

  const scoreColor =
    pct >= 80 ? 'text-green-400' :
    pct >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: ARENA_CATEGORY_COLORS[result.category] }}
        />
        <span className="text-sm text-[var(--color-foreground)] flex-1 truncate">
          {result.questionId}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {result.latencyMs > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <Clock className="h-3 w-3" />
              {(result.latencyMs / 1000).toFixed(1)}s
            </span>
          )}
          <span className={cn('text-sm font-mono font-medium', scoreColor)}>
            {result.score}/{result.maxScore}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[var(--color-muted)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border)]">
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1">题目</div>
            <div className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap">{result.question}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1">模型回答</div>
            <div className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap max-h-60 overflow-y-auto">
              {result.modelResponse}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1">评分理由</div>
            <div className="text-sm text-[var(--color-foreground)]">{result.reason}</div>
          </div>
        </div>
      )}
    </div>
  );
}
