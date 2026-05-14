"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, DollarSign, Clock, BarChart3, Cpu } from "lucide-react";
import { models } from "@/data/models";
import { ModelPicker } from "@/components/compare/ModelPicker";
import { CompareTable } from "@/components/compare/CompareTable";
import { RadarOverlay } from "@/components/compare/RadarOverlay";
import { SpeedPriceChart } from "@/components/compare/SpeedPriceChart";
import { cn } from "@/lib/cn";

type TabId = 'benchmark' | 'speed' | 'price' | 'latency' | 'context';

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'benchmark', label: 'Benchmark', icon: BarChart3 },
  { id: 'speed', label: '速度', icon: Zap },
  { id: 'price', label: '价格', icon: DollarSign },
  { id: 'latency', label: '延迟', icon: Clock },
  { id: 'context', label: '上下文', icon: Cpu },
];

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('benchmark');

  const modelIdsParam = searchParams.get("models") ?? "";
  const selectedIds = modelIdsParam
    .split(",")
    .filter((id) => id && models[id]);

  const selectedModels = selectedIds.map((id) => models[id]);

  const handleModelsChange = useCallback(
    (ids: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length > 0) {
        params.set("models", ids.join(","));
      } else {
        params.delete("models");
      }
      router.replace(`/compare?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">模型对比</h1>

      <ModelPicker selected={selectedIds} onChange={handleModelsChange} />

      {selectedModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-[var(--color-muted)]" />
          </div>
          <p className="text-[var(--color-muted)] text-lg">选择2-4个模型开始对比</p>
          <p className="text-[var(--color-muted)] text-sm mt-1">在上方搜索框中输入模型名称进行选择</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)] bg-[var(--color-surface)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <RadarOverlay modelIds={selectedIds} />
              <CompareTable modelIds={selectedIds} />
            </div>
          )}

          {activeTab === 'speed' && (
            <SpeedPriceChart modelIds={selectedIds} metric="speed" />
          )}

          {activeTab === 'price' && (
            <SpeedPriceChart modelIds={selectedIds} metric="price" />
          )}

          {activeTab === 'latency' && (
            <SpeedPriceChart modelIds={selectedIds} metric="latency" />
          )}

          {activeTab === 'context' && (
            <SpeedPriceChart modelIds={selectedIds} metric="context" />
          )}
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-[var(--color-muted)]">加载中...</div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
