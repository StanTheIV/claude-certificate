import { useState } from 'react';
import { DOMAINS, FLASHCARDS, type DomainId } from '../content';
import { useProgress } from '../store/useProgress';
import { dueFlashcardIds } from '../lib/dashboard';
import { EmptyState } from '../components/EmptyState';
import { FlashcardView } from '../components/FlashcardView';

export function Flashcards() {
  const { state, dispatch } = useProgress();
  const [domain, setDomain] = useState<DomainId | ''>('');
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  if (FLASHCARDS.length === 0) {
    return <EmptyState title="No flashcards yet." body="Check back once the flashcard deck is written." />;
  }

  const dueIds = dueFlashcardIds(state);
  const domainCards = domain ? FLASHCARDS.filter((c) => c.domain === domain) : [];

  if (queue) {
    if (index >= queue.length) {
      return (
        <div className="mx-auto max-w-md space-y-3 text-center">
          <h1 className="text-xl font-bold">Session complete</h1>
          <button type="button" className="btn btn-primary" onClick={() => setQueue(null)}>
            Back to flashcards
          </button>
        </div>
      );
    }
    const card = FLASHCARDS.find((c) => c.id === queue[index]);
    if (!card) {
      setIndex((i) => i + 1);
      return null;
    }
    return (
      <div className="space-y-4">
        <h1 className="text-center text-xl font-bold">Flashcards</h1>
        <FlashcardView
          card={card}
          index={index + 1}
          total={queue.length}
          onRate={(rating) => {
            dispatch({ type: 'RECORD_FLASHCARD_RATING', flashcardId: card.id, rating });
            setIndex((i) => i + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-bold">Flashcards</h1>

      <section className="card p-4">
        <h2 className="font-semibold">Due cards</h2>
        <p className="mt-1 text-sm text-muted">{dueIds.length} card{dueIds.length === 1 ? '' : 's'} due right now.</p>
        <button
          type="button"
          className="btn btn-primary mt-3"
          disabled={dueIds.length === 0}
          onClick={() => {
            setQueue(dueIds);
            setIndex(0);
          }}
        >
          Study due cards
        </button>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">Browse by domain</h2>
        <select className="input mt-2 w-full rounded-md border p-2" value={domain} onChange={(e) => setDomain(Number(e.target.value) as DomainId)}>
          <option value="">Choose a domain…</option>
          {DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.id}. {d.title}
            </option>
          ))}
        </select>
        {domain && (
          <p className="mt-2 text-sm text-muted">
            {domainCards.length} card{domainCards.length === 1 ? '' : 's'} in this domain.
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary mt-3"
          disabled={!domain || domainCards.length === 0}
          onClick={() => {
            setQueue(domainCards.map((c) => c.id));
            setIndex(0);
          }}
        >
          Study this domain
        </button>
      </section>
    </div>
  );
}
