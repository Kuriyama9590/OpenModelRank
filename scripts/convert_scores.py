"""Convert normalized AA scores to actual percentages and generate TS code."""

import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load the extracted data
with open("E:/free_api/model-leaderboard/scripts/aa-full-data.json", "r", encoding="utf-8") as f:
    all_models = json.load(f)

# Slug mapping: AA slug -> our model ID
SLUG_MAP = {
    "gpt-5-5": "gpt-5-5",
    "gpt-5-4": "gpt-5-4",
    "gpt-5-2": "gpt-5-2",
    "gpt-5-2-codex": "gpt-5-2-codex",
    "gpt-5": "gpt-5",
    "gpt-oss-120b": "gpt-oss-120b",
    "claude-opus-4-7": "claude-opus-4-7",
    "claude-opus-4-6": "claude-opus-4-6",
    "claude-sonnet-4-7": "claude-sonnet-4-7",
    "gemini-3-1-pro": "gemini-3-1-pro",
    "gemini-3-flash": "gemini-3-flash",
    "grok-4-3": "grok-4-3",
    "kimi-k2-6": "kimi-k2-6",
    "kimi-k2-5": "kimi-k2-5",
    "deepseek-v4-pro": "deepseek-v4-pro",
    "deepseek-v4-flash": "deepseek-v4-flash",
    "deepseek-v3-2": "deepseek-v3-2",
    "deepseek-r1": "deepseek-r1",
    "glm-5-1": "glm-5-1",
    "glm-5": "glm-5",
    "minimax-m2-5": "minimax-m2-5",
    "minimax-m2-7": "minimax-m2-7",
    "mimo-v2-5": "mimo-v2-5",
    "qwen3-6-plus": "qwen3-6-plus",
    "qwen3-6-max": "qwen3-6-max",
    "qwen3-235b": "qwen3-235b",
    "qwen3-coder-480b": "qwen3-coder-480b",
    "nemotron-3-super": "nemotron-3-super",
    "llama-4-maverick": "llama-4-maverick",
    "mistral-medium-3-5": "mistral-medium-3-5",
    "hy3-preview": "hy3-preview",
    "ernie-5-thinking": "ernie-5-thinking",
    "doubao-seed-code": "doubao-seed-code",
    "step-3-5-flash": "step-3-5-flash",
    "glm-5-turbo": "glm-5-turbo",
    "gpt-5-5-pro": "gpt-5-5-pro",
    "claude-sonnet-4-6": "claude-sonnet-4-6",
}

# Our existing verified scores for calibration
EXISTING = {
    "gpt-5-5": {"gpqa": 93.2, "hle": 43.0, "tau2": 93.0, "terminal-bench": 59.8, "aa-omniscience": 56.9},
    "claude-opus-4-7": {"gpqa": 91.4, "hle": 39.6, "tau2": 88.6, "terminal-bench": 51.5, "aa-omniscience": 45.8},
    "gemini-3-1-pro": {"gpqa": 94.1, "hle": 44.7, "tau2": 95.6, "terminal-bench": 53.8, "aa-omniscience": 55.2},
}

# Benchmark field mapping: AA field -> our benchmark ID
BENCH_MAP = {
    "gpqa": "gpqa-diamond",
    "hle": "hle",
    "scicode": "scicode",
    "ifbench": "ifbench",
    "tau2": "tau2-bench",
    "terminalbenchHard": "terminal-bench",
    "lcr": "aa-lcr",
    "omniscienceAccuracy": "aa-omniscience",
    "gdpvalNormalized": "gdpval-aa",
    "mmmuPro": "mmlu-pro",
}

# Verify conversion: normalized * 100 ≈ actual?
print("=== Conversion Verification ===")
for model_id, known in EXISTING.items():
    aa_model = None
    for m in all_models:
        if SLUG_MAP.get(m.get("slug")) == model_id:
            aa_model = m
            break
    if not aa_model:
        continue

    print(f"\n{model_id}:")
    for aa_field, our_bench in BENCH_MAP.items():
        norm_val = aa_model.get(aa_field)
        if norm_val is None or our_bench not in known:
            continue
        actual = known[our_bench]
        converted = round(norm_val * 100, 1)
        diff = abs(converted - actual)
        flag = "OK" if diff < 2 else f"MISMATCH (diff={diff:.1f})"
        print(f"  {our_bench:20} norm={norm_val:.4f} *100={converted:6.1f} actual={actual:6.1f} {flag}")
