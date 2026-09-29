export function dateKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Counts consecutive days ending today or yesterday (so the streak doesn't vanish before the user's next session). */
export function computeStreak(activeDates: string[], now: number = Date.now()): number {
  if (activeDates.length === 0) return 0;
  const set = new Set(activeDates);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  // If today has no activity yet, start counting from yesterday instead.
  if (!set.has(dateKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(dateKey(cursor.getTime()))) return 0;
  }
  let streak = 0;
  while (set.has(dateKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatRelativeDue(ts: number, now: number = Date.now()): string {
  const diff = ts - now;
  if (diff <= 0) return 'due now';
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `due in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `due in ${hours}h`;
  const days = Math.round(hours / 24);
  return `due in ${days}d`;
}
