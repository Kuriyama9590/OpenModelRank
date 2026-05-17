import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ArenaDoneEvent } from '@/lib/arena/runner';
import { ARENA_CATEGORY_NAMES } from '@/data/arena-questions';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const row = db.prepare('SELECT * FROM arena_reports WHERE id = ?').get(id) as {
    id: string;
    model_name: string;
    api_url: string;
    overall_score: number;
    overall_max_score: number;
    percentage: number;
    category_scores: string;
    results: string;
    created_at: string;
  } | undefined;

  if (!row) {
    return NextResponse.json({ error: '报告不存在' }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    modelName: row.model_name,
    apiUrl: row.api_url || '',
    overallScore: row.overall_score,
    overallMaxScore: row.overall_max_score,
    percentage: row.percentage,
    categoryScores: JSON.parse(row.category_scores),
    results: JSON.parse(row.results),
    createdAt: row.created_at,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM arena_reports WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: '报告不存在' }, { status: 404 });
  }

  let body: { results?: ArenaDoneEvent['results'] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
  }

  if (!body.results || !Array.isArray(body.results)) {
    return NextResponse.json({ error: '缺少 results 数组' }, { status: 400 });
  }

  // Recalculate category scores
  const categoryMap = new Map<string, { score: number; max: number }>();
  for (const r of body.results) {
    const entry = categoryMap.get(r.category) || { score: 0, max: 0 };
    entry.score += r.score;
    entry.max += r.maxScore;
    categoryMap.set(r.category, entry);
  }

  const categoryScores: ArenaDoneEvent['categoryScores'] = [];
  let totalScore = 0;
  let totalMax = 0;

  for (const [category, { score, max }] of categoryMap) {
    totalScore += score;
    totalMax += max;
    categoryScores.push({
      category: category as ArenaDoneEvent['categoryScores'][number]['category'],
      name: ARENA_CATEGORY_NAMES[category as keyof typeof ARENA_CATEGORY_NAMES] || category,
      score,
      maxScore: max,
      percentage: Math.round((score / max) * 1000) / 10,
    });
  }

  categoryScores.sort((a, b) => b.percentage - a.percentage);

  const percentage = Math.round((totalScore / totalMax) * 1000) / 10;

  db.prepare(`
    UPDATE arena_reports
    SET overall_score = ?, overall_max_score = ?, percentage = ?, category_scores = ?, results = ?
    WHERE id = ?
  `).run(totalScore, totalMax, percentage, JSON.stringify(categoryScores), JSON.stringify(body.results), id);

  return NextResponse.json({
    id,
    overallScore: totalScore,
    overallMaxScore: totalMax,
    percentage,
    categoryScores,
    results: body.results,
  });
}
