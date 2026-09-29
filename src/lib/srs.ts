// Leitner-box spaced repetition, boxes 1-5.
// box1 = due again this session (~10 min), then 1d, 3d, 7d, 16d.
import type { Confidence, FlashcardRating, SrsBox, SrsCard } from '../store/types';

export const BOX_INTERVAL_MS: Record<SrsBox, number> = {
  1: 10 * 60 * 1000,
  2: 24 * 60 * 60 * 1000,
  3: 3 * 24 * 60 * 60 * 1000,
  4: 7 * 24 * 60 * 60 * 1000,
  5: 16 * 24 * 60 * 60 * 1000,
};

export function newSrsCard(now: number): SrsCard {
  return { box: 1, dueAt: now, reps: 0, lastResult: null };
}

function clampBox(n: number): SrsBox {
  return Math.min(5, Math.max(1, n)) as SrsBox;
}

/** Wrong -> box 1. Correct + "sure" -> box+1. Correct + anything else -> stays in box (due date refreshed). */
export function reviewQuestionCard(card: SrsCard | undefined, correct: boolean, confidence: Confidence | null, now: number): SrsCard {
  const base = card ?? newSrsCard(now);
  if (!correct) {
    return { box: 1, dueAt: now + BOX_INTERVAL_MS[1], reps: base.reps + 1, lastResult: 'incorrect' };
  }
  const nextBox = confidence === 'sure' ? clampBox(base.box + 1) : base.box;
  return { box: nextBox, dueAt: now + BOX_INTERVAL_MS[nextBox], reps: base.reps + 1, lastResult: 'correct' };
}

/** Again -> box 1. Hard -> stays. Good -> +1. Easy -> +2. */
export function reviewFlashcard(card: SrsCard | undefined, rating: FlashcardRating, now: number): SrsCard {
  const base = card ?? newSrsCard(now);
  let nextBox: SrsBox;
  let result: SrsCard['lastResult'];
  switch (rating) {
    case 'again':
      nextBox = 1;
      result = 'incorrect';
      break;
    case 'hard':
      nextBox = base.box;
      result = 'correct';
      break;
    case 'good':
      nextBox = clampBox(base.box + 1);
      result = 'correct';
      break;
    case 'easy':
      nextBox = clampBox(base.box + 2);
      result = 'correct';
      break;
  }
  return { box: nextBox, dueAt: now + BOX_INTERVAL_MS[nextBox], reps: base.reps + 1, lastResult: result };
}

export function isDue(card: SrsCard | undefined, now: number): boolean {
  return !!card && card.dueAt <= now;
}
