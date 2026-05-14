import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { models, getModel } from "@/data/models";
import { benchmarks } from "@/data/benchmarks";
import { getModelBenchmarkScores, getTopModels } from "@/lib/rankings";
import { ModelHeader } from "@/components/models/ModelHeader";
import { RadarCard } from "@/components/models/RadarCard";
import { ScoreCard } from "@/components/models/ScoreCard";
import { ScoreBar } from "@/components/models/ScoreBar";

export async function generateStaticParams() {
  return Object.keys(models).map((id) => ({ slug: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModel(slug);
  if (!model) {
    return { title: "模型未找到 | OpenModelRank" };
  }
  return {
    title: `${model.name} Benchmark跑分 | OpenModelRank`,
    description: `${model.name} 在 SWE-bench、GPQA、HLE、AIME 等主流评测中的完整跑分数据。${model.description}`,
  };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getModel(slug);

  if (!model) {
    notFound();
  }

  const scores = getModelBenchmarkScores(model.id);

  const benchmarkList = Object.values(benchmarks);

  return (
    <div className="space-y-8">
      <ModelHeader modelId={model.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RadarCard modelId={model.id} benchmarkScores={scores} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benchmarkList.map((bm) => {
            const entry = scores[bm.id];
            return (
              <ScoreCard
                key={bm.id}
                benchmarkId={bm.id}
                score={entry}
              />
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          同类模型对比
        </h2>
        <div className="space-y-3">
          {benchmarkList.slice(0, 6).map((bm) => {
            const topModels = getTopModels(bm.id, 4);
            const modelEntry = topModels.find((m) => m.modelId === model.id);
            const maxScore = Math.max(...topModels.map((m) => m.score), 1);

            if (topModels.length === 0) return null;

            return (
              <div key={bm.id}>
                <p className="text-sm text-[var(--color-muted)] mb-2 font-medium">
                  {bm.name}
                </p>
                <div className="space-y-1.5">
                  {topModels.map((m) => (
                    <ScoreBar
                      key={m.modelId}
                      label={models[m.modelId]?.name ?? m.modelId}
                      score={m.score}
                      maxScore={maxScore}
                      unit={bm.unit}
                      rank={topModels.indexOf(m) + 1}
                      total={topModels.length}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-[var(--color-muted)] border-t border-[var(--color-border)] pt-6">
        数据来源：各模型官方公布的评测数据、Artificial Analysis Intelligence
        Index v4.0。部分数据为厂商自行报告，可能存在测试条件差异，仅供参考。最后更新：2026年5月。
      </p>
    </div>
  );
}
