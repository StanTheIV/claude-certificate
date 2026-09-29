import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DOMAIN_NOTES } from '../content';
import { noteAnchorId, parseDomainNotes } from '../lib/domainNotes';
import { EmptyState } from '../components/EmptyState';
import { Markdown } from '../components/Markdown';

export function DomainNotes() {
  const [params] = useSearchParams();
  const targetTs = params.get('ts');
  const parsed = useMemo(() => parseDomainNotes(DOMAIN_NOTES), []);

  useEffect(() => {
    if (!targetTs) return;
    const el = document.getElementById(noteAnchorId(targetTs));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('note-highlight');
    const t = setTimeout(() => el.classList.remove('note-highlight'), 2000);
    return () => clearTimeout(t);
  }, [targetTs]);

  if (!DOMAIN_NOTES) {
    return <EmptyState title="Domain notes aren't written yet." body="Check back soon." />;
  }

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Domain notes</h1>
      <p className="mb-4 text-sm text-muted">Compact per-task-statement revision notes. The best material for a final pass before the exam.</p>
      {parsed.attribution && <Markdown className="mb-6">{parsed.attribution}</Markdown>}

      {/* This page is a single long scroll (all 30 task statements). The sidebar contents below is desktop-only,
          so phones get a jump-to select instead of blind scrolling. */}
      <label className="mb-6 block text-sm md:hidden">
        <span className="mb-1 block font-medium">Jump to task statement</span>
        <select
          className="input w-full rounded-md border p-2"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) jumpTo(e.target.value);
          }}
        >
          <option value="" disabled>
            Choose a task statement…
          </option>
          {parsed.domains.map((d) => (
            <optgroup key={d.id} label={`Domain ${d.id}: ${d.title}`}>
              {d.taskStatements.map((ts) => (
                <option key={ts.id} value={noteAnchorId(ts.id)}>
                  {ts.id} {ts.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <nav className="sticky top-6 max-h-[calc(100vh-8rem)] space-y-3 overflow-y-auto pr-2 text-sm" aria-label="Domain notes contents">
            {parsed.domains.map((d) => (
              <div key={d.id}>
                <button
                  type="button"
                  className="text-left font-semibold hover:underline"
                  onClick={() => jumpTo(`notes-domain-${d.id}`)}
                >
                  Domain {d.id}
                </button>
                <ul className="mt-1 space-y-0.5 border-l pl-2" style={{ borderColor: 'var(--color-border)' }}>
                  {d.taskStatements.map((ts) => (
                    <li key={ts.id}>
                      <button type="button" className="text-left text-muted hover:underline hover:text-[color:var(--color-text)]" onClick={() => jumpTo(noteAnchorId(ts.id))}>
                        {ts.id}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="space-y-10">
          {parsed.domains.map((d) => (
            <section key={d.id} id={`notes-domain-${d.id}`}>
              <h2 className="mb-3 text-lg font-bold">
                Domain {d.id}: {d.title}
              </h2>
              <div className="space-y-6">
                {d.taskStatements.map((ts) => (
                  <div key={ts.id} id={noteAnchorId(ts.id)} className="scroll-mt-6">
                    <h3 className="mb-2 font-semibold">
                      {ts.id} {ts.title}
                    </h3>
                    <Markdown>{ts.body}</Markdown>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
