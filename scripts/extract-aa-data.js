/**
 * Browser Console Script - Extract AA Benchmark Data
 *
 * Usage:
 * 1. Open https://artificialanalysis.ai/leaderboards/models in your browser
 * 2. Open Developer Tools (F12)
 * 3. Paste this entire script into the Console tab
 * 4. Press Enter to run
 * 5. Copy the output JSON and save to scripts/aa-data.json
 *
 * The script will extract all visible model data from the page.
 */

(async function extractAAData() {
  console.log('=== Extracting AA Benchmark Data ===');

  // Helper: wait for ms
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Try to find the data in React fiber tree
  function getReactFiber(element) {
    const key = Object.keys(element).find(k =>
      k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
    );
    return key ? element[key] : null;
  }

  function getReactProps(element) {
    const key = Object.keys(element).find(k =>
      k.startsWith('__reactProps$')
    );
    return key ? element[key] : null;
  }

  // Extract data from the page's global state or React components
  let data = {};

  // Method 1: Look for data in window/global scope
  const globalKeys = Object.keys(window).filter(k =>
    k.includes('data') || k.includes('model') || k.includes('bench') || k.includes('score')
  );
  console.log('Potential global data keys:', globalKeys);

  // Method 2: Extract from visible table/chart elements
  // The leaderboard page shows models in a table or chart
  const rows = document.querySelectorAll('tr, [role="row"]');
  console.log(`Found ${rows.length} table rows`);

  // Method 3: Look for the data in the page's script tags
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const text = script.textContent;
    if (text.includes('intelligenceIndex') || text.includes('modelScores')) {
      console.log('Found data script:', text.substring(0, 200));
    }
  }

  // Method 4: Extract from structured data (JSON-LD)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  const structuredData = [];
  for (const script of jsonLdScripts) {
    try {
      const d = JSON.parse(script.textContent);
      structuredData.push(d);
    } catch (e) {}
  }
  console.log(`Found ${structuredData.length} JSON-LD blocks`);

  // Method 5: Intercept fetch/XHR for future requests
  const capturedResponses = [];
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && (url.includes('api') || url.includes('data') || url.includes('eval'))) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        capturedResponses.push({ url, data });
        console.log('Captured API response:', url);
      } catch (e) {}
    }
    return response;
  };

  // Method 6: Extract Intelligence Index from the chart data
  // The chart renders SVG elements with data
  const svgElements = document.querySelectorAll('svg');
  console.log(`Found ${svgElements.length} SVG elements (charts)`);

  // Method 7: Extract from the visible model cards/list
  const modelElements = document.querySelectorAll('[class*="model"], [class*="Model"], [data-model]');
  console.log(`Found ${modelElements.length} model elements`);

  // Method 8: Parse visible text for benchmark data
  const bodyText = document.body.innerText;
  const lines = bodyText.split('\n').filter(l => l.trim());

  // Look for model names and their scores
  const modelPatterns = [
    /GPT-5\.5/i, /Claude Opus 4\.7/i, /Gemini 3\.1/i, /Kimi K2\.6/i,
    /DeepSeek V4/i, /GLM-5/i, /Grok 4/i, /Qwen3\.6/i, /MiniMax/i,
    /MiMo/i, /ERNIE/i, /Doubao/i, /Step 3/i, /Hunyuan/i
  ];

  const benchmarkNames = [
    'GPQA Diamond', 'HLE', "Humanity's Last Exam", 'MMLU-Pro', 'AIME',
    'GDPval', 'tau2', 'Terminal-Bench', 'AA-LCR', 'SciCode',
    'IFBench', 'Omniscience', 'Intelligence Index', 'SWE-bench',
    'LiveCodeBench', 'HumanEval'
  ];

  console.log('\n=== Visible Text Analysis ===');
  for (const name of benchmarkNames) {
    const idx = bodyText.indexOf(name);
    if (idx >= 0) {
      const context = bodyText.substring(Math.max(0, idx - 50), idx + 100);
      console.log(`Found "${name}" in text: ...${context}...`);
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log('Structured data blocks:', structuredData.length);
  console.log('Captured API responses:', capturedResponses.length);

  if (structuredData.length > 0) {
    console.log('\nStructured data:');
    for (const d of structuredData) {
      console.log(`  ${d.name}: ${d.data?.length || 0} entries`);
      if (d.data && d.data.length > 0) {
        console.log('  Sample:', JSON.stringify(d.data[0]));
      }
    }
  }

  // Return the data
  return {
    structuredData,
    capturedResponses,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
})();
