'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swords, ChevronLeft, ChevronRight, Clock, Redo, X } from 'lucide-react';
import { ArenaResults, type RetestStreamState } from '@/components/arena/ArenaResults';
import { cn } from '@/lib/cn';
import { arenaQuestions } from '@/data/arena-questions';
import type { ArenaDoneEvent, QuestionResult } from '@/lib/arena/runner';

interface ReportSummary {
  id: string;
  modelName: string;
  overallScore: number;
  overallMaxScore: number;
  percentage: number;
  createdAt: string;
}

interface ReportDetail extends ReportSummary {
  apiUrl: string;
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

  // Single question retest state
  const [retestingQuestionId, setRetestingQuestionId] = useState<string | null>(null);
  const [retestFormVisible, setRetestFormVisible] = useState(false);
  const [retestApiUrl, setRetestApiUrl] = useState('');
  const [retestModelName, setRetestModelName] = useState('');
  const [retestApiKey, setRetestApiKey] = useState('');
  const [retestPendingResult, setRetestPendingResult] = useState<QuestionResult | null>(null);
  const [retestStream, setRetestStream] = useState<RetestStreamState | null>(null);

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

  function handleRetestQuestion(result: QuestionResult) {
    setRetestPendingResult(result);
    // Pre-fill apiUrl/modelName from expandedData; apiKey from sessionStorage
    if (expandedData) {
      setRetestApiUrl(expandedData.apiUrl || '');
      setRetestModelName(expandedData.modelName);
    }
    const savedKey = sessionStorage.getItem('arena_retest_apikey');
    if (savedKey) setRetestApiKey(savedKey);
    setRetestFormVisible(true);
  }

  function cancelRetest() {
    setRetestFormVisible(false);
    setRetestPendingResult(null);
    setRetestingQuestionId(null);
    setRetestApiUrl('');
    setRetestModelName('');
    setRetestApiKey('');
  }

