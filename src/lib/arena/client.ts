import { parseSSEResponse } from './sse-parser';

const MODEL_TIMEOUT_MS = 60_000;

export interface ModelCallResult {
  response: string;
  latencyMs: number;
}

export interface ModelStreamDelta {
  kind: 'delta';
  delta: string;
}

export interface ModelStreamDone {
  kind: 'done';
  result: ModelCallResult;
}

export type ModelCallEvent = ModelStreamDelta | ModelStreamDone;

export async function* callModelStreaming(
  apiUrl: string,
  modelName: string,
  apiKey: string,
  prompt: string,
): AsyncGenerator<ModelCallEvent> {
  const baseUrl = apiUrl.replace(/\/+$/, '');
  const url = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`模型 API 返回 ${res.status}: ${body.slice(0, 200)}`);
    }

    if (!res.body) {
      const data = await res.json();
      const content: string =
        data.choices?.[0]?.message?.content ?? JSON.stringify(data);
      yield { kind: 'done', result: { response: content, latencyMs: Date.now() - start } };
      return;
    }

    let fullResponse = '';
    for await (const delta of parseSSEResponse(res.body)) {
      if (delta.content) {
        fullResponse += delta.content;
        yield { kind: 'delta', delta: delta.content };
      }
    }

    yield {
      kind: 'done',
      result: { response: fullResponse, latencyMs: Date.now() - start },
    };
  } finally {
    clearTimeout(timer);
  }
}
