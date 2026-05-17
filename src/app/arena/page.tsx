'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Swords, History } from 'lucide-react';
import { ArenaForm } from '@/components/arena/ArenaForm';
import { ArenaProgress, type QuestionStreamState } from '@/components/arena/ArenaProgress';
import { ArenaResults } from '@/components/arena/ArenaResults';
import { arenaQuestions, type ArenaCategory } from '@/data/arena-questions';
import type { QuestionResult, ArenaDoneEvent } from '@/lib/arena/runner';

type Phase = 'form' | 'running' | 'results';

export default function ArenaPage() {
  const [phase, setPhase] = useState<Phase>('form');
  const [completed, setCompleted] = useState(0);
  const [streams, setStreams] = useState<QuestionStreamState[]>([]);
  const [completedResults, setCompletedResults] = useState<QuestionResult[]>([]);
  const [finalData, setFinalData] = useState<ArenaDoneEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<{ apiUrl: string; modelName: string; apiKey: string; concurrency: number } | null>(null);

  // Batching: per-question pending deltas keyed by questionId
  const pending = useRef<Map<string, { model: string; reasoning: string; content: string }>>(new Map());
  const rafId = useRef<number | null>(null);
  const flushScheduled = useRef(false);

  const flushStreaming = useCallback(() => {
    flushScheduled.current = false;
    if (pending.current.size === 0) return;

    setStreams((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        const p = pending.current.get(s.questionId);
        if (!p) return s;
        const updated = { ...s };
        if (p.model) { updated.modelText = s.modelText + p.model; changed = true; }
        if (p.reasoning) { updated.scorerReasoning = s.scorerReasoning + p.reasoning; changed = true; }
        if (p.content) { updated.scorerContent = s.scorerContent + p.content; changed = true; }
        return updated;
      });
      return changed ? next : prev;
    });
    pending.current.clear();
  }, []);

  const scheduleFlush = useCallback(() => {
    if (!flushScheduled.current) {
      flushScheduled.current = true;
      rafId.current = requestAnimationFrame(flushStreaming);
    }
  }, [flushStreaming]);

  function updateStream(questionId: string, category: ArenaCategory, status: 'calling_model' | 'scoring') {
    setStreams((prev) => {
      const exists = prev.some((s) => s.questionId === questionId);
      if (exists) {
        return prev.map((s) => s.questionId === questionId ? { ...s, status } : s);
      }
      return [...prev, { questionId, category, status, modelText: '', scorerReasoning: '', scorerContent: '' }];
    });
  }

  function removeStream(questionId: string) {
    setStreams((prev) => prev.filter((s) => s.questionId !== questionId));
  }

  async function handleStart(config: { apiUrl: string; modelName: string; apiKey: string; concurrency: number }) {
    setPhase('running');
    setCompleted(0);
    setCompletedResults([]);
    setFinalData(null);
    setError(null);
    setSavedReportId(null);
    setStreams([]);
    pending.current.clear();
    setLastConfig(config);

    try {
      const res = await fetch('/api/arena/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `请求失败: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

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

            if (event.type === 'progress') {
              updateStream(event.questionId, event.category, event.status);
              setCompleted(event.current);
            } else if (event.type === 'model_chunk') {
              const p = pending.current.get(event.questionId) || { model: '', reasoning: '', content: '' };
              p.model += event.delta;
              pending.current.set(event.questionId, p);
              scheduleFlush();
            } else if (event.type === 'scorer_chunk') {
              const p = pending.current.get(event.questionId) || { model: '', reasoning: '', content: '' };
              if (event.source === 'reasoning') {
                p.reasoning += event.delta;
              } else {
                p.content += event.delta;
              }
              pending.current.set(event.questionId, p);
              scheduleFlush();
            } else if (event.type === 'result') {
              if (flushScheduled.current) {
                cancelAnimationFrame(rafId.current!);
                flushStreaming();
              }
              removeStream(event.result.questionId);
              setCompletedResults((prev) => [...prev, event.result]);
            } else if (event.type === 'done') {
              if (flushScheduled.current) {
                cancelAnimationFrame(rafId.current!);
                flushStreaming();
              }
              setFinalData(event);
              setStreams([]);
              setPhase('results');

              try {
                const saveRes = await fetch('/api/arena/reports', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...event, apiUrl: lastConfig?.apiUrl || '' }),
                });
                if (saveRes.ok) {
                  const saved = await saveRes.json();
                  setSavedReportId(saved.id);
                }
              } catch {
                // Silently fail
              }
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      if (phase === 'running' && !finalData) {
        throw new Error('评测未正常完成，请重试');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setPhase('form');
    }
  }

  function handleReset() {
    setPhase('form');
    setCompleted(0);
    setCompletedResults([]);
    setFinalData(null);
    setError(null);
    setSavedReportId(null);
    setStreams([]);
    pending.current.clear();
  }

  function handleRetest() {
    if (!lastConfig) return;
    handleStart(lastConfig);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="h-7 w-7 text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">大模型竞技场</h1>
          <Link
            href="/arena/history"
            className="ml-auto flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
          >
            <History className="h-4 w-4" />
            评测历史
          </Link>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          提供你的模型 API，系统将用 {arenaQuestions.length} 道精选题目进行评测，涵盖数学、编程、知识、推理、指令遵循、代理、创意写作、角色扮演 8 个维度。
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      {savedReportId && phase === 'results' && (
        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm text-green-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          评测报告已保存
        </div>
      )}

      {phase === 'form' && (
        <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <ArenaForm onSubmit={handleStart} isRunning={false} initialConfig={lastConfig ?? undefined} />
        </div>
      )}

      {phase === 'running' && (
        <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <ArenaProgress
            completed={completed}
            total={arenaQuestions.length}
            streams={streams}
            completedResults={completedResults}
          />
        </div>
      )}

      {phase === 'results' && finalData && (
        <ArenaResults data={finalData} onReset={handleReset} onRetest={handleRetest} />
      )}
    </div>
  );
}
