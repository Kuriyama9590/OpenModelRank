import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const row = db.prepare('SELECT * FROM arena_reports WHERE id = ?').get(id) as {
    id: string;
    model_name: string;
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
    overallScore: row.overall_score,
    overallMaxScore: row.overall_max_score,
    percentage: row.percentage,
    categoryScores: JSON.parse(row.category_scores),
    results: JSON.parse(row.results),
    createdAt: row.created_at,
  });
}
