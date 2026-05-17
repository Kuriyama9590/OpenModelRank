import { getBenchmarkScores } from "@/lib/rankings";
import { LeaderboardTable } from "@/components/home/LeaderboardTable";
import { StatsOverview } from "@/components/home/StatsOverview";
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
  const benchmarkCount = Object.keys(benchmarks).length;

  return (
    <>
      {/* Hero section */}
      <section className="gradient-hero rounded-2xl py-12 px-6 mb-10 text-center space-y-4 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/50 text-xs text-[var(--color-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></span>
          2026年5月 · 数据已更新
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl bg-gradient-to-r from-[var(--color-foreground)] via-[var(--color-accent)] to-[var(--color-foreground)] bg-clip-text">
          大模型能力排行榜
        </h1>
        <p className="text-base text-[var(--color-muted)] max-w-lg mx-auto">
          覆盖 {modelCount} 个主流大模型 · {benchmarkCount} 项权威 Benchmark · 分评测集独立排名
        </p>
        <p className="text-xs text-[var(--color-muted)]/70 max-w-xl mx-auto">
          数据来源：Artificial Analysis 及各官方评测。每个评测集独立排名，仅展示该评测有成绩的模型。
        </p>
      </section>

      {/* Stats + Top models chart */}
      <StatsOverview modelCount={modelCount} benchmarkCount={benchmarkCount} />

      {/* Section divider */}
      <div className="flex items-center gap-4 my-10">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent"></div>
        <span className="text-xs text-[var(--color-muted)] font-medium">分项排行榜</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent"></div>
      </div>

      <LeaderboardTable rankings={benchmarkRankings} />
    </>
  );
}
