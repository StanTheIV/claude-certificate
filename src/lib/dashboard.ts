import { ALL_TASK_STATEMENTS, FLASHCARDS, getLesson, QUESTIONS, REPEAT_UNIT } from '../content';
import { isDue } from './srs';
import { weakestTaskStatements, type WeakTaskStatement } from './stats';
import type { ProgressState } from '../store/types';

export function dueQuestionIds(state: ProgressState, now: number = Date.now()): string[] {
  return Object.keys(state.srsQuestions).filter((id) => isDue(state.srsQuestions[id], now) && QUESTIONS.some((q) => q.id === id));
}

export function dueFlashcardIds(state: ProgressState, now: number = Date.now()): string[] {
  return Object.keys(state.srsFlashcards).filter((id) => isDue(state.srsFlashcards[id], now) && FLASHCARDS.some((c) => c.id === id));
}

export type NextStep =
  | { kind: 'continue-lesson'; lessonId: string; title: string }
  | { kind: 'start-lesson'; lessonId: string; title: string }
  | { kind: 'review'; count: number }
  | { kind: 'weak'; taskStatement: WeakTaskStatement }
  | { kind: 'none' };

export function getNextStep(state: ProgressState): NextStep {
  const inProgress = Object.entries(state.lessonProgress)
    .filter(([, p]) => !p.done)
    .sort((a, b) => b[1].lastVisited - a[1].lastVisited)[0];
  if (inProgress) {
    const lesson = getLesson(inProgress[0]);
    if (lesson) return { kind: 'continue-lesson', lessonId: lesson.id, title: lesson.title };
  }

  const nextNew = [...ALL_TASK_STATEMENTS, ...REPEAT_UNIT.lessons].find((t) => !state.lessonProgress[t.id] && getLesson(t.id));
  if (nextNew) {
    const lesson = getLesson(nextNew.id)!;
    return { kind: 'start-lesson', lessonId: lesson.id, title: lesson.title };
  }

  const dueCount = dueQuestionIds(state).length + dueFlashcardIds(state).length;
  if (dueCount > 0) return { kind: 'review', count: dueCount };

  const weakest = weakestTaskStatements(state, 1)[0];
  if (weakest) return { kind: 'weak', taskStatement: weakest };

  return { kind: 'none' };
}
