'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { searchModels } from '@/lib/search';
import type { Model } from '@/types';

export function Header() {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<Model[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSearch(val: string) {
    setSearchValue(val);
    if (val.trim()) {
      setResults(searchModels(val));
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 hover:no-underline">
            <Bot className="h-6 w-6 text-[var(--color-accent)]" />
            <span className="text-lg font-semibold text-[var(--color-foreground)] tracking-tight">
              OpenModelRank
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div ref={searchRef} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="搜索模型..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchValue.trim() && setShowResults(true)}
                className={cn(
                  'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
                  'py-2 pl-10 pr-4 text-sm text-[var(--color-foreground)]',
                  'placeholder:text-[var(--color-muted)]',
                  'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
                  'transition-colors'
                )}
              />
              {showResults && results.length > 0 && (
                <div className="absolute top-full mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden z-50">
                  {results.slice(0, 8).map((m) => (
                    <Link
                      key={m.id}
                      href={`/models/${m.id}`}
                      onClick={() => { setShowResults(false); setSearchValue(''); }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors hover:no-underline"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: m.providerColor }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-[var(--color-foreground)] truncate">{m.name}</span>
                        <span className="text-xs text-[var(--color-muted)]">{m.provider}</span>
                      </div>
                    </Link>
                  ))}
                  {results.length > 8 && (
                    <div className="px-4 py-2 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]">
                      +{results.length - 8} 个更多结果
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 shrink-0">
            <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors hover:no-underline">
              排行榜
            </Link>
            <Link href="/compare" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors hover:no-underline">
              对比
            </Link>
            <Link href="/arena" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors hover:no-underline">
              竞技场
            </Link>
            <Link href="/about" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors hover:no-underline">
              关于
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-4">
          <div className="relative mt-3 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
            <input
              type="text"
              placeholder="搜索模型..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className={cn(
                'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
                'py-2 pl-10 pr-4 text-sm text-[var(--color-foreground)]',
                'placeholder:text-[var(--color-muted)]',
                'focus:outline-none focus:border-[var(--color-accent)]'
              )}
            />
            {searchValue.trim() && results.length > 0 && (
              <div className="mt-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden">
                {results.slice(0, 5).map((m) => (
                  <Link
                    key={m.id}
                    href={`/models/${m.id}`}
                    onClick={() => { setMobileMenuOpen(false); setSearchValue(''); setResults([]); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors hover:no-underline"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: m.providerColor }}
                    />
                    <span className="text-sm text-[var(--color-foreground)]">{m.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] py-2 transition-colors hover:no-underline"
            >
              排行榜
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] py-2 transition-colors hover:no-underline"
            >
              对比
            </Link>
            <Link
              href="/arena"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] py-2 transition-colors hover:no-underline"
            >
              竞技场
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] py-2 transition-colors hover:no-underline"
            >
              关于
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
