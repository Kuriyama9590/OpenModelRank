import { computeCompositeRankings } from '../src/lib/rankings';
import { getModel } from '../src/data/models';

const rankings = computeCompositeRankings();
console.log('\n=== 综合排名结果 ===\n');

for (const r of rankings) {
  const m = getModel(r.modelId);
  const star = '⭐'.repeat(Math.min(5, Object.keys(r.breakdown).length));
  console.log(
    `#${r.rank.toString().padStart(2)}  ${r.total.toString().padEnd(5)} ${star}  ${m?.name.padEnd(25) ?? r.modelId}  ${m?.provider.padEnd(10) ?? ''}  [${Object.keys(r.breakdown).join(', ')}]`
  );
}

console.log(`\n总计: ${rankings.length} 个模型满足综合排名条件\n`);
