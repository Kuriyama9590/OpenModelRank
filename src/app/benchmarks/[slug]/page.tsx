import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { benchmarks, getBenchmark } from "@/data/benchmarks";
import { getTopModels } from "@/lib/rankings";
import { models } from "@/data/models";
import { BenchmarkInfo } from "@/components/benchmarks/BenchmarkInfo";
import { BenchmarkTable } from "@/components/benchmarks/BenchmarkTable";

export async function generateStaticParams() {
  return Object.keys(benchmarks).map((id) => ({ slug: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const benchmark = getBenchmark(slug);
  if (!benchmark) {
    return { title: "评测未找到 | OpenModelRank" };
  }
  return {
    title: `${benchmark.name} 排行榜 | OpenModelRank`,
    description: `${benchmark.name} 榜单：${benchmark.description}。查看各大模型在 ${benchmark.name} 上的跑分排名。`,
  };
}

export default async function BenchmarkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const benchmark = getBenchmark(slug);

  if (!benchmark) {
    notFound();
  }

  const topModels = getTopModels(benchmark.id, 50);

  const rows = topModels.map((entry) => ({
    model: models[entry.modelId] ?? null,
    score: entry.score,
    rank: topModels.indexOf(entry) + 1,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {benchmark.name} 排行榜
      </h1>

      <BenchmarkInfo benchmarkId={benchmark.id} />

      <BenchmarkTable benchmarkId={benchmark.id} />

      <p className="text-xs text-[var(--color-muted)] border-t border-[var(--color-border)] pt-6">
        数据来源：各模型官方公布的评测数据及第三方评测平台。分数取各模型最新跑分结果。部分数据为厂商自行报告，测试条件可能存在差异，仅供参考。最后更新：2026年5月。
      </p>
    </div>
  );
}
