"""
Artificial Analysis Benchmark Data Scraper
Uses Playwright to intercept API calls and scrape model benchmark scores

Usage:
  pip install playwright
  playwright install chromium
  python scripts/scrape-aa.py
"""

import json
import asyncio
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Please install playwright first:")
    print("  pip install playwright")
    print("  playwright install chromium")
    exit(1)

# Model URL slugs on artificialanalysis.ai -> our model IDs
MODEL_SLUGS = [
    ("gpt-5-5", "gpt-5-5"),
    ("gpt-5-4", "gpt-5-4"),
    ("gpt-5-2", "gpt-5-2"),
    ("gpt-5-2-codex", "gpt-5-2-codex"),
    ("gpt-5", "gpt-5"),
    ("gpt-oss-120b", "gpt-oss-120b"),
    ("claude-opus-4-7", "claude-opus-4-7"),
    ("claude-opus-4-6-adaptive", "claude-opus-4-6"),
    ("claude-sonnet-4-7", "claude-sonnet-4-7"),
    ("gemini-3-1-pro-preview", "gemini-3-1-pro"),
    ("gemini-3-flash", "gemini-3-flash"),
    ("grok-4-3", "grok-4-3"),
    ("kimi-k2-6", "kimi-k2-6"),
    ("kimi-k2-5", "kimi-k2-5"),
    ("deepseek-v4-pro", "deepseek-v4-pro"),
    ("deepseek-v4-flash", "deepseek-v4-flash"),
    ("deepseek-v3-2", "deepseek-v3-2"),
    ("deepseek-r1", "deepseek-r1"),
    ("glm-5-1", "glm-5-1"),
    ("glm-5", "glm-5"),
    ("minimax-m2-5", "minimax-m2-5"),
    ("minimax-m2-7", "minimax-m2-7"),
    ("mimo-v2-5-pro", "mimo-v2-5"),
    ("qwen3-6-plus", "qwen3-6-plus"),
    ("qwen3-6-max", "qwen3-6-max"),
    ("qwen3-235b", "qwen3-235b"),
    ("qwen3-coder-480b", "qwen3-coder-480b"),
    ("nvidia-nemotron-3-super-120b-a12b", "nemotron-3-super"),
    ("llama-4-maverick", "llama-4-maverick"),
    ("mistral-medium-3-5", "mistral-medium-3-5"),
    ("hy3-preview", "hy3-preview"),
    ("ernie-5-thinking", "ernie-5-thinking"),
    ("doubao-seed-code", "doubao-seed-code"),
    ("step-3-5-flash", "step-3-5-flash"),
    ("glm-5-turbo", "glm-5-turbo"),
]

BASE_URL = "https://artificialanalysis.ai"


