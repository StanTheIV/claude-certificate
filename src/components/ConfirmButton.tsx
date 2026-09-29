import { useState } from 'react';

/** A two-step in-UI confirmation, for destructive actions (no window.confirm). */
export function ConfirmButton({
  label,
  confirmLabel = 'Are you sure? Confirm',
  className = 'btn btn-danger',
  onConfirm,
}: {
  label: string;
  confirmLabel?: string;
  className?: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className={className} onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="btn btn-danger"
        onClick={() => {
          setConfirming(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
}
