export interface StreamDelta {
  content?: string;
  reasoningContent?: string;
}

export async function* parseSSEResponse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<StreamDelta> {
  const reader = body.getReader();
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
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          const hasContent = typeof delta.content === 'string' && delta.content.length > 0;
          const hasReasoning = typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0;

          if (hasContent || hasReasoning) {
            yield {
              content: hasContent ? delta.content : undefined,
              reasoningContent: hasReasoning ? delta.reasoning_content : undefined,
            };
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
