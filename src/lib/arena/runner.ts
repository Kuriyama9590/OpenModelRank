import { arenaQuestions, ARENA_CATEGORY_NAMES, type ArenaCategory } from '@/data/arena-questions';
import { callModelStreaming } from './client';
import { scoreResponseStreaming, type ScoreResult } from './scorer';

export interface ArenaRunConfig {
  apiUrl: string;
  modelName: string;
  apiKey: string;
}

export interface QuestionResult {
  questionId: string;
  category: ArenaCategory;
  question: string;
  modelResponse: string;
  score: number;
  maxScore: number;
  reason: string;
  latencyMs: number;
}

export interface CategoryScore {
  category: ArenaCategory;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface ArenaProgressEvent {
  type: 'progress';
  current: number;
  total: number;
  questionId: string;
  category: ArenaCategory;
  status: 'calling_model' | 'scoring';
}

export interface ArenaModelChunkEvent {
  type: 'model_chunk';
  questionId: string;
  delta: string;
}

export interface ArenaResultEvent {
  type: 'result';
  result: QuestionResult;
}

export interface ArenaScorerChunkEvent {
  type: 'scorer_chunk';
  questionId: string;
  source: 'reasoning' | 'content';
  delta: string;
}

export interface ArenaDoneEvent {
  type: 'done';
  overallScore: number;
  overallMaxScore: number;
  percentage: number;
  categoryScores: CategoryScore[];
  results: QuestionResult[];
  modelName: string;
}

export interface ArenaErrorEvent {
  type: 'error';
  message: string;
}

export type ArenaEvent =
  | ArenaProgressEvent
  | ArenaModelChunkEvent
  | ArenaResultEvent
  | ArenaScorerChunkEvent
  | ArenaDoneEvent
  | ArenaErrorEvent;

/** Unbounded async event queue for fan-in from concurrent workers. */
function createEventQueue<T>() {
  const buffer: T[] = [];
  const waiters: ((v: IteratorResult<T>) => void)[] = [];
  let closed = false;

  return {
    push(item: T) {
      const w = waiters.shift();
      if (w) w({ value: item, done: false });
      else buffer.push(item);
    },
    close() {
      closed = true;
      for (const w of waiters) w({ value: undefined as never, done: true });
      waiters.length = 0;
    },
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        next: () => {
          if (buffer.length > 0) return Promise.resolve({ value: buffer.shift()!, done: false });
          if (closed) return Promise.resolve({ value: undefined as never, done: true });
          return new Promise((resolve) => { waiters.push(resolve); });
        },
      };
    },
  };
}

export async function* runBenchmark(
  config: ArenaRunConfig,
  concurrency = 8,
): AsyncGenerator<ArenaEvent> {
  const total = arenaQuestions.length;
  const results: QuestionResult[] = [];
  const queue = createEventQueue<ArenaEvent>();

  let completed = 0;
  let active = 0;
  let nextIdx = 0;

  async function worker(q: (typeof arenaQuestions)[number]) {
    try {
      queue.push({
        type: 'progress',
        current: completed,
        total,
        questionId: q.id,
        category: q.category,
        status: 'calling_model',
      });

      // Call model with streaming chunks pushed to the shared queue
      let modelResponse = '';
      let latencyMs = 0;
      try {
        for await (const event of callModelStreaming(
          config.apiUrl, config.modelName, config.apiKey, q.question,
        )) {
          if (event.kind === 'delta') {
            modelResponse += event.delta;
            queue.push({ type: 'model_chunk', questionId: q.id, delta: event.delta });
          } else {
            modelResponse = event.result.response;
            latencyMs = event.result.latencyMs;
          }
        }
      } catch (err) {
        if (!modelResponse) {
          modelResponse = `[调用失败: ${err instanceof Error ? err.message : '未知错误'}]`;
        }
      }

      queue.push({
        type: 'progress',
        current: completed,
        total,
        questionId: q.id,
        category: q.category,
        status: 'scoring',
      });

      // Score with reasoning / content chunks pushed to the shared queue
      let scoreResult: ScoreResult;
      try {
        for await (const event of scoreResponseStreaming(q, modelResponse)) {
          if (event.kind === 'done') {
            scoreResult = event.result;
          } else if (event.kind === 'reasoning_delta') {
            queue.push({ type: 'scorer_chunk', questionId: q.id, source: 'reasoning', delta: event.delta });
          } else {
            queue.push({ type: 'scorer_chunk', questionId: q.id, source: 'content', delta: event.delta });
          }
        }
      } catch {
        scoreResult = { score: Math.round(q.maxScore * 0.3), reason: '评分失败，给予较低分数' };
      }

      const result: QuestionResult = {
        questionId: q.id,
        category: q.category,
        question: q.question,
        modelResponse,
        score: scoreResult!.score,
        maxScore: q.maxScore,
        reason: scoreResult!.reason,
        latencyMs,
      };

      results.push(result);
      completed++;
      queue.push({ type: 'result', result });
    } catch (err) {
      queue.push({
        type: 'error',
        message: `${q.id}: ${err instanceof Error ? err.message : '未知错误'}`,
      });
    } finally {
      active--;
    }
  }

  // Start initial batch
  const batchSize = Math.min(concurrency, total);
  for (let i = 0; i < batchSize; i++) {
    active++;
    worker(arenaQuestions[nextIdx++]);
  }

  // Fan-in: yield events as they arrive, refill worker slots
  for await (const event of queue) {
    yield event;

    while (active < concurrency && nextIdx < total) {
      active++;
      worker(arenaQuestions[nextIdx++]);
    }

    if (completed >= total) {
      queue.close();
    }
  }

  // Compute category scores
  const categoryMap = new Map<ArenaCategory, { score: number; max: number }>();
  for (const r of results) {
    const entry = categoryMap.get(r.category) || { score: 0, max: 0 };
    entry.score += r.score;
    entry.max += r.maxScore;
    categoryMap.set(r.category, entry);
  }

  const categoryScores: CategoryScore[] = [];
  let totalScore = 0;
  let totalMax = 0;

  for (const [category, { score, max }] of categoryMap) {
    totalScore += score;
    totalMax += max;
    categoryScores.push({
      category,
      name: ARENA_CATEGORY_NAMES[category],
      score,
      maxScore: max,
      percentage: Math.round((score / max) * 1000) / 10,
    });
  }

  categoryScores.sort((a, b) => b.percentage - a.percentage);

  yield {
    type: 'done',
    overallScore: totalScore,
    overallMaxScore: totalMax,
    percentage: Math.round((totalScore / totalMax) * 1000) / 10,
    categoryScores,
    results,
    modelName: config.modelName,
  };
}
