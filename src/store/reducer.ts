import { reviewFlashcard, reviewQuestionCard } from '../lib/srs';
import { dateKey } from '../lib/dates';
import type {
  ActiveExam,
  Confidence,
  ExamResultSummary,
  FlashcardRating,
  ProgressState,
  Settings,
} from './types';
import { createInitialState } from './types';

export type Action =
  | { type: 'HYDRATE'; state: ProgressState }
  | { type: 'SET_LESSON_CHUNK'; lessonId: string; chunkIndex: number; done: boolean }
  | {
      type: 'RECORD_QUESTION_ATTEMPT';
      questionId: string;
      correct: boolean;
      confidence: Confidence | null;
      mode: string;
      updateSrs: boolean;
      ts?: number;
    }
  | { type: 'RECORD_FLASHCARD_RATING'; flashcardId: string; rating: FlashcardRating; ts?: number }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'START_EXAM'; exam: ActiveExam }
  | { type: 'UPDATE_EXAM'; patch: Partial<ActiveExam> }
  | { type: 'SET_EXAM_ANSWER'; questionId: string; selected: string[] }
  | { type: 'TOGGLE_EXAM_FLAG'; questionId: string }
  | { type: 'SUBMIT_EXAM'; summary: ExamResultSummary }
  | { type: 'DISCARD_EXAM' }
  | { type: 'IMPORT_STATE'; state: ProgressState }
  | { type: 'RESET_PROGRESS' }
  | { type: 'TOUCH_STREAK'; ts?: number };

function touchDates(activeDates: string[], ts: number): string[] {
  const key = dateKey(ts);
  if (activeDates.includes(key)) return activeDates;
  return [...activeDates, key];
}

function sameSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export function progressReducer(state: ProgressState, action: Action): ProgressState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'SET_LESSON_CHUNK': {
      const now = Date.now();
      return {
        ...state,
        lessonProgress: {
          ...state.lessonProgress,
          [action.lessonId]: { chunkIndex: action.chunkIndex, done: action.done, lastVisited: now },
        },
        activeDates: touchDates(state.activeDates, now),
      };
    }

    case 'RECORD_QUESTION_ATTEMPT': {
      const ts = action.ts ?? Date.now();
      const prevAttempts = state.questionAttempts[action.questionId] ?? [];
      const attempt = { ts, correct: action.correct, confidence: action.confidence, mode: action.mode };
      const srsQuestions = action.updateSrs
        ? {
            ...state.srsQuestions,
            [action.questionId]: reviewQuestionCard(state.srsQuestions[action.questionId], action.correct, action.confidence, ts),
          }
        : state.srsQuestions;
      return {
        ...state,
        questionAttempts: { ...state.questionAttempts, [action.questionId]: [...prevAttempts, attempt] },
        srsQuestions,
        activeDates: touchDates(state.activeDates, ts),
      };
    }

    case 'RECORD_FLASHCARD_RATING': {
      const ts = action.ts ?? Date.now();
      return {
        ...state,
        srsFlashcards: {
          ...state.srsFlashcards,
          [action.flashcardId]: reviewFlashcard(state.srsFlashcards[action.flashcardId], action.rating, ts),
        },
        activeDates: touchDates(state.activeDates, ts),
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'START_EXAM':
      return { ...state, activeExam: action.exam };

    case 'UPDATE_EXAM':
      return state.activeExam ? { ...state, activeExam: { ...state.activeExam, ...action.patch } } : state;

    case 'SET_EXAM_ANSWER': {
      if (!state.activeExam) return state;
      const prev = state.activeExam.answers[action.questionId];
      const isRealChange = !!prev && prev.selected.length > 0 && !sameSelection(prev.selected, action.selected);
      const changedCount = isRealChange
        ? { ...state.activeExam.changedCount, [action.questionId]: (state.activeExam.changedCount[action.questionId] ?? 0) + 1 }
        : state.activeExam.changedCount;
      return {
        ...state,
        activeExam: {
          ...state.activeExam,
          answers: { ...state.activeExam.answers, [action.questionId]: { selected: action.selected } },
          changedCount,
        },
      };
    }

    case 'TOGGLE_EXAM_FLAG': {
      if (!state.activeExam) return state;
      const flagged = { ...state.activeExam.flagged };
      const turningOn = !flagged[action.questionId];
      flagged[action.questionId] = turningOn;
      const everFlagged = turningOn
        ? { ...state.activeExam.everFlagged, [action.questionId]: true }
        : state.activeExam.everFlagged;
      return { ...state, activeExam: { ...state.activeExam, flagged, everFlagged } };
    }

    case 'SUBMIT_EXAM':
      return {
        ...state,
        activeExam: state.activeExam ? { ...state.activeExam, submitted: true, submittedAt: Date.now() } : null,
        examHistory: [...state.examHistory, action.summary],
      };

    case 'DISCARD_EXAM':
      return { ...state, activeExam: null };

    case 'IMPORT_STATE':
      return action.state;

    case 'RESET_PROGRESS':
      return createInitialState();

    case 'TOUCH_STREAK':
      return { ...state, activeDates: touchDates(state.activeDates, action.ts ?? Date.now()) };

    default:
      return state;
  }
}
