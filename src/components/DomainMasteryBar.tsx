export function DomainMasteryBar({
  title,
  weight,
  pct,
}: {
  title: string;
  weight: number;
  pct: number | null;
}) {
  const displayPct = pct == null ? 0 : Math.round(pct * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted">
          {pct == null ? 'no data' : `${displayPct}%`} <span className="chip ml-1">{weight}% of exam</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full surface-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${displayPct}%`,
            background: pct == null ? 'var(--color-border)' : 'var(--color-accent)',
          }}
        />
      </div>
    </div>
  );
}
