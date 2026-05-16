export type ArenaCategory =
  | 'math' | 'coding' | 'knowledge' | 'reasoning' | 'instruction'
  | 'agent' | 'creative' | 'roleplay';

export interface ArenaQuestion {
  id: string;
  category: ArenaCategory;
  question: string;
  scoringRubric: string;
  maxScore: number;
  referenceAnswer: string;
}

export const ARENA_CATEGORY_NAMES: Record<ArenaCategory, string> = {
  math: '数学',
  coding: '编程',
  knowledge: '知识',
  reasoning: '推理',
  instruction: '指令遵循',
  agent: '代理',
  creative: '创意写作',
  roleplay: '角色扮演',
};

export const ARENA_CATEGORY_COLORS: Record<ArenaCategory, string> = {
  math: '#f59e0b',
  coding: '#10b981',
  knowledge: '#6366f1',
  reasoning: '#ec4899',
  instruction: '#06b6d4',
  agent: '#8b5cf6',
  creative: '#f97316',
  roleplay: '#14b8a6',
};

import { mathQuestions } from './math';
import { codingQuestions } from './coding';
import { knowledgeQuestions } from './knowledge';
import { reasoningQuestions } from './reasoning';
import { instructionQuestions } from './instruction';
import { agentQuestions } from './agent';
import { creativeQuestions } from './creative';
import { roleplayQuestions } from './roleplay';

export const arenaQuestions: ArenaQuestion[] = [
  ...mathQuestions,
  ...codingQuestions,
  ...knowledgeQuestions,
  ...reasoningQuestions,
  ...instructionQuestions,
  ...agentQuestions,
  ...creativeQuestions,
  ...roleplayQuestions,
];

export function getArenaQuestionsByCategory(category: ArenaCategory): ArenaQuestion[] {
  return arenaQuestions.filter((q) => q.category === category);
}

export function getAllArenaCategories(): ArenaCategory[] {
  return [...new Set(arenaQuestions.map((q) => q.category))];
}
