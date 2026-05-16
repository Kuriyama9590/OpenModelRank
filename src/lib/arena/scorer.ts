import type { ArenaQuestion } from '@/data/arena-questions';
import { parseSSEResponse } from './sse-parser';

export interface ScoreResult {
  score: number;
  reason: string;
}

export interface ScorerStreamDelta {
  kind: 'reasoning_delta' | 'content_delta';
  delta: string;
}

export interface ScorerStreamDone {
  kind: 'done';
  result: ScoreResult;
}

export type ScorerCallEvent = ScorerStreamDelta | ScorerStreamDone;

const DEEPSEEK_TIMEOUT_MS = 120_000;

export async function* scoreResponseStreaming(
  question: ArenaQuestion,
  response: string,
): AsyncGenerator<ScorerCallEvent> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const referenceSection = question.referenceAnswer
    ? `\n## 参考答案（80分位基准，预期得分8/10）\n${question.referenceAnswer}\n`
    : '';

  const prompt = `你是一个严格的大模型评测专家。请对以下回答进行评分。

## 题目
${question.question}

## 模型回答
${response}
${referenceSection}
## 评分标准
${question.scoringRubric}

${question.referenceAnswer
    ? `请根据评分标准对模型回答打分。参考答案是一个80分位基准，预期得分为8分（满分10分）。
请将模型回答与参考答案进行对比：
- 若模型回答明显低于参考答案的质量（错误、遗漏、浅薄），应给5-7分
- 若模型回答与参考答案质量相当，应给8分
- 若模型回答超越参考答案（更严谨的证明、更深入的洞察、更精妙的构思、更完整的覆盖），应给9-10分
score 为 1-${question.maxScore} 的整数。`
    : `请根据评分标准对模型回答打分，score 为 1-${question.maxScore} 的整数。`}

你的最终输出必须且只能是一个 JSON 对象，格式如下：
{"score": X, "reason": "50字以内的评分理由"}
不要输出任何其他内容。`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: '你是一个评分助手。思考完成后，你的最终回复必须是一个 JSON 对象：{"score": 数字, "reason": "理由"}。不要在 JSON 前后输出任何其他文字。' },
          { role: 'user', content: prompt },
        ],
        thinking: {
          type: 'enabled',
          reasoning_effort: 'max',
        },
        max_tokens: 393216,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`DeepSeek API 返回 ${res.status}: ${body.slice(0, 200)}`);
    }

    if (!res.body) {
      const data = await res.json();
      const message = data.choices?.[0]?.message;
      const content: string = message?.content ?? '';
      const reasoning: string = message?.reasoning_content ?? '';
      const result = extractScore(content, reasoning, question.maxScore);
      yield { kind: 'done', result };
      return;
    }

    let fullReasoning = '';
    let fullContent = '';

    for await (const delta of parseSSEResponse(res.body)) {
      if (delta.reasoningContent) {
        fullReasoning += delta.reasoningContent;
        yield { kind: 'reasoning_delta', delta: delta.reasoningContent };
      }
      if (delta.content) {
        fullContent += delta.content;
        yield { kind: 'content_delta', delta: delta.content };
      }
    }

    const result = extractScore(fullContent, fullReasoning, question.maxScore);
    yield { kind: 'done', result };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      yield {
        kind: 'done',
        result: {
          score: Math.round(question.maxScore * 0.5),
          reason: '评分超时，给予中等分数',
        },
      };
      return;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function extractScore(content: string, reasoning: string, maxScore: number): ScoreResult {
  let match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    match = reasoning.match(/\{[\s\S]*\}/);
  }
  if (!match) {
    return {
      score: Math.round(maxScore * 0.5),
      reason: `评分模型返回格式异常，content: ${content.slice(0, 80)}`,
    };
  }

  try {
    const parsed = JSON.parse(match[0]);
    const clampedScore = Math.max(1, Math.min(maxScore, Math.round(parsed.score)));
    return {
      score: clampedScore,
      reason: String(parsed.reason || '无评语').slice(0, 200),
    };
  } catch {
    return {
      score: Math.round(maxScore * 0.5),
      reason: `评分模型返回格式异常，content: ${content.slice(0, 80)}`,
    };
  }
}
