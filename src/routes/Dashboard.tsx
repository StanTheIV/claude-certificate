import { Link } from 'react-router-dom';
import { DOMAINS, LESSONS } from '../content';
import { useProgress } from '../store/useProgress';
import { dueFlashcardIds, dueQuestionIds, getNextStep } from '../lib/dashboard';
import { domainAccuracy, heatmapData, lessonsDoneCount, questionsAnsweredCount, streakDays, weightedReadiness } from '../lib/stats';
import { DomainMasteryBar } from '../components/DomainMasteryBar';
import { Heatmap } from '../components/Heatmap';

export function Dashboard() {
  const { state } = useProgress();
  const next = getNextStep(state);
  const readiness = weightedReadiness(state);
  const heat = heatmapData(state);
  const dueTotal = dueQuestionIds(state).length + dueFlashcardIds(state).length;

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-lg font-bold">Next step</h1>
        {next.kind === 'continue-lesson' && (
          <p className="mt-2">
            Continue <span className="font-semibold">{next.title}</span>.{' '}
            <Link className="btn btn-primary ml-2" to={`/learn/${next.lessonId}`}>
              Resume lesson
            </Link>
          </p>
        )}
        {next.kind === 'start-lesson' && (
          <p className="mt-2">
            Start <span className="font-semibold">{next.title}</span>.{' '}
            <Link className="btn btn-primary ml-2" to={`/learn/${next.lessonId}`}>
              Start lesson
            </Link>
          </p>
        )}
        {next.kind === 'review' && (
          <p className="mt-2">
            You have <span className="font-semibold">{next.count}</span> item{next.count === 1 ? '' : 's'} due for review.{' '}
            <Link className="btn btn-primary ml-2" to="/review">
              Review now
            </Link>
          </p>
        )}
        {next.kind === 'weak' && (
          <p className="mt-2">
            Your weakest task statement is <span className="font-semibold">{next.taskStatement.id} {next.taskStatement.title}</span> (
            {Math.round((next.taskStatement.accuracy.pct ?? 0) * 100)}%).{' '}
            <Link className="btn btn-primary ml-2" to={`/practice?mode=taskStatement&ts=${next.taskStatement.id}`}>
              Practice it
            </Link>
          </p>
        )}
        {next.kind === 'none' && (
          <p className="mt-2 text-muted">
            No content is loaded yet, or you're all caught up. Check <Link to="/learn" className="underline">Learn</Link> for available lessons.
          </p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Weighted readiness" value={`${readiness}%`} />
        <Stat label="Lessons done" value={`${lessonsDoneCount(state)}/${LESSONS.length || 30}`} />
        <Stat label="Questions answered" value={`${questionsAnsweredCount(state)}`} />
        <Stat label="Streak" value={`${streakDays(state)}d`} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Domain mastery</h2>
        <div className="space-y-4">
          {DOMAINS.map((d) => (
            <DomainMasteryBar key={d.id} title={d.title} weight={d.weight} pct={domainAccuracy(state, d.id).pct} />
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-semibold">Task statement heatmap</h2>
        <p className="mb-3 text-sm text-muted">Practice accuracy across all 30 task statements. Gray = not attempted yet.</p>
        <Heatmap rows={heat} />
        {dueTotal > 0 && (
          <p className="mt-3 text-sm">
            <Link to="/review" className="underline">
              {dueTotal} review{dueTotal === 1 ? '' : 's'} due
            </Link>
          </p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 font-semibold">How to use this app</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Learn one chunk at a time, and answer its quick checks before moving on.</li>
          <li>Rate your confidence before you see the answer — confident mistakes are the ones most worth revisiting.</li>
          <li>Practice at exam level in the Practice tab, and explain each wrong option to yourself, not just the right one.</li>
          <li>Come back for spaced Review — it resurfaces what's due, on the schedule that sticks.</li>
          <li>Take a Mock exam once you're comfortable, under real time pressure.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Aim for <span className="font-semibold">80%+</span> on exam-level practice before you sit the real thing — and then some. The real exam's
          options sit closer together than most practice questions, so treat 80% here as a floor, not a target: aim for 80–85%+ before you feel
          done.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
