import { NextRequest } from 'next/server';
import { runBenchmark, type ArenaEvent } from '@/lib/arena/runner';

export async function POST(request: NextRequest) {
  let body: { apiUrl?: string; modelName?: string; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: '请求体不是有效的 JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { apiUrl, modelName, apiKey } = body;

  if (!apiUrl || !modelName || !apiKey) {
    return new Response(
      JSON.stringify({ error: '缺少必填字段：apiUrl, modelName, apiKey' }),
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
          // controller already closed — ignore
        }
      }, 15_000);

      function send(event: ArenaEvent) {
        if (streamClosed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      }

      try {
        for await (const event of runBenchmark({ apiUrl, modelName, apiKey })) {
          send(event);
        }
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
