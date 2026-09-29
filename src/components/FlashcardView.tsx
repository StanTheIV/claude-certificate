import { useState } from 'react';
import type { Flashcard } from '../content';
import type { FlashcardRating } from '../store/types';
import { Markdown } from './Markdown';

const RATINGS: { value: FlashcardRating; label: string }[] = [
  { value: 'again', label: 'Again' },
  { value: 'hard', label: 'Hard' },
  { value: 'good', label: 'Good' },
  { value: 'easy', label: 'Easy' },
];

export function FlashcardView({
  card,
  index,
  total,
  onRate,
}: {
  card: Flashcard;
  index?: number;
  total?: number;
  onRate: (rating: FlashcardRating) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  function handleRate(rating: FlashcardRating) {
    setFlipped(false);
    onRate(rating);
  }

  return (
    <div className="mx-auto max-w-xl">
      {index != null && total != null && <p className="mb-2 text-center text-sm text-muted">Card {index} of {total}</p>}
      {/* role="button" (not a real <button>) because the flipped content is block-level markdown, which isn't valid inside <button>. */}
      <div
        role="button"
        tabIndex={0}
        className="card block w-full min-h-48 cursor-pointer p-6 text-left focus-ring"
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        aria-live="polite"
      >
        <p className="mb-2 text-xs font-semibold uppercase text-muted">{flipped ? 'Back (click to flip)' : 'Front (click to flip)'}</p>
        <Markdown>{flipped ? card.back : card.front}</Markdown>
      </div>

      {flipped && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {RATINGS.map((r) => (
            <button key={r.value} type="button" className="btn btn-primary" onClick={() => handleRate(r.value)}>
              {r.label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-center text-xs text-muted">Source: {card.sourceRef}</p>
    </div>
  );
}
