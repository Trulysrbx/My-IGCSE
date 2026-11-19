import { html, plural, dayKey } from '../lib/util.js';
import { get, deckList, streak } from '../store.js';
import { deckStats } from '../lib/srs.js';
import { subjectByCode } from '../data/subjects.js';

const FEATURES = [
  ['📄', 'Past papers', 'Every Cambridge IGCSE paper, mark scheme and examiner report — tick them off and log your score.', '#/papers'],
  ['🃏', 'Flashcards', 'Spaced-repetition flashcards with ready-made decks for the big subjects.', '#/flashcards'],
  ['✨', 'Generate cards', 'Paste your notes and turn them into flashcards in one click.', '#/generate'],
  ['❓', 'Quizzes', 'Multiple-choice and typed-answer quizzes built from any deck.', '#/flashcards'],
  ['🎯', 'Topic tracker', 'Rate your confidence on every syllabus topic and see where to focus.', '#/topics'],
  ['⏱️', 'Planner & timer', 'Exam countdowns, a focus timer and your study streak.', '#/planner'],
  ['🗣️', 'Command words', 'What "describe", "explain" and "evaluate" really ask for.', '#/command-words'],
];

export default function home(root) {
  const s = get();
  const decks = deckList();
  const now = Date.now();
  const due = decks.reduce((n, d) => n + deckStats(d.cards, now).due, 0);
  const reviewsToday = s.stats.reviews[dayKey()] || 0;
  const papersDone = Object.values(s.papers).filter((p) => p.done).length;
  const nextExam = s.exams
    .filter((e) => new Date(e.date).getTime() > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const daysTo = nextExam ? Math.ceil((new Date(nextExam.date) - now) / 86400000) : null;
  const dueDecks = decks.filter((d) => deckStats(d.cards, now).due > 0).slice(0, 4);

  root.innerHTML = String(html`
    <section class="hero">
      <h1>Revise smarter for your IGCSEs</h1>
      <p>Past papers, flashcards, quizzes and progress tracking — completely free and open source. No sign-up: everything is saved in your browser.</p>
      <div class="row">
        <a class="btn primary" href="#/papers">Find past papers</a>
        <a class="btn" href="#/generate">Make flashcards from notes</a>
      </div>
    </section>

    <section class="section stats" aria-label="Your progress">
      <div class="stat"><b>${streak()}</b><span>day streak 🔥</span></div>
      <div class="stat"><b>${due}</b><span>cards due</span></div>
      <div class="stat"><b>${reviewsToday}</b><span>reviews today</span></div>
      <div class="stat"><b>${papersDone}</b><span>past papers done</span></div>
      <div class="stat">${nextExam
        ? html`<b>${daysTo}</b><span>${daysTo === 1 ? 'day' : 'days'} to ${[subjectByCode(nextExam.subject)?.name, nextExam.title].filter(Boolean).join(' ') || 'your exam'}</span>`
        : html`<b>—</b><span><a href="#/planner">Add your exam dates</a></span>`}</div>
    </section>

    ${dueDecks.length ? html`
      <section class="section">
        <div class="section-head"><h2>Due for review</h2><a href="#/flashcards">All decks</a></div>
        <div class="grid">
          ${dueDecks.map((d) => html`
            <a class="card feature" href="#/study/${d.id}">
              <h3>${d.name}</h3>
              <p>${plural(deckStats(d.cards, now).due, 'card')} due · tap to study</p>
            </a>`)}
        </div>
      </section>` : ''}

    <section class="section">
      <div class="section-head"><h2>Everything you need</h2></div>
      <div class="grid">
        ${FEATURES.map(([ico, title, text, href]) => html`
          <a class="card feature" href="${href}"><span class="ico" aria-hidden="true">${ico}</span><h3>${title}</h3><p>${text}</p></a>`)}
      </div>
    </section>
  `);
}
