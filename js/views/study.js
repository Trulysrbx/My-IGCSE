import { html, plural, shuffle } from '../lib/util.js';
import { get, update, logReview } from '../store.js';
import { buildQueue, review, previewInterval, GRADES } from '../lib/srs.js';

const LABELS = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

export default function study(root, [id], query) {
  const d = get().decks[id];
  if (!d) {
    root.innerHTML = String(html`<div class="empty"><h3>Deck not found</h3><p><a href="#/flashcards">Back to flashcards</a></p></div>`);
    return;
  }

  // "cram" mode reviews every card regardless of schedule and doesn't change it.
  const cram = query.mode === 'cram';
  let queue = cram ? shuffle(d.cards) : buildQueue(d.cards, { newLimit: get().settings.newPerDay });
  const total = queue.length;
  let done = 0;
  let flipped = false;
  const tally = { again: 0, hard: 0, good: 0, easy: 0 };

  function finish() {
    root.innerHTML = String(html`
      <div class="flash-wrap">
        <p><a href="#/deck/${id}">← ${d.name}</a></p>
        <div class="card empty">
          <div style="font-size:3rem">🎉</div>
          <h2>${total ? 'Session complete!' : 'Nothing due right now'}</h2>
          <p>${total
            ? `You reviewed ${plural(done, 'card')}. ${tally.again ? `${tally.again} to look at again soon.` : 'Great work!'}`
            : 'Come back later, or cram the whole deck now without affecting your schedule.'}</p>
          <div class="row" style="justify-content:center">
            <a class="btn primary" href="#/flashcards">Back to decks</a>
            <a class="btn" href="#/study/${id}?mode=cram">Cram all cards</a>
            <a class="btn" href="#/quiz/${id}">Take a quiz</a>
          </div>
        </div>
      </div>`);
  }

  function show() {
    if (!queue.length) return finish();
    const card = queue[0];
    flipped = false;
    root.innerHTML = String(html`
      <div class="flash-wrap">
        <div class="row between">
          <a href="#/deck/${id}">← ${d.name}</a>
          <small>${cram ? 'Cram mode · ' : ''}${done} / ${total}${queue.length > total - done ? ` (+${queue.length - (total - done)} repeats)` : ''}</small>
        </div>
        <div class="progress" style="margin-top:8px"><span style="width:${total ? Math.min(100, (done / total) * 100) : 0}%"></span></div>
        <div class="flash" id="flash" tabindex="0" role="button" aria-label="Flashcard. Press space to flip.">
          <div class="flash-inner">
            <div class="flash-face front"><span class="label">Question</span>${card.front}</div>
            <div class="flash-face back"><span class="label">Answer</span>${card.back}</div>
          </div>
        </div>
        <div id="controls">
          <button class="btn primary" id="flip" style="width:100%;padding:14px">Show answer <span class="kbd">Space</span></button>
        </div>
      </div>`);

    const flash = root.querySelector('#flash');
    // Make the card tall enough for long answers.
    const faces = flash.querySelectorAll('.flash-face');
    const h = Math.max(300, ...[...faces].map((f) => f.scrollHeight));
    flash.style.minHeight = flash.querySelector('.flash-inner').style.minHeight = `${h}px`;

    flash.addEventListener('click', flip);
    root.querySelector('#flip').addEventListener('click', flip);
  }

  function flip() {
    if (flipped) return;
    flipped = true;
    root.querySelector('#flash').classList.add('flipped');
    const card = queue[0];
    const controls = root.querySelector('#controls');
    if (cram) {
      controls.innerHTML = String(html`<div class="grades" style="grid-template-columns:1fr 1fr">
        <button class="btn again" data-g="again">Still learning <span class="kbd">1</span></button>
        <button class="btn good" data-g="good">Got it <span class="kbd">2</span></button></div>`);
    } else {
      controls.innerHTML = String(html`<div class="grades">
        ${GRADES.map((g, i) => html`<button class="btn ${g}" data-g="${g}">${LABELS[g]}<small>${previewInterval(card.srs, g)} · <span class="kbd">${i + 1}</span></small></button>`)}
      </div>`);
    }
    controls.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => grade(b.dataset.g)));
  }

  function grade(g) {
    const card = queue.shift();
    tally[g]++;
    if (!cram) {
      update((s) => {
        const c = s.decks[id]?.cards.find((x) => x.id === card.id);
        if (c) c.srs = review(c.srs, g);
      });
      logReview();
    }
    if (g === 'again') {
      // See it again later in this session.
      queue.splice(Math.min(queue.length, 3 + Math.floor(Math.random() * 3)), 0, card);
    } else done++;
    show();
  }

  function onKey(e) {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (!flipped && root.querySelector('#flash')) { e.preventDefault(); flip(); }
      return;
    }
    if (!flipped) return;
    const map = cram ? { 1: 'again', 2: 'good' } : { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
    if (map[e.key]) grade(map[e.key]);
  }

  document.addEventListener('keydown', onKey);
  show();
  return () => document.removeEventListener('keydown', onKey);
}
