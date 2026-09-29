import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Question, QuestionOption } from '../content';
import type { Confidence } from '../store/types';
import { shuffle } from '../lib/shuffle';
import { InlineMarkdown, Markdown } from './Markdown';

const CONFIDENCE_OPTIONS: { value: Confidence; label: string; hint: string }[] = [
  { value: 'sure', label: 'Sure', hint: 'I know this' },
  { value: 'thinkSo', label: 'Think so', hint: 'Fairly confident' },
  { value: 'guessing', label: 'Guessing', hint: 'Not confident' },
];

interface DisplayOption extends QuestionOption {
  letter: string;
}

export interface StudyAnswerResult {
  selected: string[];
  confidence: Confidence | null;
  correct: boolean;
}

interface BaseProps {
  question: Question;
  detectiveMode: boolean;
  shuffleOptions: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  flagged?: boolean;
  onToggleFlag?: () => void;
}

interface StudyModeProps extends BaseProps {
  mode: 'study';
  confidenceEnabled: boolean;
  allowSkip?: boolean;
  /** Label for the button shown after feedback (default "Continue"). */
  continueLabel?: string;
  onAnswered: (result: StudyAnswerResult) => void;
  onContinue: () => void;
}

interface ExamModeProps extends BaseProps {
  mode: 'exam';
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
}

export type QuestionCardProps = StudyModeProps | ExamModeProps;

function isCorrectSelection(question: Question, selected: string[]): boolean {
  if (selected.length !== question.correct.length) return false;
  const a = [...selected].sort();
  const b = [...question.correct].sort();
  return a.every((v, i) => v === b[i]);
}

