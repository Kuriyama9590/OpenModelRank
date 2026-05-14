import Fuse from 'fuse.js';
import { models } from '@/data/models';
import { Model } from '@/types';

const modelList = Object.values(models);

const fuse = new Fuse(modelList, {
  keys: ['name', 'provider', 'description', 'id'],
  threshold: 0.4,
  includeScore: true,
});

export function searchModels(query: string): Model[] {
  if (!query.trim()) return modelList;
  return fuse.search(query).map(r => r.item);
}

export function getAllModels(): Model[] {
  return modelList;
}

export function filterModels(options: {
  query?: string;
  openSource?: boolean | null;
  reasoning?: boolean | null;
}): Model[] {
  let result = [...modelList];
  if (options.query) {
    result = searchModels(options.query);
  }
  if (typeof options.openSource === 'boolean') {
    result = result.filter(m => m.isOpenSource === options.openSource);
  }
  if (typeof options.reasoning === 'boolean') {
    result = result.filter(m => m.isReasoning === options.reasoning);
  }
  return result;
}
