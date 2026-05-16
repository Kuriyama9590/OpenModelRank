/**
 * 生成竞技场题目的基准答案（80分位水平）
 *
 * 用法: npx tsx scripts/generate-reference-answers.ts
 *
 * 需要 DEEPSEEK_API_KEY 环境变量。
 * 输出 JSON 文件到 scripts/reference-answers.json，
 * 然后手动将答案填入各 category 文件的 referenceAnswer 字段。
 */

import { arenaQuestions } from '../src/data/arena-questions';
import fs from 'fs';
import path from 'path';

const DEEPSEEK_TIMEOUT_MS = 180_000;

async function generateAnswer(question: typeof arenaQuestions[number]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const prompt = `${question.question}

请给出一个高质量但不完美的答案，达到80分位水平（预期得分8/10，满分10分）。
答案应正确但不需面面俱到，允许有微小的不严谨或不够深入的局部。
评分标准：${question.scoringRubric}`;

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
          { role: 'system', content: '你是一个知识渊博的助手。请按要求给出答案，达到80分位水平。' },
          { role: 'user', content: prompt },
        ],
        thinking: {
          type: 'enabled',
          reasoning_effort: 'max',
        },
        max_tokens: 393216,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API 返回 ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const reasoning: string = data.choices?.[0]?.message?.reasoning_content ?? '';

    return content || reasoning || '(生成失败)';
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`共 ${arenaQuestions.length} 道题目，开始生成基准答案...\n`);

  const results: Record<string, string> = {};

  for (let i = 0; i < arenaQuestions.length; i++) {
    const q = arenaQuestions[i];
    console.log(`[${i + 1}/${arenaQuestions.length}] 生成 ${q.id} (${q.category})...`);

    try {
      const answer = await generateAnswer(q);
      results[q.id] = answer;
      console.log(`  ✓ 完成 (${answer.length} 字)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      console.log(`  ✗ 失败: ${msg}`);
      results[q.id] = `(生成失败: ${msg})`;
    }
  }

  const outputPath = path.join(__dirname, 'reference-answers.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n结果已保存到 ${outputPath}`);
}

main().catch(console.error);
