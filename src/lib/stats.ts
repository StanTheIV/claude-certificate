import { ALL_TASK_STATEMENTS, DOMAINS, isRepeatLessonId, practiceQuestions, quickChecksFor, type DomainId, type Question, type TaskStatementId } from '../content';
import { computeStreak } from './dates';
import type { ProgressState } from '../store/types';

export interface Accuracy {
  correct: number;
  total: number;
  pct: number | null;
}

export function accuracyForQuestions(state: ProgressState, questions: readonly Question[]): Accuracy {
  let correct = 0;
  let total = 0;
  for (const q of questions) {
    const attempts = state.questionAttempts[q.id];
    if (!attempts?.length) continue;
    for (const a of attempts) {
      total++;
      if (a.correct) correct++;
    }
  }
  return { correct, total, pct: total ? correct / total : null };
}

const practiceByTaskStatement = new Map<TaskStatementId, Question[]>();
function getPracticeForTaskStatement(ts: TaskStatementId): Question[] {
  let cached = practiceByTaskStatement.get(ts);
  if (!cached) {
    cached = practiceQuestions().filter((q) => q.taskStatements.includes(ts));
    practiceByTaskStatement.set(ts, cached);
  }
  return cached;
}

export function taskStatementAccuracy(state: ProgressState, ts: TaskStatementId): Accuracy {
  return accuracyForQuestions(state, getPracticeForTaskStatement(ts));
}

export function domainAccuracy(state: ProgressState, domainId: DomainId): Accuracy {
  const questions = practiceQuestions().filter((q) => q.domain === domainId);
  return accuracyForQuestions(state, questions);
}

export function quickCheckAccuracy(state: ProgressState, lessonId: string, chunkCount: number): Accuracy {
  const questions: Question[] = [];
  for (let i = 0; i < chunkCount; i++) questions.push(...quickChecksFor(lessonId, i));
  return accuracyForQuestions(state, questions);
}

/** Sum of domain weight (0-100) times domain accuracy fraction (0-1) => already a 0-100 readiness percent. */
export function weightedReadiness(state: ProgressState): number {
  let sum = 0;
  for (const d of DOMAINS) {
    const acc = domainAccuracy(state, d.id).pct ?? 0;
    sum += d.weight * acc;
  }
  return Math.round(sum);
}

export function lessonsDoneCount(state: ProgressState): number {
  // Counts the 30 task statement lessons only; Repeat unit lessons are extra.
  return Object.entries(state.lessonProgress).filter(([id, l]) => l.done && !isRepeatLessonId(id)).length;
}

export function questionsAnsweredCount(state: ProgressState): number {
  return Object.keys(state.questionAttempts).length;
}

export function streakDays(state: ProgressState): number {
  return computeStreak(state.activeDates);
}

/** Question ids whose most recent attempt was wrong despite "sure" confidence — the hypercorrection-effect targets. */
export function confidentErrorIds(state: ProgressState): string[] {
  const out: string[] = [];
  for (const [qid, attempts] of Object.entries(state.questionAttempts)) {
    const last = attempts[attempts.length - 1];
    if (last && !last.correct && last.confidence === 'sure') out.push(qid);
  }
  return out;
}

export interface WeakTaskStatement {
  id: TaskStatementId;
  title: string;
  domain: DomainId;
  accuracy: Accuracy;
}

/** Task statements sorted by ascending accuracy, attempted ones first (unattempted are not "weak", just unknown). */
export function weakestTaskStatements(state: ProgressState, limit = 5): WeakTaskStatement[] {
  const rows: WeakTaskStatement[] = ALL_TASK_STATEMENTS.map((t) => ({
    id: t.id,
    title: t.title,
    domain: t.domain as DomainId,
    accuracy: taskStatementAccuracy(state, t.id),
  }));
  return rows
    .filter((r) => r.accuracy.total > 0)
    .sort((a, b) => (a.accuracy.pct ?? 0) - (b.accuracy.pct ?? 0))
    .slice(0, limit);
}

export function heatmapData(state: ProgressState): WeakTaskStatement[] {
  return ALL_TASK_STATEMENTS.map((t) => ({
    id: t.id,
    title: t.title,
    domain: t.domain as DomainId,
    accuracy: taskStatementAccuracy(state, t.id),
  }));
}
