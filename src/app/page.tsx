import { getBenchmarkScores } from "@/lib/rankings";
import { LeaderboardTable } from "@/components/home/LeaderboardTable";
import { benchmarks } from "@/data/benchmarks";
import { models } from "@/data/models";

const FEATURED_BENCHMARKS = [
  'aa-intelligence',
  'swe-bench-verified',
  'gpqa-diamond',
  'hle',
  'mmlu-pro',
  'aime',
  'tau2-bench',
  'terminal-bench',
  'aa-omniscience',
  'gdpval-aa',
] as const;

interface BenchmarkRanking {
  benchmarkId: string;
  benchmarkName: string;
  benchmarkShortName: string;
  category: string;
  unit: string;
  entries: { modelId: string; score: number; rank: number }[];
}

const benchmarkRankings: BenchmarkRanking[] = FEATURED_BENCHMARKS
  .filter(id => benchmarks[id])
  .map(id => {
    const bm = benchmarks[id];
    const scores = getBenchmarkScores(id);
    return {
      benchmarkId: id,
      benchmarkName: bm.name,
      benchmarkShortName: bm.shortName,
      category: bm.category,
      unit: bm.unit,
      entries: scores.map((s, i) => ({ ...s, rank: i + 1 })),
    };
  });

export default function HomePage() {
  const modelCount = Object.keys(models).length;

  return (
    <>
      <section className="text-center py-16 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          大模型能力排行榜
        </h1>
        <p className="text-lg text-[var(--color-muted)]">
          2026年5月 · {modelCount}个模型 · 分评测集独立排名
        </p>
        <p className="text-xs text-[var(--color-muted)] max-w-xl mx-auto">
          每个评测集独立排名，仅展示该评测有成绩的模型。数据来源：Artificial Analysis 及各官方评测。
        </p>
      </section>

      <LeaderboardTable rankings={benchmarkRankings} />
    </>
  );
}
