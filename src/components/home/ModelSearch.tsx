'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModelSearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function ModelSearch({ value, onChange, placeholder = '搜索模型...' }: ModelSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
          'py-2.5 pl-10 pr-4 text-sm text-[var(--color-foreground)]',
          'placeholder:text-[var(--color-muted)]',
          'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
          'transition-colors'
        )}
      />
    </div>
  );
}
