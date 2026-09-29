import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DOMAIN_NOTES } from '../content';

const ALL_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/learn', label: 'Learn' },
  { to: '/practice', label: 'Practice' },
  { to: '/exam', label: 'Mock exam' },
  { to: '/review', label: 'Review' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/notes', label: 'Domain notes' },
  { to: '/cheatsheet', label: 'Cheat sheet' },
  { to: '/settings', label: 'Settings' },
];
/** Domain notes are local-only (unlicensed source, gitignored), so the public build hides the link. */
const LINKS = ALL_LINKS.filter((l) => l.to !== '/notes' || DOMAIN_NOTES);

/** Primary items get a slot in the mobile bottom bar; the rest live behind "More" so 390px phones don't need a hidden scroll to reach them. */
const MOBILE_PRIMARY = ['/', '/learn', '/practice', '/exam', '/review'];
const mobilePrimaryLinks = LINKS.filter((l) => MOBILE_PRIMARY.includes(l.to));
const mobileMoreLinks = LINKS.filter((l) => !MOBILE_PRIMARY.includes(l.to));

function linkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]' : 'text-muted hover:text-[color:var(--color-text)]'}`;
}

function mobileLinkClass({ isActive }: { isActive: boolean }) {
  return `flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-center text-xs font-medium min-h-11 ${isActive ? 'text-[color:var(--color-accent)]' : 'text-muted'}`;
}

export function Nav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreIsActive = mobileMoreLinks.some((l) => (l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to)));

  // Close the "More" panel on navigation, so it never lingers over content. Reset during render
  // (comparing against the last-seen path, kept in state) rather than in an effect, per React's
  // "adjusting state when a prop changes" pattern — avoids an extra render pass and a ref read during render.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (moreOpen) setMoreOpen(false);
  }

  // Close the "More" panel on outside click / Escape.
  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  return (
    <>
      <button
        type="button"
        className="skip-link"
        onClick={() => {
          const el = document.getElementById('main');
          el?.focus();
        }}
      >
        Skip to content
      </button>
      <header className="surface z-20 shrink-0 border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-bold" style={{ color: 'var(--color-accent)' }}>
            CCAR-F Trainer
          </NavLink>
          <nav className="hidden flex-wrap gap-1 md:flex" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === '/'}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Single fixed column (panel stacked on top of the bar) so the "More" panel always sits flush above the
          bar without hardcoding the bar's height. */}
      <div ref={moreRef} className="fixed inset-x-0 bottom-0 z-20 flex flex-col md:hidden">
        {moreOpen && (
          <div className="surface border-t p-2 shadow-lg">
            <nav className="grid grid-cols-2 gap-1" aria-label="More">
              {mobileMoreLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setMoreOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <nav className="surface flex border-t" aria-label="Main" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {mobilePrimaryLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={mobileLinkClass}>
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-center text-xs font-medium min-h-11 ${moreOpen || moreIsActive ? 'text-[color:var(--color-accent)]' : 'text-muted'}`}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            onClick={() => setMoreOpen((v) => !v)}
          >
            More
          </button>
        </nav>
      </div>
    </>
  );
}
