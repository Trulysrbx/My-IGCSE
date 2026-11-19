// All user data lives in this browser's localStorage — no accounts, no server.
// Use Settings → Export to back it up or move it to another device.

import { uid, dayKey } from './lib/util.js';
import { newSrs } from './lib/srs.js';
import { DEFAULT_SOURCE } from './data/sources.js';

const KEY = 'my-igcse:v1';

const defaults = () => ({
  version: 1,
  decks: {},            // id -> { id, name, subject, cards: [{id, front, back, srs}], created, from? }
  papers: {},           // filename -> { done: true, score, max, date, notes }
  topics: {},           // subject code -> { topicIndex: 0..3 }
  exams: [],            // [{ id, subject, title, date }]
  stats: { reviews: {}, minutes: {} }, // dayKey -> count
  settings: { theme: 'auto', source: DEFAULT_SOURCE, subjects: [], newPerDay: 20, pomodoro: 25, shortBreak: 5 },
});

function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return base;
  const out = { ...base, ...saved };
  out.stats = { ...base.stats, ...(saved.stats || {}) };
  out.settings = { ...base.settings, ...(saved.settings || {}) };
  return out;
}

function load() {
  try {
    return merge(defaults(), JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return defaults();
  }
}

let state = load();

export const get = () => state;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Could not save', e);
  }
}

/** Mutate state and persist. */
export function update(fn) {
  fn(state);
  save();
}

export function exportAll() {
  return JSON.stringify({ app: 'my-igcse', exported: new Date().toISOString(), data: state }, null, 2);
}

export function importAll(text) {
  const parsed = JSON.parse(text);
  const data = parsed && parsed.app === 'my-igcse' ? parsed.data : parsed;
  if (!data || typeof data !== 'object' || !('decks' in data)) throw new Error('This file is not a My IGCSE backup');
  state = merge(defaults(), data);
  save();
}

export function resetAll() {
  state = defaults();
  save();
}

// ---- Decks ---------------------------------------------------------------

export const makeCard = (front, back) => ({ id: uid(), front: String(front).trim(), back: String(back).trim(), srs: newSrs() });

export function createDeck({ name, subject = '', cards = [], from } = {}) {
  const id = uid();
  update((s) => {
    s.decks[id] = { id, name: name || 'Untitled deck', subject, cards: cards.map((c) => makeCard(c.front, c.back)), created: Date.now(), from };
  });
  return id;
}

export const deckList = () => Object.values(state.decks).sort((a, b) => (b.created || 0) - (a.created || 0));

export function logReview() {
  update((s) => {
    const k = dayKey();
    s.stats.reviews[k] = (s.stats.reviews[k] || 0) + 1;
  });
}

export function logMinutes(n) {
  update((s) => {
    const k = dayKey();
    s.stats.minutes[k] = (s.stats.minutes[k] || 0) + n;
  });
}

/** Consecutive days (ending today or yesterday) with any study activity. */
export function streak() {
  const active = (k) => (state.stats.reviews[k] || 0) > 0 || (state.stats.minutes[k] || 0) > 0;
  const d = new Date();
  if (!active(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (active(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
