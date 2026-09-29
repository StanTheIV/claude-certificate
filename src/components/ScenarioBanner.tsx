import type { Scenario } from '../content';

export function ScenarioBanner({ scenario, expanded }: { scenario: Scenario; expanded: boolean }) {
  return (
    <div className="card mb-4 p-4" style={{ borderColor: 'var(--color-accent)' }}>
      <p className="text-xs font-semibold uppercase text-muted">Scenario {scenario.id}{!scenario.official ? ' (community extra)' : ''}</p>
      <p className="font-semibold">{scenario.title}</p>
      {expanded && <p className="mt-1 text-sm text-muted">{scenario.description}</p>}
    </div>
  );
}
