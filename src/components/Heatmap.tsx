import type { WeakTaskStatement } from '../lib/stats';

function colorFor(pct: number | null): string {
  if (pct == null) return 'var(--color-surface-2)';
  if (pct >= 0.8) return 'var(--color-success)';
  if (pct >= 0.6) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function Heatmap({ rows }: { rows: WeakTaskStatement[] }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
      {rows.map((row) => {
        const pct = row.accuracy.pct;
        const label = pct == null ? `${row.id} ${row.title} — not attempted yet` : `${row.id} ${row.title} — ${Math.round(pct * 100)}% accuracy`;
        return (
          <div
            key={row.id}
            className="heat-cell"
            title={label}
            aria-label={label}
            style={{ background: colorFor(pct), opacity: pct == null ? 0.5 : 1 }}
          />
        );
      })}
    </div>
  );
}
