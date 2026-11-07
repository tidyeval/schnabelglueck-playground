const PREFIX = 'schnabel-playground-six:goodies-v1:best:';
export function dayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function seedForDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) throw new Error('Daily route requires a valid YYYY-MM-DD date.');
  let seed = 2166136261;
  for (const ch of day) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  return seed;
}
export function readBest(day, storage) {
  try { storage ??= globalThis.localStorage; const value = Number(storage.getItem(PREFIX + day)); return Number.isSafeInteger(value) && value >= 0 ? value : 0; }
  catch { return null; }
}
export function saveBest(day, score, storage) {
  if (!Number.isSafeInteger(score) || score < 0) throw new Error('Daily score must be a non-negative integer.');
  storage ??= globalThis.localStorage;
  const previous = readBest(day, storage);
  if (previous === null) throw new Error('Der Tagesrekord konnte nicht gespeichert werden.');
  const best = Math.max(previous, score); storage.setItem(PREFIX + day, String(best)); return best;
}
