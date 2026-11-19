import { html, plural, toast, download } from '../lib/util.js';
import { get, update, makeCard } from '../store.js';
import { deckStats, newSrs } from '../lib/srs.js';
import { SUBJECTS } from '../data/subjects.js';
import { encodeDeck } from '../lib/share.js';

export default function deck(root, [id]) {
  const d = get().decks[id];
  if (!d) {
    root.innerHTML = String(html`<div class="empty"><h3>Deck not found</h3><p><a href="#/flashcards">Back to flashcards</a></p></div>`);
    return;
  }
  const st = deckStats(d.cards);

  root.innerHTML = String(html`
    <p><a href="#/flashcards">← Flashcards</a></p>
    <div class="row between">
      <h1 style="margin:0">${d.name}</h1>
      <div class="row">
        <a class="btn primary" href="#/study/${d.id}">Study (${st.due + Math.min(st.new, get().settings.newPerDay)})</a>
        <a class="btn" href="#/quiz/${d.id}">Quiz</a>
      </div>
    </div>

    <div class="card section">
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
        <div class="field"><label for="name">Deck name</label><input id="name" type="text" value="${d.name}"></div>
        <div class="field"><label for="subject">Subject</label>
          <select id="subject"><option value="">— none —</option>
            ${SUBJECTS.map((s) => html`<option value="${s.code}" ${s.code === d.subject ? 'selected' : ''}>${s.name} (${s.code})</option>`)}
          </select>
        </div>
      </div>
      <div class="row">
        <button class="btn small" id="share">🔗 Copy share link</button>
        <button class="btn small" id="export-json">Download .json</button>
        <button class="btn small" id="export-csv">Download .csv</button>
        <button class="btn small" id="reset">Reset progress</button>
        <span class="spacer"></span>
        <button class="btn small danger" id="delete">Delete deck</button>
      </div>
    </div>

    <section class="section">
      <div class="section-head"><h2>${plural(d.cards.length, 'card')}</h2><a href="#/generate?deck=${d.id}">✨ Add cards from notes</a></div>
      <form class="card" id="add">
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
          <div><label for="front">Front (question / term)</label><textarea id="front" rows="2" required></textarea></div>
          <div><label for="back">Back (answer / definition)</label><textarea id="back" rows="2" required></textarea></div>
        </div>
        <div class="row" style="margin-top:12px"><button class="btn primary">Add card</button><small>Tip: press Ctrl/⌘ + Enter to add</small></div>
      </form>
      <div class="card section">
        ${d.cards.length ? html`<ul class="card-list">
          ${d.cards.map((c) => html`
            <li data-card="${c.id}">
              <textarea data-f="front" rows="2" aria-label="Front">${c.front}</textarea>
              <textarea data-f="back" rows="2" aria-label="Back">${c.back}</textarea>
              <button class="btn small ghost danger" data-del title="Delete card" aria-label="Delete card">✕</button>
            </li>`)}
        </ul>` : html`<p class="empty">No cards yet — add one above.</p>`}
      </div>
    </section>
  `);

  const $ = (s) => root.querySelector(s);
  $('#name').addEventListener('change', (e) => update((s) => { s.decks[id].name = e.target.value.trim() || 'Untitled deck'; }));
  $('#subject').addEventListener('change', (e) => update((s) => { s.decks[id].subject = e.target.value; }));

  const add = (e) => {
    e.preventDefault();
    const front = $('#front').value.trim();
    const back = $('#back').value.trim();
    if (!front || !back) return toast('Fill in both sides');
    update((s) => { s.decks[id].cards.push(makeCard(front, back)); });
    deck(root, [id]);
    root.querySelector('#front').focus();
  };
  $('#add').addEventListener('submit', add);
  $('#add').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add(e); });

  root.querySelectorAll('[data-card]').forEach((li) => {
    const cid = li.dataset.card;
    li.addEventListener('change', (e) => {
      const f = e.target.dataset.f;
      if (!f) return;
      update((s) => { const c = s.decks[id].cards.find((x) => x.id === cid); if (c) c[f] = e.target.value.trim(); });
    });
    li.querySelector('[data-del]').addEventListener('click', () => {
      update((s) => { s.decks[id].cards = s.decks[id].cards.filter((x) => x.id !== cid); });
      li.remove();
    });
  });

  $('#share').addEventListener('click', async () => {
    const code = await encodeDeck(get().decks[id]);
    const url = `${location.origin}${location.pathname}#/share/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast(url.length > 8000 ? 'Link copied — it is long, a .json file may be easier to share' : 'Share link copied!');
    } catch {
      prompt('Copy this link:', url);
    }
  });

  const safeName = () => d.name.replace(/[^\w-]+/g, '_').slice(0, 60) || 'deck';
  $('#export-json').addEventListener('click', () => {
    const cur = get().decks[id];
    download(`${safeName()}.json`, JSON.stringify({ name: cur.name, subject: cur.subject, cards: cur.cards.map((c) => ({ front: c.front, back: c.back })) }, null, 2));
  });
  $('#export-csv').addEventListener('click', () => {
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    download(`${safeName()}.csv`, get().decks[id].cards.map((c) => `${q(c.front)},${q(c.back)}`).join('\n'), 'text/csv');
  });
  $('#reset').addEventListener('click', () => {
    if (!confirm('Reset review progress for every card in this deck?')) return;
    update((s) => s.decks[id].cards.forEach((c) => { c.srs = newSrs(); }));
    deck(root, [id]);
  });
  $('#delete').addEventListener('click', () => {
    if (!confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
    update((s) => { delete s.decks[id]; });
    location.hash = '#/flashcards';
  });
}
