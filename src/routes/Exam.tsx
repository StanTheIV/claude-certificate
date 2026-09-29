import { useEffect, useState, type CSSProperties } from 'react';
import { getQuestion, mockPool, SCENARIOS, type Question, type ScenarioId } from '../content';
import { useProgress } from '../store/useProgress';
import { buildFullExam, buildQuickExam, examEndsAt, gradeExam, isAnswerComplete, type ExamResults } from '../lib/exam';
import { formatDuration } from '../lib/dates';
import { EmptyState } from '../components/EmptyState';
import { ConfirmButton } from '../components/ConfirmButton';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionReview } from '../components/QuestionReview';
import { ScenarioBanner } from '../components/ScenarioBanner';
import type { ActiveExam } from '../store/types';

// meta.ts exports SCENARIOS but not a getScenario helper; build one locally to keep this file self-contained.
function getScenario(id: ScenarioId) {
  return SCENARIOS.find((s) => s.id === id);
}

/**
 * In-memory marker of which exam (by startedAt) the learner has already acknowledged resuming.
 * Deliberately module-level, not persisted: a true page reload clears it (so the resume prompt
 * reappears, per spec), while ordinary in-app navigation away and back keeps it (so we don't
 * nag on every route change while an exam is open).
 */
let resumeAcknowledgedFor: number | null = null;

export function Exam() {
  const { state, dispatch } = useProgress();
  const exam = state.activeExam;
  const pool = mockPool();

  if (!exam) return <ExamSetup poolSize={pool.length} />;
  if (!exam.submitted) return <ExamRunning exam={exam} />;
  return <ExamResultsView exam={exam} onDiscard={() => dispatch({ type: 'DISCARD_EXAM' })} />;
}

