import { useRef, useState } from 'react';
import { useProgress } from '../store/useProgress';
import { exportStateAsJson, parseImportedState } from '../store/persist';
import { ConfirmButton } from '../components/ConfirmButton';
import type { Theme } from '../store/types';

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--color-accent)', width: 20, height: 20 }} />
    </label>
  );
}

export function Settings() {
  const { state, dispatch } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importOk, setImportOk] = useState(false);

  function handleExport() {
    const json = exportStateAsJson(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ccarf-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File) {
    setImportError(null);
    setImportOk(false);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseImportedState(text);
      if (!parsed) {
        setImportError("That file doesn't look like a CCAR-F progress export.");
        return;
      }
      dispatch({ type: 'IMPORT_STATE', state: parsed });
      setImportOk(true);
    };
    reader.onerror = () => setImportError('Could not read that file.');
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <section className="card divide-y p-4" style={{ borderColor: 'var(--color-border)' }}>
        <Toggle
          label="Detective mode"
          hint="Read the stem before you see the options."
          checked={state.settings.detectiveMode}
          onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', settings: { detectiveMode: v } })}
        />
        <Toggle
          label="Confidence rating"
          hint="Rate Sure / Think so / Guessing before feedback is revealed."
          checked={state.settings.confidenceEnabled}
          onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', settings: { confidenceEnabled: v } })}
        />
        <Toggle
          label="Shuffle options"
          hint="Randomize option order per display (letters still shown A, B, C…)."
          checked={state.settings.shuffleOptions}
          onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', settings: { shuffleOptions: v } })}
        />
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">Theme</h2>
        <div className="mt-2 flex gap-3">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => (
            <label key={t} className="flex items-center gap-1 text-sm capitalize">
              <input
                type="radio"
                name="theme"
                checked={state.settings.theme === t}
                onChange={() => dispatch({ type: 'UPDATE_SETTINGS', settings: { theme: t } })}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              {t}
            </label>
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Your data</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={handleExport}>
            Export progress (JSON)
          </button>
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
            Import progress
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importError && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{importError}</p>}
        {importOk && <p className="text-sm" style={{ color: 'var(--color-success)' }}>Progress imported.</p>}

        <div className="pt-2">
          <ConfirmButton
            label="Reset all progress"
            confirmLabel="Confirm reset — this can't be undone"
            onConfirm={() => dispatch({ type: 'RESET_PROGRESS' })}
          />
        </div>
      </section>
    </div>
  );
}
