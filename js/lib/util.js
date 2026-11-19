// Small helpers shared by every view. No dependencies, no DOM access at import time.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape a value for safe insertion into HTML. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

/** Mark a string as trusted HTML so `html` will not escape it. */
export const raw = (s) => new Raw(String(s));

function renderValue(v) {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(renderValue).join('');
  if (v instanceof Raw) return v.s;
  return esc(v);
}

/**
 * Tagged template that escapes every interpolated value unless it was
 * produced by `html` or `raw`. Arrays are joined, null/false render nothing.
 */
export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += renderValue(vals[i]) + strings[i + 1];
  return new Raw(out);
}

/** Short random id, good enough for local data. */
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const DAY = 24 * 60 * 60 * 1000;

/** Local date key like 2026-11-19. */
export function dayKey(d = new Date()) {
  const dt = new Date(d);
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${m}-${day}`;
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lower-case, strip punctuation and collapse whitespace for answer comparison. */
export function normalise(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.+\-*/^= ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein distance (iterative, O(n*m) time, O(m) memory). */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Similarity between 0 and 1 based on edit distance of normalised strings. */
export function similarity(a, b) {
  const x = normalise(a);
  const y = normalise(b);
  if (!x && !y) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

/** Pluralise: plural(3, 'card') -> '3 cards'. */
export const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;

/** Trigger a file download in the browser. */
export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Read a File chosen by the user as text. */
export const readFile = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });

let toastTimer;
/** Show a short message at the bottom of the screen. */
export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
