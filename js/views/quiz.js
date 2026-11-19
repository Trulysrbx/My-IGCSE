import { html, shuffle } from '../lib/util.js';
import { get } from '../store.js';
import { buildMultipleChoice, markTyped } from '../lib/quiz.js';

export default function quiz(root, [id], query) {
  const d = get().decks[id];
  if (!d) {
    root.innerHTML = String(html`<div class="empty"><h3>Deck not found</h3><p><a href="#/flashcards">Back to flashcards</a></p></div>`);
    return;
  }
  if (!query.type) return setup(root, d);
  const count = Math.max(1, Math.min(100, Number(query.n) || 10));
  const reverse = query.dir === 'reverse';

  const questions = query.type === 'typed'
    ? shuffle(d.cards).slice(0, count).map((card) => ({ prompt: reverse ? card.back : card.front, expected: reverse ? card.front : card.back, card }))
    : buildMultipleChoice(d.cards, { count, reverse });

  if (!questions.length) {
    root.innerHTML = String(html`<div class="empty"><h3>Not enough cards</h3><p>Multiple choice needs at least two cards with different answers.</p><p><a href="#/deck/${id}">Add more cards</a></p></div>`);
    return;
  }

  let i = 0;
  let score = 0;
  const missed = [];

  function head() {
    return html`
      <div class="row between"><a href="#/quiz/${id}">← Quiz settings</a><small>Question ${i + 1} of ${questions.length} · Score ${score}</small></div>
      <div class="progress" style="margin:8px 0 16px"><span style="width:${(i / questions.length) * 100}%"></span></div>`;
  }

  function next() {
    i++;
    if (i >= questions.length) return results();
    show();
  }

  function show() {
    const q = questions[i];
    if (query.type === 'typed') {
      root.innerHTML = String(html`<div class="flash-wrap">${head()}
        <div class="card"><p class="muted" style="margin-bottom:6px">${reverse ? 'What term matches this?' : 'Answer:'}</p><h2 style="white-space:pre-wrap">${q.prompt}</h2>
          <form id="f"><textarea id="ans" rows="3" placeholder="Type your answer…" autofocus></textarea>
          <div class="row" style="margin-top:12px"><button class="btn primary">Check</button><button type="button" class="btn ghost" id="skip">I don't know</button></div></form>
          <div id="fb"></div></div></div>`);
      const form = root.querySelector('#f');
      const reveal = (result) => {
        const label = { correct: '✓ Correct!', close: '≈ Nearly — check it against the answer', wrong: '✗ Not quite' }[result];
        root.querySelector('#fb').innerHTML = String(html`
          <div class="feedback ${result}"><b>${label}</b><div style="white-space:pre-wrap;color:var(--text);margin-top:6px">${q.expected}</div></div>
          <div class="row" style="margin-top:12px">
            ${result !== 'correct' ? html`<button class="btn small" id="override">I was right</button>` : ''}
            <button class="btn primary" id="next">Next →</button>
          </div>`);
        form.querySelectorAll('button, textarea').forEach((el) => (el.disabled = true));
        if (result === 'correct') score++;
        else missed.push(q);
        root.querySelector('#override')?.addEventListener('click', () => { score++; missed.pop(); next(); });
        const nb = root.querySelector('#next');
        nb.addEventListener('click', next);
        nb.focus();
      };
      form.addEventListener('submit', (e) => { e.preventDefault(); reveal(markTyped(root.querySelector('#ans').value, q.expected)); });
      form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
      root.querySelector('#skip').addEventListener('click', () => reveal('wrong'));
      root.querySelector('#ans').focus();
      return;
    }

    root.innerHTML = String(html`<div class="flash-wrap">${head()}
      <div class="card"><h2 style="white-space:pre-wrap">${q.prompt}</h2>
        <div class="options">${q.options.map((o, n) => html`<button class="option" data-n="${n}"><span class="kbd">${n + 1}</span> ${o}</button>`)}</div>
        <div id="fb"></div></div></div>`);
    const buttons = root.querySelectorAll('.option');
    const choose = (n) => {
      if (buttons[0].disabled) return;
      buttons.forEach((b) => (b.disabled = true));
      buttons[q.answer].classList.add('correct');
      if (n === q.answer) score++;
      else { buttons[n].classList.add('wrong'); missed.push({ prompt: q.prompt, expected: q.options[q.answer] }); }
      root.querySelector('#fb').innerHTML = String(html`<div class="row" style="margin-top:16px"><button class="btn primary" id="next">Next →</button></div>`);
      const nb = root.querySelector('#next');
      nb.addEventListener('click', next);
      nb.focus();
    };
    buttons.forEach((b) => b.addEventListener('click', () => choose(Number(b.dataset.n))));
  }

  function results() {
    const pct = Math.round((score / questions.length) * 100);
    root.innerHTML = String(html`<div class="flash-wrap">
      <div class="card" style="text-align:center">
        <p class="muted">You scored</p>
        <div class="big-score">${score} / ${questions.length}</div>
        <p class="pill ${pct >= 70 ? 'good' : pct >= 50 ? 'warn' : 'bad'}" style="font-size:1rem">${pct}%</p>
        <div class="row" style="justify-content:center;margin-top:12px">
          <a class="btn primary" href="#/quiz/${id}?${new URLSearchParams({ ...query, t: Date.now() })}">Try again</a>
          <a class="btn" href="#/study/${id}">Study deck</a>
          <a class="btn" href="#/flashcards">All decks</a>
        </div>
      </div>
      ${missed.length ? html`<div class="card"><h3>Review these</h3><ul class="preview-list">
        ${missed.map((m) => html`<li><div><div class="q">${m.prompt}</div><div class="a">${m.expected}</div></div></li>`)}
      </ul></div>` : ''}
    </div>`);
  }

  function onKey(e) {
    if (query.type === 'typed' || e.target.matches('input, textarea, select')) return;
    const n = Number(e.key) - 1;
    const b = root.querySelectorAll('.option')[n];
    if (b && !b.disabled) b.click();
  }
  document.addEventListener('keydown', onKey);
  show();
  return () => document.removeEventListener('keydown', onKey);
}

function setup(root, d) {
  root.innerHTML = String(html`<div class="flash-wrap">
    <p><a href="#/deck/${d.id}">← ${d.name}</a></p>
    <h1>Quiz: ${d.name}</h1>
    <form class="card" id="setup">
      <div class="field"><label>Question type</label>
        <div class="row">
          <label class="check"><input type="radio" name="type" value="mc" checked> Multiple choice</label>
          <label class="check"><input type="radio" name="type" value="typed"> Type the answer</label>
        </div></div>
      <div class="field"><label>Direction</label>
        <div class="row">
          <label class="check"><input type="radio" name="dir" value="normal" checked> Front → back</label>
          <label class="check"><input type="radio" name="dir" value="reverse"> Back → front</label>
        </div></div>
      <div class="field"><label for="n">Number of questions</label>
        <input id="n" name="n" type="number" min="1" max="${Math.max(1, d.cards.length)}" value="${Math.min(10, d.cards.length) || 1}" style="max-width:120px"></div>
      <button class="btn primary">Start quiz</button>
    </form></div>`);
  root.querySelector('#setup').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    location.hash = `#/quiz/${d.id}?${new URLSearchParams({ type: f.get('type'), dir: f.get('dir'), n: f.get('n') })}`;
  });
}
