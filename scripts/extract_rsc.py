"""Extract all model+benchmark data from AA and convert to actual scores."""

import urllib.request
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://artificialanalysis.ai/leaderboards/models"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

# Find RSC script block with data
script_blocks = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
data_block = None
for script in script_blocks:
    if 'intelligenceIndex' in script and len(script) > 100000:
        data_block = script
        break

# Unescape RSC format
content = data_block
data_start = content.find(',"')
if data_start > 0:
    content = content[data_start + 2:-2]
content = content.replace('\\"', '"')
content = content.replace('\\\\', '\\')

# Extract complete model entries with all fields
# The model object includes: id, name, shortName, slug, modelCreatorName,
# and score fields: intelligenceIndex, codingIndex, agenticIndex, gpqa, hle,
# scicode, ifbench, tau2, terminalbenchHard, lcr, omniscience, omniscienceAccuracy,
# gdpvalNormalized, mmmuPro, critpt

# Use a comprehensive regex to extract each model entry
# The entry starts with {"id":"UUID" and ends at the next {"id":"UUID" or end of array

# Split by model entries
model_chunks = re.split(r'(?=\{"id":"[0-9a-f]{8}-)', content)

# Filter to only chunks that look like model entries
model_data = []
for chunk in model_chunks:
    if not chunk.startswith('{"id":"'):
        continue

    # Extract fields
    entry = {}

    # Basic info
    for field in ['id', 'name', 'shortName', 'slug', 'modelCreatorName', 'modelCreatorSlug',
                  'modelCreatorCountry', 'modelCreatorColor', 'releaseDate']:
        match = re.search(rf'"{field}":"([^"]*)"', chunk)
        if match:
            entry[field] = match.group(1)

    # Boolean fields
    for field in ['reasoningModel', 'deprecated']:
        match = re.search(rf'"{field}":(true|false)', chunk)
        if match:
            entry[field] = match.group(1) == 'true'

    # Numeric score fields
    score_fields = [
        'intelligenceIndex', 'codingIndex', 'agenticIndex',
        'gpqa', 'hle', 'scicode', 'ifbench', 'tau2',
        'terminalbenchHard', 'lcr', 'omniscience', 'omniscienceAccuracy',
        'gdpvalNormalized', 'mmmuPro', 'critpt',
    ]
    for field in score_fields:
        match = re.search(rf'"{field}":([\d.eE+-]+)', chunk)
        if match:
            try:
                entry[field] = float(match.group(1))
            except ValueError:
                pass

    if entry.get('slug'):
        model_data.append(entry)

print(f"Extracted {len(model_data)} models with scores")

# Show some examples
print("\n=== Sample data (top models by intelligenceIndex) ===")
model_data.sort(key=lambda x: x.get('intelligenceIndex', 0), reverse=True)

for m in model_data[:25]:
    name = m.get('shortName', m.get('name', '?'))
    provider = m.get('modelCreatorName', '?')
    ii = m.get('intelligenceIndex', 0)
    gpqa = m.get('gpqa', 0)
    hle = m.get('hle', 0)
    scicode = m.get('scicode', 0)
    ifbench = m.get('ifbench', 0)
    tau2 = m.get('tau2', 0)
    terminal = m.get('terminalbenchHard', 0)
    lcr = m.get('lcr', 0)
    omnisci = m.get('omniscienceAccuracy', 0)
    gdpval = m.get('gdpvalNormalized', 0)

    print(f"\n  {name} ({provider})")
    print(f"    II={ii:.1f} GPQA={gpqa:.4f} HLE={hle:.4f} SciCode={scicode:.4f}")
    print(f"    IFBench={ifbench:.4f} tau2={tau2:.4f} Term={terminal:.4f} LCR={lcr:.4f}")
    print(f"    Omnisci={omnisci:.4f} GDPval={gdpval:.4f}")

# Check if the scores are raw percentages or normalized
# Look at known values
print("\n=== Checking score normalization ===")
for m in model_data:
    if m.get('slug') == 'gpt-5-5':
        print(f"\nGPT-5.5 scores:")
        for k, v in m.items():
            if isinstance(v, float):
                print(f"  {k}: {v}")
        break

# Save full data
output_path = "E:/free_api/model-leaderboard/scripts/aa-full-data.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(model_data, f, indent=2, ensure_ascii=False)
print(f"\nFull data saved to {output_path}")
