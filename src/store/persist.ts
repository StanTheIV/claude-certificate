import { createInitialState, type ProgressState } from './types';

export const STORAGE_KEY = 'ccarf:progress:v1';

export function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    // Merge onto a fresh default so new fields introduced later always exist.
    const fresh = createInitialState();
    return {
      ...fresh,
      ...parsed,
      settings: { ...fresh.settings, ...parsed.settings },
      lessonProgress: parsed.lessonProgress ?? {},
      questionAttempts: parsed.questionAttempts ?? {},
      srsQuestions: parsed.srsQuestions ?? {},
      srsFlashcards: parsed.srsFlashcards ?? {},
      examHistory: parsed.examHistory ?? [],
      activeDates: parsed.activeDates ?? [],
      activeExam: parsed.activeExam ?? null,
      version: 1,
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full, disabled, or unavailable (private browsing) — progress just won't persist.
  }
}

export function exportStateAsJson(state: ProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function parseImportedState(raw: string): ProgressState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const fresh = createInitialState();
    return {
      ...fresh,
      ...parsed,
      settings: { ...fresh.settings, ...parsed.settings },
      lessonProgress: parsed.lessonProgress ?? {},
      questionAttempts: parsed.questionAttempts ?? {},
      srsQuestions: parsed.srsQuestions ?? {},
      srsFlashcards: parsed.srsFlashcards ?? {},
      examHistory: parsed.examHistory ?? [],
      activeDates: parsed.activeDates ?? [],
      activeExam: parsed.activeExam ?? null,
      version: 1,
    };
  } catch {
    return null;
  }
}
