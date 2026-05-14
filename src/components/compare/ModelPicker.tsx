'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { searchModels } from '@/lib/search';
import { getModel } from '@/data/models';
import type { Model } from '@/types';

interface ModelPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

const MAX_MODELS = 4;

export function ModelPicker({ selected, onChange }: ModelPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Model[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(val: string) {
    setQuery(val);
    if (val.trim()) {
      const allModels = searchModels(val);
      setResults(allModels.filter((m) => !selected.includes(m.id)));
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }

  function addModel(id: string) {
    if (selected.length >= MAX_MODELS || selected.includes(id)) return;
    onChange([...selected, id]);
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  function removeModel(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {selected.map((id) => {
          const model = getModel(id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: model?.providerColor }}
              />
              <span>{model?.name ?? id}</span>
              <button
                onClick={() => removeModel(id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--color-accent)]/30 transition-colors"
                aria-label={`Remove ${model?.name ?? id}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>

      {selected.length < MAX_MODELS && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder={`搜索并添加模型 (${selected.length}/${MAX_MODELS})...`}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.trim() && setShowResults(true)}
            className={cn(
              'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
              'py-2.5 pl-10 pr-4 text-sm text-[var(--color-foreground)]',
              'placeholder:text-[var(--color-muted)]',
              'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
              'transition-colors'
            )}
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden z-50">
              {results.slice(0, 8).map((m) => (
                <button
                  key={m.id}
                  onClick={() => addModel(m.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: m.providerColor }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-[var(--color-foreground)] truncate">{m.name}</span>
                    <span className="text-xs text-[var(--color-muted)]">{m.provider}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
