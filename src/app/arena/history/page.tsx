'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swords, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { ArenaResults } from '@/components/arena/ArenaResults';
import type { ArenaDoneEvent } from '@/lib/arena/runner';

interface ReportSummary {
  id: string;
  modelName: string;
  overallScore: number;
  overallMaxScore: number;
  percentage: number;
  createdAt: string;
}

interface ReportDetail extends ReportSummary {
  categoryScores: ArenaDoneEvent['categoryScores'];
  results: ArenaDoneEvent['results'];
}

function getGrade(percentage: number) {
  if (percentage >= 90) return { letter: 'S', color: 'text-yellow-400' };
  if (percentage >= 80) return { letter: 'A', color: 'text-green-400' };
  if (percentage >= 70) return { letter: 'B', color: 'text-blue-400' };
  if (percentage >= 60) return { letter: 'C', color: 'text-orange-400' };
  return { letter: 'D', color: 'text-red-400' };
}

export default function ArenaHistoryPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<ReportDetail | null>(null);

  const limit = 10;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/arena/reports?page=${page}&limit=${limit}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data) {
          setReports(data.reports);
          setTotal(data.total);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }

    setExpandedId(id);
    setExpandedData(null);

    try {
      const res = await fetch(`/api/arena/reports/${id}`);
      if (res.ok) {
        const data = await res.json();
        setExpandedData(data);
      }
    } catch {
      // ignore
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="h-7 w-7 text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">评测历史</h1>
          <Link
            href="/arena"
            className="ml-auto text-sm text-[var(--color-accent)] hover:underline"
          >
            返回竞技场
          </Link>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          查看所有已保存的评测报告
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-[var(--color-muted)]">加载中...</div>
      )}

      {/* Empty */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--color-muted)] mb-4">暂无评测记录</p>
          <Link
            href="/arena"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            去评测一个模型
          </Link>
        </div>
      )}

      {/* Report list */}
      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => {
            const grade = getGrade(report.percentage);
            const isExpanded = expandedId === report.id;

            return (
              <div key={report.id}>
                <button
                  onClick={() => handleExpand(report.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors text-left"
                >
                  <div className={`text-3xl font-bold ${grade.color}`}>
                    {grade.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-foreground)] truncate">
                      {report.modelName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mt-1">
                      <span>{report.percentage}%</span>
                      <span>·</span>
                      <span>{report.overallScore}/{report.overallMaxScore}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{new Date(report.createdAt + 'Z').toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-[var(--color-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="mt-2 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    {expandedData ? (
                      <ArenaResults
                        data={{
                          type: 'done',
                          overallScore: expandedData.overallScore,
                          overallMaxScore: expandedData.overallMaxScore,
                          percentage: expandedData.percentage,
                          categoryScores: expandedData.categoryScores,
                          results: expandedData.results,
                          modelName: expandedData.modelName,
                        }}
                        onReset={() => { setExpandedId(null); setExpandedData(null); }}
                      />
                    ) : (
                      <div className="text-center py-6 text-[var(--color-muted)]">加载报告详情...</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </button>
              <span className="text-sm text-[var(--color-muted)]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
