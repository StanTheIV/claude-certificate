// App-level state types for the progress store. Not part of the content contract.
import type { ScenarioId } from '../content';

export type Confidence = 'sure' | 'thinkSo' | 'guessing';
export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';
export type Theme = 'light' | 'dark' | 'system';
export type SrsBox = 1 | 2 | 3 | 4 | 5;

export interface Settings {
  detectiveMode: boolean;
  confidenceEnabled: boolean;
  shuffleOptions: boolean;
  theme: Theme;
}

export interface QuestionAttempt {
  ts: number;
  correct: boolean;
  confidence: Confidence | null;
  /** Where the attempt happened, e.g. "quickcheck", "domain", "mixed", "weak", "mech", "scenario", "review", "exam-full", "exam-quick". */
  mode: string;
}

export interface SrsCard {
  box: SrsBox;
  dueAt: number;
  reps: number;
  lastResult: 'correct' | 'incorrect' | null;
}

export interface LessonProgress {
  chunkIndex: number;
  done: boolean;
  lastVisited: number;
}

export interface ExamAnswer {
  selected: string[];
}

export interface ActiveExam {
  mode: 'full' | 'quick';
  questionIds: string[];
  scenarioOrder: ScenarioId[];
  durationMinutes: number;
  startedAt: number;
  answers: Record<string, ExamAnswer>;
  flagged: Record<string, boolean>;
  /** Once a question has been flagged, stays true even if unflagged later — used for the warm-up funnel stats. */
  everFlagged: Record<string, boolean>;
  /** How many times each question's selection was changed after its first answer. */
  changedCount: Record<string, number>;
  seenIntros: ScenarioId[];
  currentIndex: number;
  submitted: boolean;
  submittedAt: number | null;
}

export interface ExamResultSummary {
  finishedAt: number;
  mode: 'full' | 'quick';
  scorePct: number;
  totalQuestions: number;
}

export interface ProgressState {
  version: 1;
  lessonProgress: Record<string, LessonProgress>;
  questionAttempts: Record<string, QuestionAttempt[]>;
  srsQuestions: Record<string, SrsCard>;
  srsFlashcards: Record<string, SrsCard>;
  settings: Settings;
  activeExam: ActiveExam | null;
  examHistory: ExamResultSummary[];
  /** YYYY-MM-DD dates the learner did something, for the streak counter. */
  activeDates: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  detectiveMode: true,
  confidenceEnabled: true,
  shuffleOptions: true,
  theme: 'system',
};

export function createInitialState(): ProgressState {
  return {
    version: 1,
    lessonProgress: {},
    questionAttempts: {},
    srsQuestions: {},
    srsFlashcards: {},
    settings: { ...DEFAULT_SETTINGS },
    activeExam: null,
    examHistory: [],
    activeDates: [],
  };
}
