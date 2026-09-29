import { DOMAINS, EXAM, SCENARIOS, getQuestion, mockPool, type DomainId, type Question, type ScenarioId } from '../content';
import { sample, shuffle } from './shuffle';
import type { ActiveExam, ExamAnswer } from '../store/types';

const FULL_MINUTES = EXAM.minutes; // 120
const QUICK_MINUTES = 40;
const QUICK_COUNT = 20;
const FULL_COUNT = EXAM.items; // 60
const SCENARIOS_PER_EXAM = EXAM.scenariosPerExam; // 4

/** Mock pool with near-duplicate questions (community paraphrases of official ones) collapsed to one per group, so an exam never draws both copies. */
function dedupedMockPool(): Question[] {
  const seen = new Set<string>();
  const deduped: Question[] = [];
  for (const q of shuffle(mockPool())) {
    const key = q.duplicateOf ?? q.id;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(q);
  }
  return deduped;
}

function officialPoolByScenario(): Map<ScenarioId, Question[]> {
  const map = new Map<ScenarioId, Question[]>();
  for (const q of dedupedMockPool()) {
    if (!q.scenario) continue;
    const arr = map.get(q.scenario) ?? [];
    arr.push(q);
    map.set(q.scenario, arr);
  }
  return map;
}

function freshExamShell(mode: 'full' | 'quick', questionIds: string[], scenarioOrder: ScenarioId[], durationMinutes: number): ActiveExam {
  return {
    mode,
    questionIds,
    scenarioOrder,
    durationMinutes,
    startedAt: Date.now(),
    answers: {},
    flagged: {},
    everFlagged: {},
    changedCount: {},
    seenIntros: [],
    currentIndex: 0,
    submitted: false,
    submittedAt: null,
  };
}

/** 4 random official scenarios (of those that have questions), ~15 each, topped up to 60 if some are thin. */
export function buildFullExam(): ActiveExam {
  const byScenario = officialPoolByScenario();
  const available = [...byScenario.keys()].filter((id) => (byScenario.get(id)?.length ?? 0) > 0);
  const chosen = shuffle(available).slice(0, Math.min(SCENARIOS_PER_EXAM, available.length));
  const perScenario = chosen.length ? Math.floor(FULL_COUNT / chosen.length) : 0;

  const picked: Question[] = [];
  const usedIds = new Set<string>();
  for (const sid of chosen) {
    const pool = shuffle(byScenario.get(sid) ?? []);
    const take = pool.slice(0, perScenario);
    for (const q of take) {
      picked.push(q);
      usedIds.add(q.id);
    }
  }
  // Top up to FULL_COUNT: first from leftovers of chosen scenarios, then from any other available scenario.
  if (picked.length < FULL_COUNT) {
    const leftovers = chosen.flatMap((sid) => (byScenario.get(sid) ?? []).filter((q) => !usedIds.has(q.id)));
    for (const q of shuffle(leftovers)) {
      if (picked.length >= FULL_COUNT) break;
      picked.push(q);
      usedIds.add(q.id);
    }
  }
  if (picked.length < FULL_COUNT) {
    const others = available
      .filter((sid) => !chosen.includes(sid))
      .flatMap((sid) => byScenario.get(sid) ?? [])
      .filter((q) => !usedIds.has(q.id));
    for (const q of shuffle(others)) {
      if (picked.length >= FULL_COUNT) break;
      picked.push(q);
      usedIds.add(q.id);
    }
  }

  // Keep questions grouped in scenario blocks, in the chosen scenario order, so intro cards make sense.
  const byScenarioFinal = new Map<ScenarioId, Question[]>();
  for (const q of picked) {
    if (!q.scenario) continue;
    const arr = byScenarioFinal.get(q.scenario) ?? [];
    arr.push(q);
    byScenarioFinal.set(q.scenario, arr);
  }
  const orderedScenarios = [...byScenarioFinal.keys()];
  const orderedQuestionIds = orderedScenarios.flatMap((sid) => shuffle(byScenarioFinal.get(sid) ?? []).map((q) => q.id));

  return freshExamShell('full', orderedQuestionIds, orderedScenarios, FULL_MINUTES);
}

