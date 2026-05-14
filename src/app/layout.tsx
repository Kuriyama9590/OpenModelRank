import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "OpenModelRank - 大模型能力排行榜",
  description:
    "客观、全面的AI大模型Benchmark跑分排行榜。覆盖SWE-bench、GPQA、HLE、AIME等主流评测，支持GPT-5.5、Claude Opus 4.7、DeepSeek V4等热门模型对比。",
  keywords:
    "大模型排名,AI模型排行榜,LLM Benchmark,GPT-5.5,Claude,DeepSeek,SWE-bench",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body>
        <Header />
        <main className="min-h-screen px-4 py-6 max-w-7xl mx-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
