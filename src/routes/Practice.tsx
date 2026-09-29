import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ALL_TASK_STATEMENTS, DOMAINS, SCENARIOS, type DomainId, type Question, type ScenarioId, type TaskStatementId } from '../content';
import { useProgress } from '../store/useProgress';
import { buildPracticeSession, poolSizeFor, type PracticeConfig, type PracticeMode } from '../lib/practice';
import { EmptyState } from '../components/EmptyState';
import { QuestionCard, type StudyAnswerResult } from '../components/QuestionCard';

const MODE_LABELS: Record<PracticeMode, string> = {
  domain: 'By domain',
  taskStatement: 'By task statement',
  scenario: 'By scenario',
  mixed: 'Mixed drill (interleaved)',
  weak: 'Weak spots',
  mechanism: 'Mechanism drill',
};

export function Practice() {
  const { state, dispatch } = useProgress();
  const [params] = useSearchParams();

  const [mode, setMode] = useState<PracticeMode>((params.get('mode') as PracticeMode) || 'mixed');
  const [domain, setDomain] = useState<DomainId | ''>((Number(params.get('domain')) as DomainId) || '');
  const [taskStatement, setTaskStatement] = useState<TaskStatementId | ''>(params.get('ts') || '');
  const [scenario, setScenario] = useState<ScenarioId | ''>((Number(params.get('scenario')) as ScenarioId) || '');
  const [count, setCount] = useState<number | 'all'>(10);
  const [includeQuickchecks, setIncludeQuickchecks] = useState(false);

  const [phase, setPhase] = useState<'setup' | 'running' | 'summary'>('setup');
  const [session, setSession] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ question: Question; correct: boolean }[]>([]);

  const config: PracticeConfig = useMemo(
    () => ({
      mode,
      domain: domain || undefined,
      taskStatement: taskStatement || undefined,
      scenario: scenario || undefined,
      count,
      includeQuickchecks,
    }),
    [mode, domain, taskStatement, scenario, count, includeQuickchecks],
  );

  const needsDomain = mode === 'domain';
  const needsTs = mode === 'taskStatement';
  const needsScenario = mode === 'scenario';
  const selectionMissing = (needsDomain && !domain) || (needsTs && !taskStatement) || (needsScenario && !scenario);
  const previewSize = selectionMissing ? 0 : poolSizeFor(config, state);

  function start() {
    if (selectionMissing) return;
    const built = buildPracticeSession(state, config);
    setSession(built);
    setIndex(0);
    setResults([]);
    setPhase(built.length > 0 ? 'running' : 'setup');
  }

  function handleAnswered(result: StudyAnswerResult) {
    const q = session[index];
    dispatch({
      type: 'RECORD_QUESTION_ATTEMPT',
      questionId: q.id,
      correct: result.correct,
      confidence: result.confidence,
      mode: `practice-${mode}`,
      updateSrs: true,
    });
    setResults((r) => [...r, { question: q, correct: result.correct }]);
  }

  function handleContinue() {
    if (index >= session.length - 1) setPhase('summary');
    else setIndex((i) => i + 1);
  }

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <h1 className="text-xl font-bold">Practice</h1>

        <fieldset className="card space-y-2 p-4">
          <legend className="px-1 font-semibold">Mode</legend>
          {(Object.keys(MODE_LABELS) as PracticeMode[]).map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} style={{ accentColor: 'var(--color-accent)' }} />
              {MODE_LABELS[m]}
            </label>
          ))}
        </fieldset>

        {needsDomain && (
          <label className="block text-sm">
            Domain
            <select className="input mt-1 w-full rounded-md border p-2" value={domain} onChange={(e) => setDomain(Number(e.target.value) as DomainId)}>
              <option value="">Choose a domain…</option>
              {DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id}. {d.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {needsTs && (
          <label className="block text-sm">
            Task statement
            <select className="input mt-1 w-full rounded-md border p-2" value={taskStatement} onChange={(e) => setTaskStatement(e.target.value)}>
              <option value="">Choose a task statement…</option>
              {ALL_TASK_STATEMENTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} {t.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {needsScenario && (
          <label className="block text-sm">
            Scenario
            <select className="input mt-1 w-full rounded-md border p-2" value={scenario} onChange={(e) => setScenario(Number(e.target.value) as ScenarioId)}>
              <option value="">Choose a scenario…</option>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.title}
                  {!s.official ? ' (community extra)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="card space-y-2 p-4">
          <legend className="px-1 font-semibold">Count</legend>
          <div className="flex gap-3">
            {[10, 20, 'all' as const].map((c) => (
              <label key={String(c)} className="flex items-center gap-1 text-sm">
                <input type="radio" name="count" checked={count === c} onChange={() => setCount(c)} style={{ accentColor: 'var(--color-accent)' }} />
                {c === 'all' ? 'All' : c}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeQuickchecks}
            onChange={(e) => setIncludeQuickchecks(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)' }}
          />
          Include quick-check questions
        </label>

        <p className="text-sm text-muted">{selectionMissing ? 'Make a selection to see how many questions match.' : `${previewSize} question${previewSize === 1 ? '' : 's'} available.`}</p>

        <button type="button" className="btn btn-primary" disabled={selectionMissing || previewSize === 0} onClick={start}>
          Start session
        </button>
        {!selectionMissing && previewSize === 0 && (
          <EmptyState title="No questions match yet." body="Try another mode, or check back once more content is written." />
        )}
      </div>
    );
  }

  if (phase === 'running') {
    const q = session[index];
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <QuestionCard
          key={q.id}
          mode="study"
          question={q}
          detectiveMode={state.settings.detectiveMode}
          confidenceEnabled={state.settings.confidenceEnabled}
          shuffleOptions={state.settings.shuffleOptions}
          questionNumber={index + 1}
          totalQuestions={session.length}
          onAnswered={handleAnswered}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  // summary
  const correctCount = results.filter((r) => r.correct).length;
  return (
    <div className="mx-auto max-w-xl space-y-4 text-center">
      <h1 className="text-xl font-bold">Session complete</h1>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
        {results.length ? Math.round((correctCount / results.length) * 100) : 0}%
      </p>
      <p className="text-muted">
        {correctCount} of {results.length} correct
      </p>
      <div className="flex justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setPhase('setup')}>
          New session
        </button>
      </div>
      {results.some((r) => !r.correct) && (
        <div className="mt-4 text-left">
          <h2 className="mb-2 font-semibold">Missed questions</h2>
          <ul className="space-y-1 text-sm">
            {results
              .filter((r) => !r.correct)
              .map((r) => (
                <li key={r.question.id} className="text-muted">
                  {r.question.taskStatements.join(', ')} — {r.question.stem.slice(0, 80)}…
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