  async function handleRetestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!retestApiUrl.trim() || !retestModelName.trim() || !retestApiKey.trim() || !retestPendingResult) return;

    // Save apiKey to sessionStorage for future retests
    sessionStorage.setItem('arena_retest_apikey', retestApiKey.trim());

    // Look up full question data (scoringRubric + referenceAnswer) from arena questions
    const fullQ = arenaQuestions.find((q) => q.id === retestPendingResult.questionId);
    const question = {
      id: retestPendingResult.questionId,
      category: retestPendingResult.category,
      question: retestPendingResult.question,
      scoringRubric: fullQ?.scoringRubric || '',
      maxScore: retestPendingResult.maxScore,
      referenceAnswer: fullQ?.referenceAnswer || '',
    };

    setRetestingQuestionId(retestPendingResult.questionId);
    setRetestFormVisible(false);
    setRetestStream({ modelText: '', scorerReasoning: '', scorerContent: '' });

    try {
      const res = await fetch('/api/arena/retest-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: retestApiUrl.trim(),
          modelName: retestModelName.trim(),
          apiKey: retestApiKey.trim(),
          question,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `请求失败: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6);
            if (!json.trim()) continue;

            try {
              const event = JSON.parse(json);

              if (event.type === 'model_chunk') {
                setRetestStream((prev) => prev ? { ...prev, modelText: prev.modelText + (event.delta || '') } : prev);
              } else if (event.type === 'scorer_chunk') {
                setRetestStream((prev) => {
                  if (!prev) return prev;
                  if (event.source === 'reasoning') {
                    return { ...prev, scorerReasoning: prev.scorerReasoning + (event.delta || '') };
                  }
                  return { ...prev, scorerContent: prev.scorerContent + (event.delta || '') };
                });
              } else if (event.type === 'result') {
                const newResult = event.result as QuestionResult;
                setExpandedData((prev) => {
                  if (!prev) return prev;
                  const updatedResults = prev.results.map((r) =>
                    r.questionId === newResult.questionId ? newResult : r,
                  );

                  // Recalculate totals
                  let totalScore = 0;
                  let totalMax = 0;
                  const categoryMap = new Map<string, { score: number; max: number }>();
                  for (const r of updatedResults) {
                    const entry = categoryMap.get(r.category) || { score: 0, max: 0 };
                    entry.score += r.score;
                    entry.max += r.maxScore;
                    categoryMap.set(r.category, entry);
                    totalScore += r.score;
                    totalMax += r.maxScore;
                  }
                  const updatedCategoryScores = Array.from(categoryMap, ([category, { score, max }]) => ({
                    category: category as ArenaDoneEvent['categoryScores'][number]['category'],
                    name: category,
                    score,
                    maxScore: max,
                    percentage: Math.round((score / max) * 1000) / 10,
                  })).sort((a, b) => b.percentage - a.percentage);

                  // Persist to DB (fire-and-forget)
                  if (expandedId) {
                    fetch(`/api/arena/reports/${expandedId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ results: updatedResults }),
                    }).catch(() => {});
                  }

                  return {
                    ...prev,
                    results: updatedResults,
                    overallScore: totalScore,
                    overallMaxScore: totalMax,
                    percentage: Math.round((totalScore / totalMax) * 1000) / 10,
                    categoryScores: updatedCategoryScores,
                  };
                });
              } else if (event.type === 'error') {
                // Non-fatal — keep whatever was streamed so far
              }
            } catch (parseErr) {
              if (!(parseErr instanceof SyntaxError)) throw parseErr;
            }
          }
        }
      } catch {
        // Reader aborted — connection closed by server timeout
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Connection lost (server timeout or network issue) — keep partial result
      } else {
        console.error('Retest failed:', err);
      }
    } finally {
      setRetestingQuestionId(null);
      setRetestStream(null);
      setRetestPendingResult(null);
      setRetestApiUrl('');
      setRetestModelName('');
      setRetestApiKey('');
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

      {/* Retest form */}
      {retestFormVisible && retestPendingResult && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-accent)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--color-foreground)]">
              重测 — {retestPendingResult.questionId}
            </h3>
            <button onClick={cancelRetest} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleRetestSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="API 地址"
                value={retestApiUrl}
                onChange={(e) => setRetestApiUrl(e.target.value)}
                className={cn(
                  'rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] py-2 px-3 text-sm',
                  'placeholder:text-[var(--color-muted)] text-[var(--color-foreground)]',
                  'focus:outline-none focus:border-[var(--color-accent)]',
                )}
              />
              <input
                type="text"
                placeholder="模型名称"
                value={retestModelName}
                onChange={(e) => setRetestModelName(e.target.value)}
                className={cn(
                  'rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] py-2 px-3 text-sm',
                  'placeholder:text-[var(--color-muted)] text-[var(--color-foreground)]',
                  'focus:outline-none focus:border-[var(--color-accent)]',
                )}
              />
              <input
                type="password"
                placeholder="API Key"
                value={retestApiKey}
                onChange={(e) => setRetestApiKey(e.target.value)}
                className={cn(
                  'rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] py-2 px-3 text-sm',
                  'placeholder:text-[var(--color-muted)] text-[var(--color-foreground)]',
                  'focus:outline-none focus:border-[var(--color-accent)]',
                )}
              />
            </div>
            <button
              type="submit"
              disabled={!retestApiUrl.trim() || !retestModelName.trim() || !retestApiKey.trim()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                retestApiUrl.trim() && retestModelName.trim() && retestApiKey.trim()
                  ? 'bg-[var(--color-accent)] text-white hover:opacity-90'
                  : 'bg-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed',
              )}
            >
              <Redo className="h-4 w-4" />
              开始重测
            </button>
          </form>
        </div>
      )}

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
                        onRetestQuestion={handleRetestQuestion}
                        retestingQuestionId={retestingQuestionId}
                        retestStream={retestStream}
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