async def scrape_leaderboard_page(page) -> dict:
    """
    Scrape the main leaderboard page which shows all models and their
    Intelligence Index scores in structured data.
    """
    print("\nFetching main leaderboard page...")
    api_responses = []

    # Intercept API responses
    async def handle_response(response):
        url = response.url
        if "api" in url or "data" in url:
            try:
                ct = response.headers.get("content-type", "")
                if "json" in ct:
                    data = await response.json()
                    api_responses.append({"url": url, "data": data})
            except Exception:
                pass

    page.on("response", handle_response)

    try:
        await page.goto(f"{BASE_URL}/leaderboards/models", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
    except Exception as e:
        print(f"  Error: {e}")

    page.remove_listener("response", handle_response)

    if api_responses:
        print(f"  Captured {len(api_responses)} API responses")
        for r in api_responses:
            print(f"    {r['url']}")

    return api_responses


async def scrape_model_page(page, slug: str, model_id: str) -> dict:
    """Scrape a single model page, intercepting API calls."""
    url = f"{BASE_URL}/models/{slug}"
    api_responses = []
    scores = {}

    async def handle_response(response):
        url = response.url
        try:
            ct = response.headers.get("content-type", "")
            if "json" in ct and response.status == 200:
                data = await response.json()
                api_responses.append({"url": url, "data": data})
        except Exception:
            pass

    page.on("response", handle_response)

    try:
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
    except Exception as e:
        print(f"    Page load error: {e}")

    page.remove_listener("response", handle_response)

    # Also extract visible text scores as fallback
    try:
        text = await page.evaluate("() => document.body.innerText")

        import re
        # Look for patterns like "GPQA Diamond ... 93.2" or "HLE ... 43.0%"
        benchmark_patterns = {
            "GPQA Diamond": "gpqa-diamond",
            "Humanity's Last Exam": "hle",
            "MMLU-Pro": "mmlu-pro",
            "AIME 2025": "aime",
            "GDPval-AA": "gdpval-aa",
            "τ²-Bench": "tau2-bench",
            "Terminal-Bench": "terminal-bench",
            "AA-LCR": "aa-lcr",
            "SciCode": "scicode",
            "IFBench": "ifbench",
            "AA-Omniscience": "aa-omniscience",
            "Intelligence Index": "aa-intelligence",
        }

        for bench_name, bench_id in benchmark_patterns.items():
            # Find the benchmark name in text, then look for a nearby number
            pattern = re.escape(bench_name) + r'[^\n]*?(\d+(?:,\d{3})*(?:\.\d+)?)\s*%?'
            match = re.search(pattern, text)
            if match:
                score_str = match.group(1).replace(',', '')
                try:
                    score = float(score_str)
                    if score > 0:
                        scores[bench_id] = score
                except ValueError:
                    pass
    except Exception as e:
        print(f"    Text extraction error: {e}")

    return {"api_responses": api_responses, "scores": scores}


async def main():
    print("=" * 60)
    print("Artificial Analysis Benchmark Data Scraper")
    print("=" * 60)

    all_results = {}
    all_api_data = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # First, scrape the main leaderboard page
        leaderboard_responses = await scrape_leaderboard_page(page)
        all_api_data.extend(leaderboard_responses)

        # Then scrape individual model pages
        for i, (slug, model_id) in enumerate(MODEL_SLUGS):
            print(f"\n[{i+1}/{len(MODEL_SLUGS)}] Scraping {model_id} ({slug})...")
            result = await scrape_model_page(page, slug, model_id)

            if result["api_responses"]:
                all_api_data.extend(result["api_responses"])
                print(f"    Captured {len(result['api_responses'])} API responses")

            if result["scores"]:
                all_results[model_id] = result["scores"]
                print(f"    Found scores: {result['scores']}")
            else:
                print(f"    No scores extracted from text")

            # Small delay to be polite
            await page.wait_for_timeout(1000)

        await browser.close()

    # Save all captured API data
    api_path = Path(__file__).parent / "api-responses.json"
    with open(api_path, "w", encoding="utf-8") as f:
        json.dump(all_api_data, f, indent=2, ensure_ascii=False)
    print(f"\nAPI responses saved to {api_path}")

    # Save extracted scores
    scores_path = Path(__file__).parent / "scraped-scores.json"
    with open(scores_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print(f"Extracted scores saved to {scores_path}")

    # Generate TypeScript additions
    ts_lines = []
    ts_lines.append("  // ========== Scraped from artificialanalysis.ai (2026-05-14) ==========")

    for model_id, scores in sorted(all_results.items()):
        for bench_id, score in sorted(scores.items()):
            ts_lines.append(
                f"  {{ modelId: '{model_id}', benchmarkId: '{bench_id}', "
                f"score: {score}, date: '2026-05-14', verified: true }},"
            )

    ts_path = Path(__file__).parent / "scraped-additions.ts"
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write("\n".join(ts_lines))
    print(f"TypeScript additions saved to {ts_path}")

    # Print summary
    print(f"\n{'=' * 60}")
    print(f"Summary: {len(all_results)} models with scores")
    for model_id, scores in sorted(all_results.items()):
        print(f"  {model_id}: {len(scores)} benchmarks")


if __name__ == "__main__":
    asyncio.run(main())
