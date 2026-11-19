// Hash router: every page is a function (root, params, query) that renders into <main>.

import * as timer from './lib/timer.js';
import home from './views/home.js';
import papers from './views/papers.js';
import flashcards from './views/flashcards.js';
import deck from './views/deck.js';
import study from './views/study.js';
import quiz from './views/quiz.js';
import generate from './views/generate.js';
import topics from './views/topics.js';
import planner from './views/planner.js';
import commandWords from './views/commandWords.js';
import settings from './views/settings.js';
import importShared from './views/import.js';
import { html } from './lib/util.js';

const routes = [
  [/^$/, home, ''],
  [/^papers(?:\/(\d{4}))?$/, papers, 'papers'],
  [/^flashcards$/, flashcards, 'flashcards'],
  [/^deck\/([\w-]+)$/, deck, 'flashcards'],
  [/^study\/([\w-]+)$/, study, 'flashcards'],
  [/^quiz\/([\w-]+)$/, quiz, 'flashcards'],
  [/^generate$/, generate, 'generate'],
  [/^topics(?:\/(\d{4}))?$/, topics, 'topics'],
  [/^planner$/, planner, 'planner'],
  [/^command-words$/, commandWords, 'command-words'],
  [/^settings$/, settings, ''],
  [/^share\/(.+)$/, importShared, 'flashcards'],
];

const main = document.getElementById('main');
let cleanup = null;

function notFound(root) {
  root.innerHTML = String(html`<div class="empty"><h3>Page not found</h3><p><a href="#/">Go home</a></p></div>`);
}

function render() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = hash.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;

  let matched = false;
  for (const [re, view, nav] of routes) {
    const m = path.match(re);
    if (!m) continue;
    matched = true;
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav));
    try {
      cleanup = view(main, m.slice(1).map((p) => (p ? decodeURIComponent(p) : p)), query);
    } catch (err) {
      console.error(err);
      main.innerHTML = String(html`<div class="card"><h2>Something went wrong</h2><p class="muted">${err.message}</p><p><a href="#/">Go home</a></p></div>`);
    }
    break;
  }
  if (!matched) notFound(main);
}

window.addEventListener('hashchange', () => {
  render();
  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
});

// Header timer pill — visible whenever a Pomodoro is running or paused mid-way.
const pill = document.getElementById('timer-pill');
timer.subscribe((t) => {
  pill.hidden = !(t.running || t.started);
  pill.textContent = `${t.mode === 'focus' ? '🎯' : '☕'} ${timer.format(t.remaining)}${t.running ? '' : ' ⏸'}`;
});

render();
document.documentElement.dataset.ready = '1';