export function QuestionCard(props: QuestionCardProps) {
  const { question, detectiveMode, shuffleOptions, questionNumber, totalQuestions, flagged, onToggleFlag } = props;
  // Derive concretely-typed branches once, instead of re-narrowing `props.mode` inside nested closures.
  const study = props.mode === 'study' ? props : undefined;
  const exam = props.mode === 'exam' ? props : undefined;

  const displayOptions: DisplayOption[] = useMemo(() => {
    const ordered = shuffleOptions ? shuffle(question.options) : question.options;
    return ordered.map((opt, i) => ({ ...opt, letter: String.fromCharCode(65 + i) }));
    // Re-shuffle only when the question or the setting changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, shuffleOptions]);

  const [revealed, setRevealed] = useState(!detectiveMode);
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the card on mount so number/letter/Enter/F shortcuts work immediately, without
  // requiring the learner to click an option first.
  // Also bring a freshly rendered question into view, so it's obvious a new one appeared.
  useEffect(() => {
    containerRef.current?.focus({ preventScroll: true });
    containerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const selected = study ? localSelected : (exam?.selected ?? []);
  const selectCount = question.selectCount;
  const isMulti = selectCount > 1;
  const complete = selected.length === selectCount;
  const correct = isCorrectSelection(question, selected);

  function toggleOption(id: string) {
    if (!revealed) return;
    if (study && submitted) return;
    const setSel = study ? setLocalSelected : exam?.onSelectedChange;
    if (!setSel) return;
    if (isMulti) {
      const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
      setSel(next.length > selectCount ? next.slice(1) : next);
    } else {
      setSel([id]);
    }
  }

  function selectByIndex(index: number) {
    const opt = displayOptions[index];
    if (opt) toggleOption(opt.id);
  }

  function handleSubmit() {
    if (!study || !complete) return;
    setSubmitted(true);
    study.onAnswered({ selected: localSelected, confidence, correct: isCorrectSelection(question, localSelected) });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const key = e.key;
    if (/^[1-9]$/.test(key)) {
      selectByIndex(Number(key) - 1);
      return;
    }
    if (/^[a-zA-Z]$/.test(key) && key.length === 1) {
      const idx = key.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < displayOptions.length) {
        selectByIndex(idx);
        return;
      }
    }
    if (key === 'f' || key === 'F') {
      onToggleFlag?.();
      return;
    }
    if (key === 'Enter' && study) {
      if (!submitted && complete) handleSubmit();
      else if (submitted) study.onContinue();
    }
  }

  const correctSet = new Set(question.correct);
  const showFeedback = !!study && submitted;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="card question-enter scroll-mt-20 p-4 sm:p-6 focus:outline-none"
      aria-label={`Question${questionNumber ? ` ${questionNumber}` : ''}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          {questionNumber && totalQuestions ? (
            <span className="font-semibold text-[color:var(--color-accent)]">
              Question {questionNumber} of {totalQuestions}
            </span>
          ) : null}
          {question.scenario ? <span className="chip ml-2">Scenario {question.scenario}</span> : null}
          <span className="chip ml-2">{question.taskStatements.join(', ')}</span>
        </span>
        {onToggleFlag && (
          <button type="button" onClick={onToggleFlag} className={`btn ${flagged ? 'btn-primary' : ''}`} aria-pressed={!!flagged}>
            {flagged ? 'Flagged' : 'Flag (F)'}
          </button>
        )}
      </div>

      <Markdown>{question.stem}</Markdown>

      {isMulti && <p className="mt-3 text-sm font-semibold">Select {selectCount}.</p>}

      {!revealed ? (
        <button type="button" className="btn btn-primary mt-4" onClick={() => setRevealed(true)}>
          Show options
        </button>
      ) : (
        <fieldset className="mt-4 space-y-2" disabled={showFeedback}>
          <legend className="sr-only">Answer options</legend>
          {displayOptions.map((opt) => {
            const isChosen = selected.includes(opt.id);
            const isRight = correctSet.has(opt.id);
            let stateClass = 'border-[color:var(--color-border)]';
            if (showFeedback) {
              if (isRight) stateClass = 'border-2 border-[color:var(--color-success)] bg-[color:var(--color-success-soft)]';
              else if (isChosen) stateClass = 'border-2 border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]';
            } else if (isChosen) {
              stateClass = 'border-2 border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)]';
            }
            return (
              <div key={opt.id} className={`rounded-lg border p-3 ${stateClass}`}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={`q-${question.id}`}
                    checked={isChosen}
                    onChange={() => toggleOption(opt.id)}
                    disabled={showFeedback}
                    className="mt-1"
                    style={{ accentColor: 'var(--color-accent)' }}
                    aria-label={`Option ${opt.letter}`}
                  />
                  <span className="flex-1">
                    <span className="mr-2 font-semibold">{opt.letter}.</span>
                    <InlineMarkdown>{opt.text}</InlineMarkdown>
                    {showFeedback && isRight && (
                      <span className="chip ml-2" style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}>
                        ✓ Correct answer
                      </span>
                    )}
                    {showFeedback && isChosen && !isRight && (
                      <span className="chip ml-2" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                        ✗ Your answer
                      </span>
                    )}
                  </span>
                </label>
                {showFeedback && (
                  <div className="mt-2 pl-7 text-sm text-muted">
                    <Markdown>{opt.explanation}</Markdown>
                  </div>
                )}
              </div>
            );
          })}
        </fieldset>
      )}

      {study && revealed && !submitted && study.confidenceEnabled && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium">How confident are you?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Confidence">
            {CONFIDENCE_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={confidence === c.value}
                onClick={() => setConfidence(c.value)}
                className={`btn ${confidence === c.value ? 'btn-primary' : ''}`}
                title={c.hint}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {study && revealed && !submitted && (
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn btn-primary" disabled={!complete} onClick={handleSubmit}>
            Submit
          </button>
          {study.allowSkip && (
            <button type="button" className="btn btn-ghost" onClick={() => study.onContinue()}>
              Skip
            </button>
          )}
        </div>
      )}

      <div aria-live="polite">
        {showFeedback && (
          <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className={`font-semibold ${correct ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
              {correct ? '✓ Correct.' : '✗ Not quite.'}
              {confidence === 'sure' && !correct && (
                <span className="ml-2 chip" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                  Confident error — worth a closer look
                </span>
              )}
            </p>
            <div className="rounded-lg p-3 surface-2">
              <p className="text-sm font-semibold">Key principle</p>
              <p className="text-sm">{question.keyPrinciple}</p>
            </div>
            <p className="text-xs text-muted">Source: {question.sourceRef}</p>
            <button type="button" className="btn btn-primary" onClick={() => study?.onContinue()}>
              {study?.continueLabel ?? 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
