import type { Question } from '../content';
import { InlineMarkdown, Markdown } from './Markdown';

/** Read-only, already-answered view: used for exam review and history — no interaction, just the elaborative feedback. */
export function QuestionReview({
  question,
  selected,
  questionNumber,
}: {
  question: Question;
  selected: string[];
  questionNumber?: number;
}) {
  const correctSet = new Set(question.correct);
  const letters = new Map(question.options.map((o, i) => [o.id, String.fromCharCode(65 + i)]));
  const wasCorrect = selected.length === question.correct.length && selected.every((s) => correctSet.has(s));
  const answered = selected.length > 0;

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          {questionNumber ? `Question ${questionNumber}` : null}
          {question.scenario ? <span className="chip ml-2">Scenario {question.scenario}</span> : null}
          <span className="chip ml-2">{question.taskStatements.join(', ')}</span>
        </span>
        <span
          className="chip"
          style={
            !answered
              ? { borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }
              : wasCorrect
                ? { borderColor: 'var(--color-success)', color: 'var(--color-success)' }
                : { borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }
          }
        >
          {!answered ? 'Unanswered' : wasCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>

      <Markdown>{question.stem}</Markdown>

      <div className="mt-4 space-y-2">
        {question.options.map((opt) => {
          const isChosen = selected.includes(opt.id);
          const isRight = correctSet.has(opt.id);
          let stateClass = 'border-[color:var(--color-border)]';
          if (isRight) stateClass = 'border-2 border-[color:var(--color-success)] bg-[color:var(--color-success-soft)]';
          else if (isChosen) stateClass = 'border-2 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]';
          return (
            <div key={opt.id} className={`rounded-lg border p-3 ${stateClass}`}>
              <p>
                <span className="mr-2 font-semibold">{letters.get(opt.id)}.</span>
                <InlineMarkdown>{opt.text}</InlineMarkdown>
                {isRight && (
                  <span className="chip ml-2" style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}>
                    ✓ Correct answer
                  </span>
                )}
                {isChosen && (
                  <span
                    className="chip ml-2"
                    style={!isRight ? { borderColor: 'var(--color-danger)', color: 'var(--color-danger)' } : undefined}
                  >
                    {isRight ? 'Your answer' : '✗ Your answer'}
                  </span>
                )}
              </p>
              <div className="mt-1 pl-7 text-sm text-muted">
                <Markdown>{opt.explanation}</Markdown>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="rounded-lg p-3 surface-2">
          <p className="text-sm font-semibold">Key principle</p>
          <p className="text-sm">{question.keyPrinciple}</p>
        </div>
        <p className="text-xs text-muted">Source: {question.sourceRef}</p>
      </div>
    </div>
  );
}
