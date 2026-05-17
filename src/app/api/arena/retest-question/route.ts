import { NextRequest } from 'next/server';
import { callModelStreaming } from '@/lib/arena/client';
import { scoreResponseStreaming, type ScoreResult } from '@/lib/arena/scorer';
import type { ArenaQuestion } from '@/data/arena-questions';
import type { QuestionResult, ArenaEvent } from '@/lib/arena/runner';

export async function POST(request: NextRequest) {
  let body: { apiUrl?: string; modelName?: string; apiKey?: string; question?: ArenaQuestion };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: '请求体不是有效的 JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { apiUrl, modelName, apiKey, question } = body;

  if (!apiUrl || !modelName || !apiKey || !question) {
    return new Response(
      JSON.stringify({ error: '缺少必填字段：apiUrl, modelName, apiKey, question' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({ error: '服务器未配置 DEEPSEEK_API_KEY 环境变量' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let streamClosed = false;
      const keepAlive = setInterval(() => {
        if (streamClosed) return;
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          // ignore
        }
      }, 15_000);

      function send(event: ArenaEvent) {
        if (streamClosed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        let modelResponse = '';
        let latencyMs = 0;

        send({
          type: 'progress',
          current: 0,
          total: 1,
          questionId: question.id,
          category: question.category,
          status: 'calling_model',
        });

        try {
          for await (const event of callModelStreaming(apiUrl, modelName, apiKey, question.question)) {
            if (event.kind === 'delta') {
              modelResponse += event.delta;
              send({ type: 'model_chunk', questionId: question.id, delta: event.delta });
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

        if (!modelResponse) {
          modelResponse = '[模型未返回内容]';
        }

        send({
          type: 'progress',
          current: 0,
          total: 1,
          questionId: question.id,
          category: question.category,
          status: 'scoring',
        });

        let scoreResult: ScoreResult;
        try {
          for await (const event of scoreResponseStreaming(question, modelResponse)) {
            if (event.kind === 'done') {
              scoreResult = event.result;
            } else if (event.kind === 'reasoning_delta') {
              send({ type: 'scorer_chunk', questionId: question.id, source: 'reasoning', delta: event.delta });
            } else {
              send({ type: 'scorer_chunk', questionId: question.id, source: 'content', delta: event.delta });
            }
          }
        } catch {
          scoreResult = { score: Math.round(question.maxScore * 0.3), reason: '评分失败，给予较低分数' };
        }

        const result: QuestionResult = {
          questionId: question.id,
          category: question.category,
          question: question.question,
          modelResponse,
          score: scoreResult!.score,
          maxScore: question.maxScore,
          reason: scoreResult!.reason,
          latencyMs,
        };

        send({ type: 'result', result });
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : '未知错误',
        });
      } finally {
        streamClosed = true;
        clearInterval(keepAlive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