export function buildQuickExam(): ActiveExam {
  const pool = dedupedMockPool();
  const picked = sample(pool, Math.min(QUICK_COUNT, pool.length));
  const byScenario = new Map<ScenarioId, Question[]>();
  for (const q of picked) {
    if (!q.scenario) continue;
    const arr = byScenario.get(q.scenario) ?? [];
    arr.push(q);
    byScenario.set(q.scenario, arr);
  }
  const orderedScenarios = [...byScenario.keys()];
  const orderedQuestionIds = orderedScenarios.flatMap((sid) => shuffle(byScenario.get(sid) ?? [])).map((q) => q.id);
  return freshExamShell('quick', orderedQuestionIds, orderedScenarios, QUICK_MINUTES);
}

export function examEndsAt(exam: ActiveExam): number {
  return exam.startedAt + exam.durationMinutes * 60_000;
}

export function isExamExpired(exam: ActiveExam, now: number = Date.now()): boolean {
  return now >= examEndsAt(exam);
}

export function isAnswerComplete(question: Question, answer: ExamAnswer | undefined): boolean {
  return !!answer && answer.selected.length === question.selectCount;
}

export function isAnswerCorrect(question: Question, answer: ExamAnswer | undefined): boolean {
  if (!answer || answer.selected.length !== question.correct.length) return false;
  const a = [...answer.selected].sort();
  const b = [...question.correct].sort();
  return a.every((v, i) => v === b[i]);
}

export interface ExamResults {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePct: number;
  byDomain: { domain: DomainId; title: string; correct: number; total: number; pct: number | null }[];
  byScenario: { scenario: ScenarioId; title: string; correct: number; total: number; pct: number | null }[];
  first15Pct: number | null;
  restPct: number | null;
  flaggedCount: number;
  changedAfterFlagCount: number;
  changedToCorrectCount: number;
  changedToWrongCount: number;
}

export function gradeExam(exam: ActiveExam): ExamResults {
  const questions = exam.questionIds.map((id) => getQuestion(id)).filter((q): q is Question => !!q);
  let correctCount = 0;
  let answeredCount = 0;
  const byDomain = new Map<DomainId, { correct: number; total: number }>();
  const byScenario = new Map<ScenarioId, { correct: number; total: number }>();

  questions.forEach((q) => {
    const answer = exam.answers[q.id];
    const complete = isAnswerComplete(q, answer);
    const correct = complete && isAnswerCorrect(q, answer);
    if (answer && answer.selected.length > 0) answeredCount++;
    if (correct) correctCount++;

    const d = byDomain.get(q.domain) ?? { correct: 0, total: 0 };
    d.total++;
    if (correct) d.correct++;
    byDomain.set(q.domain, d);

    if (q.scenario) {
      const s = byScenario.get(q.scenario) ?? { correct: 0, total: 0 };
      s.total++;
      if (correct) s.correct++;
      byScenario.set(q.scenario, s);
    }
  });

  const first15 = questions.slice(0, 15);
  const rest = questions.slice(15);
  const scoreOf = (qs: Question[]) => {
    if (!qs.length) return null;
    const c = qs.filter((q) => isAnswerCorrect(q, exam.answers[q.id])).length;
    return c / qs.length;
  };

  let flaggedCount = 0;
  let changedAfterFlagCount = 0;
  let changedToCorrectCount = 0;
  let changedToWrongCount = 0;
  for (const q of questions) {
    const everFlagged = !!exam.everFlagged[q.id];
    if (!everFlagged) continue;
    flaggedCount++;
    const changed = (exam.changedCount[q.id] ?? 0) > 0;
    if (!changed) continue;
    changedAfterFlagCount++;
    if (isAnswerCorrect(q, exam.answers[q.id])) changedToCorrectCount++;
    else changedToWrongCount++;
  }

  return {
    totalQuestions: questions.length,
    answeredCount,
    correctCount,
    scorePct: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
    byDomain: DOMAINS.map((d) => {
      const row = byDomain.get(d.id);
      return { domain: d.id, title: d.title, correct: row?.correct ?? 0, total: row?.total ?? 0, pct: row?.total ? row.correct / row.total : null };
    }),
    byScenario: SCENARIOS.filter((s) => byScenario.has(s.id)).map((s) => {
      const row = byScenario.get(s.id)!;
      return { scenario: s.id, title: s.title, correct: row.correct, total: row.total, pct: row.total ? row.correct / row.total : null };
    }),
    first15Pct: scoreOf(first15),
    restPct: scoreOf(rest),
    flaggedCount,
    changedAfterFlagCount,
    changedToCorrectCount,
    changedToWrongCount,
  };
}
