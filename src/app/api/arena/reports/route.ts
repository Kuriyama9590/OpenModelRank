import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import type { ArenaDoneEvent } from '@/lib/arena/runner';

export async function POST(request: NextRequest) {
  let body: ArenaDoneEvent;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
  }

  if (body.type !== 'done') {
    return NextResponse.json({ error: '事件类型应为 "done"' }, { status: 400 });
  }

  const id = randomUUID();
  const db = getDb();

  const apiUrl = (body as unknown as Record<string, unknown>).apiUrl as string || '';

  db.prepare(`
    INSERT INTO arena_reports (id, model_name, api_url, overall_score, overall_max_score, percentage, category_scores, results)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.modelName,
    apiUrl,
    body.overallScore,
    body.overallMaxScore,
    body.percentage,
    JSON.stringify(body.categoryScores),
    JSON.stringify(body.results),
  );

  const row = db.prepare('SELECT created_at FROM arena_reports WHERE id = ?').get(id) as { created_at: string } | undefined;

  return NextResponse.json({ id, createdAt: row?.created_at }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const offset = (page - 1) * limit;

  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as count FROM arena_reports').get() as { count: number }).count;
  const rows = db.prepare(`
    SELECT id, model_name, overall_score, overall_max_score, percentage, created_at
    FROM arena_reports
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as Array<{
    id: string;
    model_name: string;
    overall_score: number;
    overall_max_score: number;
    percentage: number;
    created_at: string;
  }>;

  const reports = rows.map((r) => ({
    id: r.id,
    modelName: r.model_name,
    overallScore: r.overall_score,
    overallMaxScore: r.overall_max_score,
    percentage: r.percentage,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ reports, total, page, limit });
}
