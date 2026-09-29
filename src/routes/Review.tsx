import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FLASHCARDS, getQuestion } from '../content';
import { useProgress } from '../store/useProgress';
import { dueFlashcardIds, dueQuestionIds } from '../lib/dashboard';
import { EmptyState } from '../components/EmptyState';
import { QuestionCard } from '../components/QuestionCard';
import { FlashcardView } from '../components/FlashcardView';

export function Review() {
  const { state, dispatch } = useProgress();
  const dueQ = useMemo(() => dueQuestionIds(state), [state]);
  const dueF = useMemo(() => dueFlashcardIds(state), [state]);

  const [phase, setPhase] = useState<'questions' | 'flashcards' | 'done'>(dueQ.length ? 'questions' : dueF.length ? 'flashcards' : 'done');
  const [qIndex, setQIndex] = useState(0);
  const [fIndex, setFIndex] = useState(0);

  if (dueQ.length === 0 && dueF.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-bold">Review</h1>
        <EmptyState title="No reviews due." body="Nice work — check back later, or head to Practice to build up more history." />
        <Link to="/practice" className="btn btn-primary inline-flex">
          Go to Practice
        </Link>
      </div>
    );
  }

  if (phase === 'questions') {
    const q = getQuestion(dueQ[qIndex]);
    if (!q) {
      if (qIndex < dueQ.length - 1) setQIndex((i) => i + 1);
      else setPhase(dueF.length ? 'flashcards' : 'done');
      return null;
    }
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-xl font-bold">Review — questions</h1>
        <QuestionCard
          key={q.id}
          mode="study"
          question={q}
          detectiveMode={state.settings.detectiveMode}
          confidenceEnabled={state.settings.confidenceEnabled}
          shuffleOptions={state.settings.shuffleOptions}
          questionNumber={qIndex + 1}
          totalQuestions={dueQ.length}
          onAnswered={(result) =>
            dispatch({
              type: 'RECORD_QUESTION_ATTEMPT',
              questionId: q.id,
              correct: result.correct,
              confidence: result.confidence,
              mode: 'review',
              updateSrs: true,
            })
          }
          onContinue={() => {
            if (qIndex < dueQ.length - 1) setQIndex((i) => i + 1);
            else setPhase(dueF.length ? 'flashcards' : 'done');
          }}
        />
      </div>
    );
  }

  if (phase === 'flashcards') {
    const card = FLASHCARDS.find((c) => c.id === dueF[fIndex]);
    if (!card) {
      if (fIndex < dueF.length - 1) setFIndex((i) => i + 1);
      else setPhase('done');
      return null;
    }
    return (
      <div className="space-y-4">
        <h1 className="text-center text-xl font-bold">Review — flashcards</h1>
        <FlashcardView
          card={card}
          index={fIndex + 1}
          total={dueF.length}
          onRate={(rating) => {
            dispatch({ type: 'RECORD_FLASHCARD_RATING', flashcardId: card.id, rating });
            if (fIndex < dueF.length - 1) setFIndex((i) => i + 1);
            else setPhase('done');
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-bold">All done</h1>
      <p className="text-muted">You've cleared today's review queue.</p>
      <Link to="/" className="btn btn-primary inline-flex">
        Back to dashboard
      </Link>
    </div>
  );
}
