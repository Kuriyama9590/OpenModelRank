export function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">OpenModelRank</span>
            <span className="text-xs text-[var(--color-muted)]">大模型能力排行榜</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--color-muted)]">
            <a href="/about" className="hover:text-[var(--color-foreground)] transition-colors">关于</a>
            <a href="https://github.com" className="hover:text-[var(--color-foreground)] transition-colors">GitHub</a>
            <span>&copy; 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
