import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 | OpenModelRank",
  description: "OpenModelRank - 客观全面的AI大模型能力排行榜。",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <h1 className="text-3xl font-bold tracking-tight">关于 OpenModelRank</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">我们的使命</h2>
        <p className="text-[var(--color-muted)] leading-relaxed">
          OpenModelRank 致力于提供最客观、最全面的AI大模型能力评测数据。
          我们汇总来自SWE-bench、GPQA Diamond、HLE、AIME、MMLU-Pro、
          Artificial Analysis等多个权威评测的数据，帮助开发者和研究者
          快速了解各模型在不同领域的真实表现。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">数据来源</h2>
        <ul className="list-disc list-inside space-y-2 text-[var(--color-muted)]">
          <li><a href="https://www.swebench.com" target="_blank" rel="noopener noreferrer">SWE-bench</a> — 代码修复能力评测</li>
          <li><a href="https://artificialanalysis.ai" target="_blank" rel="noopener noreferrer">Artificial Analysis</a> — 综合智能指数及多项独立评测</li>
          <li><a href="https://github.com/idavidrein/gpqa" target="_blank" rel="noopener noreferrer">GPQA Diamond</a> — 研究生级科学推理</li>
          <li><a href="https://lastexam.ai" target="_blank" rel="noopener noreferrer">HLE</a> — Humanity&apos;s Last Exam</li>
          <li><a href="https://github.com/TIGER-AI-Lab/MMLU-Pro" target="_blank" rel="noopener noreferrer">MMLU-Pro</a> — 多学科专业知识</li>
          <li>AIME / LiveCodeBench 等 — 各模型官方技术报告</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">免责声明</h2>
        <p className="text-[var(--color-muted)] leading-relaxed">
          本网站数据来自公开渠道（模型官方技术报告、学术论文、第三方评测机构）。
          部分数据为厂商自行报告，测试条件和评估框架可能存在差异，分数不可直接横向对比。
          数据仅供参考，不构成任何商业推荐。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">更新频率</h2>
        <p className="text-[var(--color-muted)] leading-relaxed">
          数据随新模型发布持续更新。如发现数据错误或遗漏，欢迎联系我们。
        </p>
      </section>

      <div className="border-t border-[var(--color-border)] pt-6">
        <p className="text-sm text-[var(--color-muted)]">
          © 2026 OpenModelRank
        </p>
      </div>
    </div>
  );
}