function ExamSetup({ poolSize }: { poolSize: number }) {
  const { dispatch } = useProgress();

  function start(builder: () => ActiveExam) {
    const built = builder();
    resumeAcknowledgedFor = built.startedAt;
    dispatch({ type: 'START_EXAM', exam: built });
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-xl font-bold">Mock exam</h1>

      <div className="card p-4 text-sm">
        <p className="font-semibold">Before you start</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Time is ample. Read every stem fully before you look at the options.</li>
          <li>Flag anything you're not 100% sure about — especially in the first ~15 questions, while you're still warming up.</li>
          <li>Revisit every flagged question before you submit. Many candidates change most of their early flags on review.</li>
          <li>No feedback is shown during the exam. You'll get full explanations after you submit.</li>
        </ul>
      </div>

      {poolSize === 0 ? (
        <EmptyState title="No mock-exam questions yet." body="Practice questions tagged with an official scenario (1-6) will appear here once written." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <h2 className="font-semibold">Full exam</h2>
            <p className="mt-1 text-sm text-muted">60 questions across 4 scenarios, 120 minutes.</p>
            <button type="button" className="btn btn-primary mt-3" onClick={() => start(buildFullExam)}>
              Start full exam
            </button>
          </div>
          <div className="card p-4">
            <h2 className="font-semibold">Quick mode</h2>
            <p className="mt-1 text-sm text-muted">20 questions, 40 minutes.</p>
            <button type="button" className="btn btn-primary mt-3" onClick={() => start(buildQuickExam)}>
              Start quick mode
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Heuristic only: scaled scoring isn't public. Candidates report ~80% on exam-level practice roughly matches a comfortable pass; the official
        cut is 720/1000.
      </p>
    </div>
  );
}

function ExamRunning({ exam }: { exam: ActiveExam }) {
  const { state, dispatch } = useProgress();
  const questions = exam.questionIds.map((id) => getQuestion(id)).filter((q): q is Question => !!q);
  const [screen, setScreen] = useState<'question' | 'review'>('question');
  const [now, setNow] = useState(Date.now());
  const [gateOpen, setGateOpen] = useState(() => resumeAcknowledgedFor !== exam.startedAt);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const endsAt = examEndsAt(exam);
  const remaining = endsAt - now;
  const expired = remaining <= 0;

  useEffect(() => {
    if (expired) submitExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  const current = questions[exam.currentIndex];

  useEffect(() => {
    if (current?.scenario && !exam.seenIntros.includes(current.scenario)) {
      dispatch({ type: 'UPDATE_EXAM', patch: { seenIntros: [...exam.seenIntros, current.scenario] } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.currentIndex]);

  function submitExam() {
    const results = gradeExam(exam);
    dispatch({
      type: 'SUBMIT_EXAM',
      summary: { finishedAt: Date.now(), mode: exam.mode, scorePct: results.scorePct, totalQuestions: results.totalQuestions },
    });
  }

  if (questions.length === 0) {
    return <EmptyState title="This exam has no questions." body="Discard it and start a new one." />;
  }

  if (gateOpen && !expired) {
    const answeredCount = questions.filter((q) => (exam.answers[q.id]?.selected.length ?? 0) > 0).length;
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="card p-5 text-center">
          <h1 className="text-lg font-bold">Exam in progress</h1>
          <p className="mt-2 text-sm text-muted">
            You have a {exam.mode === 'full' ? 'full' : 'quick mode'} exam open, {answeredCount} of {questions.length} answered, with{' '}
            {formatDuration(Math.max(0, remaining))} left on the clock.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                resumeAcknowledgedFor = exam.startedAt;
                setGateOpen(false);
              }}
            >
              Resume exam
            </button>
            <ConfirmButton label="Discard and start over" confirmLabel="Confirm discard" onConfirm={() => dispatch({ type: 'DISCARD_EXAM' })} />
          </div>
        </div>
      </div>
    );
  }

  const scenario = current?.scenario ? getScenario(current.scenario) : undefined;
  const introExpanded = !!current?.scenario && !exam.seenIntros.includes(current.scenario);
  const flaggedIds = questions.filter((q) => exam.flagged[q.id]).map((q) => q.id);
  const incompleteIds = questions.filter((q) => !isAnswerComplete(q, exam.answers[q.id])).map((q) => q.id);
  const reviewIds = Array.from(new Set([...flaggedIds, ...incompleteIds]));

  function jump(index: number) {
    dispatch({ type: 'UPDATE_EXAM', patch: { currentIndex: index } });
    setScreen('question');
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-2 p-3">
        <span className="font-semibold">
          {exam.mode === 'full' ? 'Full exam' : 'Quick mode'} — question {exam.currentIndex + 1} of {questions.length}
        </span>
        <span
          className="chip"
          style={{
            borderColor: remaining < 5 * 60_000 ? 'var(--color-danger)' : undefined,
            color: remaining < 5 * 60_000 ? 'var(--color-danger)' : undefined,
          }}
        >
          Time left: {formatDuration(Math.max(0, remaining))}
        </span>
        <button type="button" className="btn" onClick={() => setScreen('review')}>
          Review flagged/unanswered ({reviewIds.length})
        </button>
      </div>

      {screen === 'review' ? (
        <div className="card space-y-3 p-4">
          <h2 className="font-semibold">Review before you submit</h2>
          {reviewIds.length === 0 ? (
            <p className="text-sm text-muted">Nothing flagged, and every question has a complete answer. You're ready to submit.</p>
          ) : (
            <ul className="divide-y text-sm" style={{ borderColor: 'var(--color-border)' }}>
              {reviewIds.map((id) => {
                const q = questions.find((qq) => qq.id === id)!;
                const idx = questions.indexOf(q);
                return (
                  <li key={id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      Q{idx + 1}: {q.stem.slice(0, 60)}…
                      {exam.flagged[id] && <span className="chip ml-2">Flagged</span>}
                      {!isAnswerComplete(q, exam.answers[id]) && <span className="chip ml-2">Unanswered</span>}
                    </span>
                    <button type="button" className="btn" onClick={() => jump(idx)}>
                      Go
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={() => setScreen('question')}>
              Back to questions
            </button>
            <ConfirmButton label="Submit exam" confirmLabel="Confirm submit" onConfirm={submitExam} />
          </div>
        </div>
      ) : (
        <>
          {scenario && <ScenarioBanner scenario={scenario} expanded={introExpanded} />}
          {current && (
            <QuestionCard
              key={current.id}
              mode="exam"
              question={current}
              detectiveMode={state.settings.detectiveMode}
              shuffleOptions={state.settings.shuffleOptions}
              selected={exam.answers[current.id]?.selected ?? []}
              onSelectedChange={(selected) => dispatch({ type: 'SET_EXAM_ANSWER', questionId: current.id, selected })}
              flagged={!!exam.flagged[current.id]}
              onToggleFlag={() => dispatch({ type: 'TOGGLE_EXAM_FLAG', questionId: current.id })}
            />
          )}
          <div className="flex justify-between">
            <button type="button" className="btn" disabled={exam.currentIndex === 0} onClick={() => jump(exam.currentIndex - 1)}>
              Previous
            </button>
            {exam.currentIndex >= questions.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setScreen('review')}>
                Finish exam
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => jump(exam.currentIndex + 1)}>
                Next
              </button>
            )}
          </div>

          <div className="card p-3">
            <p className="mb-2 text-sm font-semibold">Question navigator</p>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-12">
              {questions.map((q, i) => {
                const complete = isAnswerComplete(q, exam.answers[q.id]);
                const isCurrent = i === exam.currentIndex;
                const isFlagged = !!exam.flagged[q.id];
                let style: CSSProperties = { borderColor: 'var(--color-border)' };
                if (isFlagged) style = { borderColor: 'var(--color-warning)', background: 'var(--color-warning-soft)' };
                else if (complete) style = { borderColor: 'var(--color-success)', background: 'var(--color-success-soft)' };
                if (isCurrent) style = { ...style, outline: '2px solid var(--color-accent)' };
                return (
                  <button key={q.id} type="button" className="rounded-md border py-1 text-xs" style={style} onClick={() => jump(i)} aria-current={isCurrent}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ExamResultsView({ exam, onDiscard }: { exam: ActiveExam; onDiscard: () => void }) {
  const results: ExamResults = gradeExam(exam);
  const questions = exam.questionIds.map((id) => getQuestion(id)).filter((q): q is Question => !!q);

  return (
    <div className="space-y-6">
      <section className="card p-5 text-center">
        <h1 className="text-xl font-bold">Results — {exam.mode === 'full' ? 'Full exam' : 'Quick mode'}</h1>
        <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>
          {results.scorePct}%
        </p>
        <p className="text-muted">
          {results.correctCount} of {results.totalQuestions} correct ({results.answeredCount} answered)
        </p>
        <p className="mx-auto mt-3 max-w-md text-xs text-muted">
          Heuristic only: scaled scoring isn't public. Candidates report ~80% on exam-level practice ≈ passing comfortably; 720/1000 is the
          official cut.
        </p>
        <button type="button" className="btn mt-3" onClick={onDiscard}>
          Start a new exam
        </button>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">By domain</h2>
        <div className="space-y-2 text-sm">
          {results.byDomain.map((d) => (
            <div key={d.domain} className="flex justify-between">
              <span>
                {d.domain}. {d.title}
              </span>
              <span className="text-muted">{d.pct == null ? '—' : `${Math.round(d.pct * 100)}% (${d.correct}/${d.total})`}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">By scenario</h2>
        <div className="space-y-2 text-sm">
          {results.byScenario.map((s) => (
            <div key={s.scenario} className="flex justify-between">
              <span>
                Scenario {s.scenario}: {s.title}
              </span>
              <span className="text-muted">{s.pct == null ? '—' : `${Math.round(s.pct * 100)}% (${s.correct}/${s.total})`}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Warm-up effect</h2>
        <p className="mb-2 text-sm text-muted">
          Many candidates flag heavily in the first ~15 questions while warming up, then change most flags on review. Here's your pattern:
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="First 15 accuracy" value={results.first15Pct == null ? '—' : `${Math.round(results.first15Pct * 100)}%`} />
          <Stat label="Rest accuracy" value={results.restPct == null ? '—' : `${Math.round(results.restPct * 100)}%`} />
          <Stat label="Flagged → changed" value={`${results.changedAfterFlagCount}/${results.flaggedCount}`} />
          <Stat label="Changed → correct/wrong" value={`${results.changedToCorrectCount}/${results.changedToWrongCount}`} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Full review</h2>
        {questions.map((q, i) => (
          <QuestionReview key={q.id} question={q} selected={exam.answers[q.id]?.selected ?? []} questionNumber={i + 1} />
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 text-center surface-2">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
