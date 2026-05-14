'use client';

import { cn } from '@/lib/cn';
import { getModel } from '@/data/models';

interface ModelHeaderProps {
  modelId: string;
}

export function ModelHeader({ modelId }: ModelHeaderProps) {
  const model = getModel(modelId);

  if (!model) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-8 text-center text-[var(--color-muted)]">
        模型未找到
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
            {model.name}
          </h1>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{
              backgroundColor: model.providerColor + '20',
              color: model.providerColor,
            }}
          >
            {model.provider}
          </span>
        </div>

        {model.releaseDate && (
          <p className="text-sm text-[var(--color-muted)]">
            发布日期: {model.releaseDate}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
              model.isOpenSource
                ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
            )}
          >
            {model.isOpenSource ? '开源' : '闭源'}
          </span>
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
              model.isReasoning
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                : 'bg-[var(--color-muted)]/15 text-[var(--color-muted)]'
            )}
          >
            {model.isReasoning ? '推理' : '非推理'}
          </span>
          {model.paramSize && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-muted)]/15 text-[var(--color-muted)]">
              {model.paramSize}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-muted)]/15 text-[var(--color-muted)]">
            {model.contextWindow.toLocaleString()} ctx
          </span>
        </div>

        {model.description && (
          <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-2xl">
            {model.description}
          </p>
        )}

        {(model.speedToks || model.priceBlended || model.latencyTTFT) && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-[var(--color-border)]">
            {model.speedToks && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-muted)]">速度</span>
                <span className="text-sm font-semibold text-[var(--color-foreground)] tabular-nums">{model.speedToks}</span>
                <span className="text-xs text-[var(--color-muted)]">tok/s</span>
              </div>
            )}
            {model.priceBlended !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-muted)]">价格</span>
                <span className="text-sm font-semibold text-[var(--color-foreground)] tabular-nums">${model.priceBlended}</span>
                <span className="text-xs text-[var(--color-muted)]">/M tok</span>
              </div>
            )}
            {model.latencyTTFT && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-muted)]">首字延迟</span>
                <span className="text-sm font-semibold text-[var(--color-foreground)] tabular-nums">{model.latencyTTFT}s</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
