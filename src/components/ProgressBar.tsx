export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{label}</span>
          <span>
            {value}/{max}
          </span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--color-accent)' }} />
      </div>
    </div>
  );
}
