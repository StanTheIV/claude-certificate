import { Link } from 'react-router-dom';
import { DOMAINS, REPEAT_UNIT, getLesson } from '../content';
import { useProgress } from '../store/useProgress';
import { quickCheckAccuracy } from '../lib/stats';

export function Learn() {
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Learn</h1>
      {DOMAINS.map((domain) => (
        <section key={domain.id} className="card p-5">
          <h2 className="mb-3 flex items-baseline justify-between font-semibold">
            <span>
              Domain {domain.id}: {domain.title}
            </span>
            <span className="chip">{domain.weight}% of exam</span>
          </h2>
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {domain.taskStatements.map((ts) => (
              <LessonRow key={ts.id} id={ts.id} title={ts.title} />
            ))}
          </ul>
        </section>
      ))}
      <section className="card p-5">
        <h2 className="mb-1 flex items-baseline justify-between font-semibold">
          <span>{REPEAT_UNIT.title}</span>
          <span className="chip">All domains</span>
        </h2>
        <p className="mb-3 text-sm text-muted">{REPEAT_UNIT.description}</p>
        <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {REPEAT_UNIT.lessons.map((l) => (
            <LessonRow key={l.id} id={l.id} title={l.title} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function LessonRow({ id, title }: { id: string; title: string }) {
  const { state } = useProgress();
  const lesson = getLesson(id);
  const progress = state.lessonProgress[id];
  const status = !lesson ? 'coming-soon' : progress?.done ? 'done' : progress ? 'in-progress' : 'not-started';
  const acc = lesson ? quickCheckAccuracy(state, id, lesson.chunks.length) : { pct: null };
  const row = (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="font-medium">
          {id} {title}
        </p>
        <p className="text-xs text-muted">
          {acc.pct != null ? `Quick-check accuracy: ${Math.round(acc.pct * 100)}%` : 'No quick checks answered yet'}
        </p>
      </div>
      <StatusChip status={status} />
    </div>
  );
  return (
    <li>
      {lesson ? (
        <Link to={`/learn/${id}`} className="block focus-ring rounded-md hover:opacity-80">
          {row}
        </Link>
      ) : (
        row
      )}
    </li>
  );
}

function StatusChip({ status }: { status: 'coming-soon' | 'done' | 'in-progress' | 'not-started' }) {
  const labels: Record<typeof status, string> = {
    'coming-soon': 'Coming soon',
    done: 'Done',
    'in-progress': 'In progress',
    'not-started': 'Not started',
  };
  const colors: Record<typeof status, string> = {
    'coming-soon': 'var(--color-text-muted)',
    done: 'var(--color-success)',
    'in-progress': 'var(--color-warning)',
    'not-started': 'var(--color-text-muted)',
  };
  return (
    <span className="chip" style={{ color: colors[status], borderColor: colors[status] }}>
      {labels[status]}
    </span>
  );
}
