// Spaced repetition scheduling — a simplified SM-2 (the algorithm behind Anki).
// Pure functions so they can be unit tested in Node.

import { DAY } from './util.js';

export const GRADES = ['again', 'hard', 'good', 'easy'];
const MIN_EASE = 1.3;
const RELEARN_MS = 10 * 60 * 1000; // "Again" brings the card back in 10 minutes

export function newSrs() {
  return { due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
}

export const isNew = (srs) => !srs || srs.reps === 0 && srs.lapses === 0 && !srs.due;

/**
 * Return the next scheduling state for a card.
 * @param {object} srs current state (from newSrs)
 * @param {'again'|'hard'|'good'|'easy'} grade
 * @param {number} now timestamp in ms
 */
export function review(srs, grade, now = Date.now()) {
  const s = { ...newSrs(), ...srs };
  let { interval, ease, reps, lapses } = s;

  switch (grade) {
    case 'again':
      return { interval: 0, ease: Math.max(MIN_EASE, ease - 0.2), reps: 0, lapses: lapses + 1, due: now + RELEARN_MS };
    case 'hard':
      interval = reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2));
      ease = Math.max(MIN_EASE, ease - 0.15);
      break;
    case 'good':
      interval = reps === 0 ? 1 : reps === 1 ? Math.max(3, interval + 1) : Math.max(interval + 1, Math.round(interval * ease));
      break;
    case 'easy':
      interval = reps === 0 ? 4 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
      ease += 0.15;
      break;
    default:
      throw new Error(`Unknown grade: ${grade}`);
  }
  return { interval, ease: Math.round(ease * 100) / 100, reps: reps + 1, lapses, due: now + interval * DAY };
}

/** Human-friendly preview of the interval a grade would give ("10m", "3d", "2mo"). */
export function previewInterval(srs, grade, now = Date.now()) {
  const next = review(srs, grade, now);
  return formatDuration(next.due - now);
}

export function formatDuration(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const days = Math.round(ms / DAY);
  if (days < 1) return `${Math.round(mins / 60)}h`;
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/** Cards due now (including brand-new cards). */
export const isDue = (srs, now = Date.now()) => !srs || (srs.due || 0) <= now;

/**
 * Build a study queue: due review cards first (most overdue first), then up to
 * `newLimit` new cards in their original order.
 */
export function buildQueue(cards, { now = Date.now(), newLimit = 20 } = {}) {
  const reviews = [];
  const fresh = [];
  for (const c of cards) {
    if (isNew(c.srs)) fresh.push(c);
    else if (isDue(c.srs, now)) reviews.push(c);
  }
  reviews.sort((a, b) => a.srs.due - b.srs.due);
  return [...reviews, ...fresh.slice(0, newLimit)];
}

/** Summary counts for a deck. */
export function deckStats(cards, now = Date.now()) {
  let fresh = 0, due = 0, learned = 0;
  for (const c of cards) {
    if (isNew(c.srs)) fresh++;
    else {
      if (isDue(c.srs, now)) due++;
      if ((c.srs.interval || 0) >= 21) learned++;
    }
  }
  return { total: cards.length, new: fresh, due, learned };
}
