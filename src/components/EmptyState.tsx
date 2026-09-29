export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="card p-6 text-center text-muted">
      <p className="font-semibold text-[color:var(--color-text)]">{title}</p>
      {body && <p className="mt-1 text-sm">{body}</p>}
    </div>
  );
}
