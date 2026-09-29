import { DOMAINS, QUESTIONS, practiceQuestions, type DomainId, type Question, type ScenarioId, type TaskStatementId } from '../content';
import { confidentErrorIds, weakestTaskStatements } from './stats';
import { sample, shuffle } from './shuffle';
import type { ProgressState } from '../store/types';

export type PracticeMode = 'domain' | 'taskStatement' | 'scenario' | 'mixed' | 'weak' | 'mechanism';

export interface PracticeConfig {
  mode: PracticeMode;
  domain?: DomainId;
  taskStatement?: TaskStatementId;
  scenario?: ScenarioId;
  count: number | 'all';
  includeQuickchecks: boolean;
}

function basePool(includeQuickchecks: boolean): Question[] {
  return includeQuickchecks ? QUESTIONS.slice() : practiceQuestions();
}

function take(pool: Question[], count: number | 'all'): Question[] {
  if (count === 'all') return shuffle(pool);
  return sample(pool, count);
}

/** Interleaved draw across domains, weighted by exam weight (rounded, at least 1 per domain that has questions). */
function mixedPool(pool: Question[], count: number): Question[] {
  const byDomain = new Map<DomainId, Question[]>();
  for (const q of pool) {
    const arr = byDomain.get(q.domain) ?? [];
    arr.push(q);
    byDomain.set(q.domain, arr);
  }
  const totalWeight = DOMAINS.reduce((s, d) => s + (byDomain.has(d.id) ? d.weight : 0), 0) || 1;
  const picks: Question[] = [];
  for (const d of DOMAINS) {
    const domainQuestions = byDomain.get(d.id);
    if (!domainQuestions?.length) continue;
    const share = Math.max(1, Math.round((d.weight / totalWeight) * count));
    picks.push(...sample(domainQuestions, share));
  }
  // Interleave rather than leaving them grouped by domain.
  return shuffle(picks).slice(0, count);
}

export function buildPracticeSession(state: ProgressState, config: PracticeConfig): Question[] {
  const pool = basePool(config.includeQuickchecks);
  const count = config.count;

  switch (config.mode) {
    case 'domain': {
      const filtered = config.domain ? pool.filter((q) => q.domain === config.domain) : [];
      return take(filtered, count);
    }
    case 'taskStatement': {
      const filtered = config.taskStatement
        ? pool.filter((q) => q.taskStatements.includes(config.taskStatement!))
        : [];
      return take(filtered, count);
    }
    case 'scenario': {
      const filtered = config.scenario ? pool.filter((q) => q.scenario === config.scenario) : [];
      return take(filtered, count);
    }
    case 'mixed': {
      const n = count === 'all' ? pool.length : count;
      return mixedPool(pool, n);
    }
    case 'weak': {
      const weakIds = new Set(weakestTaskStatements(state, 8).map((w) => w.id));
      const confidentErrors = new Set(confidentErrorIds(state));
      const priority = pool.filter((q) => confidentErrors.has(q.id));
      const rest = pool.filter((q) => !confidentErrors.has(q.id) && q.taskStatements.some((t) => weakIds.has(t)));
      const combined = [...shuffle(priority), ...shuffle(rest)];
      return count === 'all' ? combined : combined.slice(0, count);
    }
    case 'mechanism': {
      const filtered = pool.filter((q) => q.id.startsWith('mech-'));
      return take(filtered, count);
    }
    default:
      return [];
  }
}

export function poolSizeFor(config: Omit<PracticeConfig, 'count'>, state: ProgressState): number {
  return buildPracticeSession(state, { ...config, count: 'all' }).length;
}
