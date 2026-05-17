'use client';

import { useState } from 'react';
import { Loader2, Zap, Plug, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ArenaFormProps {
  onSubmit: (config: { apiUrl: string; modelName: string; apiKey: string; concurrency: number }) => void;
  isRunning: boolean;
  initialConfig?: { apiUrl: string; modelName: string; apiKey: string; concurrency: number };
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const CONCURRENCY_OPTIONS = [1, 2, 4, 8] as const;

export function ArenaForm({ onSubmit, isRunning, initialConfig }: ArenaFormProps) {
  const [apiUrl, setApiUrl] = useState(initialConfig?.apiUrl ?? '');
  const [modelName, setModelName] = useState(initialConfig?.modelName ?? '');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? '');
  const [concurrency, setConcurrency] = useState(initialConfig?.concurrency ?? 8);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');

  const canSubmit = apiUrl.trim() && modelName.trim() && apiKey.trim() && !isRunning;

  async function handleTestConnection() {
    if (!apiUrl.trim() || !modelName.trim() || !apiKey.trim()) return;

    setTestStatus('testing');
    setTestMessage('');

    try {
      const baseUrl = apiUrl.trim().replace(/\/+$/, '');
      const url = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl}/chat/completions`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: modelName.trim(),
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        setTestStatus('error');
        setTestMessage(`HTTP ${res.status}: ${body.slice(0, 150)}`);
        return;
      }

      setTestStatus('success');
      setTestMessage('连接成功，API 可用');
    } catch (err) {
      setTestStatus('error');
      if (err instanceof Error && err.name === 'AbortError') {
        setTestMessage('连接超时（15s），请检查 API 地址');
      } else {
        setTestMessage(err instanceof Error ? err.message : '连接失败');
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ apiUrl: apiUrl.trim(), modelName: modelName.trim(), apiKey: apiKey.trim(), concurrency });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-[var(--color-muted)]">API 地址</label>
          <input
            type="text"
            placeholder="https://api.openai.com/v1"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            disabled={isRunning}
            className={cn(
              'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
              'py-2.5 px-4 text-sm text-[var(--color-foreground)]',
              'placeholder:text-[var(--color-muted)]',
              'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
              'disabled:opacity-50 transition-colors'
            )}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[var(--color-muted)]">模型名称</label>
          <input
            type="text"
            placeholder="gpt-4o, claude-sonnet-4-20250514, deepseek-chat"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            disabled={isRunning}
            className={cn(
              'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
              'py-2.5 px-4 text-sm text-[var(--color-foreground)]',
              'placeholder:text-[var(--color-muted)]',
              'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
              'disabled:opacity-50 transition-colors'
            )}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-[var(--color-muted)]">API Key</label>
        <input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={isRunning}
          className={cn(
            'w-full rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]',
            'py-2.5 px-4 text-sm text-[var(--color-foreground)]',
            'placeholder:text-[var(--color-muted)]',
            'focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]',
            'disabled:opacity-50 transition-colors'
          )}
        />
        <p className="text-xs text-[var(--color-muted)]">
          API Key 仅用于本次评测，不会被存储。支持所有兼容 OpenAI 格式的 API。
        </p>
      </div>

      {/* Concurrency */}
      <div className="space-y-2">
        <label className="text-sm text-[var(--color-muted)]">并发数</label>
        <div className="flex gap-2">
          {CONCURRENCY_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setConcurrency(n)}
              disabled={isRunning}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                concurrency === n
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-accent)]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {n === 1 ? '单轮' : `${n}并发`}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          低并发可避免大型模型长输出被截断，高并发可加快评测速度。
        </p>
      </div>

      {/* Test connection */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={!apiUrl.trim() || !modelName.trim() || !apiKey.trim() || testStatus === 'testing'}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
            'border-[var(--color-border)] text-[var(--color-muted)]',
            'hover:text-[var(--color-foreground)] hover:border-[var(--color-accent)]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {testStatus === 'testing' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <Plug className="h-4 w-4" />
              测试连接
            </>
          )}
        </button>
        {testStatus === 'success' && (
          <span className="flex items-center gap-1 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            {testMessage}
          </span>
        )}
        {testStatus === 'error' && (
          <span className="flex items-center gap-1 text-sm text-red-400">
            <XCircle className="h-4 w-4" />
            {testMessage}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          'flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-medium transition-colors',
          canSubmit
            ? 'bg-[var(--color-accent)] text-white hover:opacity-90'
            : 'bg-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed'
        )}
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            评测中...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            开始评测
          </>
        )}
      </button>
    </form>
  );
}
