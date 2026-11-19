import { html, plural, toast, readFile } from '../lib/util.js';
import { deckList, createDeck } from '../store.js';
import { deckStats } from '../lib/srs.js';
import { LIBRARY, libraryDeck } from '../data/decks.js';
import { subjectByCode, SUBJECTS } from '../data/subjects.js';
import { parseDelimited } from '../lib/generator.js';

export default function flashcards(root) {
  const decks = deckList();
  const now = Date.now();
  const added = new Set(decks.map((d) => d.from).filter(Boolean));

  root.innerHTML = String(html`
    <div class="row between">
      <div>
        <h1 style="margin-bottom:4px">Flashcards</h1>
        <p class="muted" style="margin:0">Spaced repetition shows you each card just before you'd forget it.</p>
      </div>
      <div class="row">
        <a class="btn primary" href="#/generate">✨ Generate from notes</a>
        <button class="btn" id="new-deck">+ New deck</button>
        <label class="btn" style="margin:0">Import file<input type="file" id="import" accept=".json,.csv,.tsv,.txt" hidden></label>
      </div>
    </div>

    <section class="section">
      <div class="section-head"><h2>My decks</h2></div>
      ${decks.length ? html`
        <div class="grid">
          ${decks.map((d) => {
            const st = deckStats(d.cards, now);
            const subj = subjectByCode(d.subject);
            const pct = st.total ? Math.round(((st.total - st.new) / st.total) * 100) : 0;
            return html`
              <div class="card deck-card">
                <div class="row between"><h3>${d.name}</h3>${subj ? html`<span class="pill">${subj.icon} ${subj.name}</span>` : ''}</div>
                <div class="row" style="gap:6px">
                  <span class="pill ${st.due ? 'warn' : ''}">${st.due} due</span>
                  <span class="pill accent">${st.new} new</span>
                  <span class="pill good">${st.learned} learned</span>
                </div>
                <div class="progress" title="${pct}% seen"><span style="width:${pct}%"></span></div>
                <small>${plural(st.total, 'card')}</small>
                <div class="row">
                  <a class="btn primary small" href="#/study/${d.id}">Study</a>
                  <a class="btn small" href="#/quiz/${d.id}">Quiz</a>
                  <a class="btn small ghost" href="#/deck/${d.id}">Edit</a>
                </div>
              </div>`;
          })}
        </div>` : html`
        <div class="card empty">
          <h3>No decks yet</h3>
          <p>Add a ready-made deck below, generate one from your notes, or make your own.</p>
        </div>`}
    </section>

    <section class="section">
      <div class="section-head"><h2>Ready-made decks</h2><small>Free to add and edit</small></div>
      <div class="grid">
        ${LIBRARY.map((d) => {
          const subj = subjectByCode(d.subject);
          return html`
            <div class="card deck-card">
              <h3>${d.name}</h3>
              <small>${subj ? `${subj.icon} ${subj.name} · ` : ''}${plural(d.cards.length, 'card')}</small>
              <div class="row">
                ${added.has(d.id)
                  ? html`<span class="pill good">✓ Added</span>`
                  : html`<button class="btn small primary" data-add="${d.id}">Add to my decks</button>`}
              </div>
            </div>`;
        })}
      </div>
    </section>
  `);

  root.querySelectorAll('[data-add]').forEach((b) =>
    b.addEventListener('click', () => {
      const lib = libraryDeck(b.dataset.add);
      createDeck({ name: lib.name, subject: lib.subject, cards: lib.cards.map(([front, back]) => ({ front, back })), from: lib.id });
      toast(`Added "${lib.name}"`);
      flashcards(root);
    }),
  );

  root.querySelector('#new-deck').addEventListener('click', () => {
    const name = prompt('Name your deck', 'My deck');
    if (name == null) return;
    const id = createDeck({ name: name.trim() || 'My deck' });
    location.hash = `#/deck/${id}`;
  });

  root.querySelector('#import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readFile(file);
      let deck;
      if (/\.json$/i.test(file.name)) {
        const data = JSON.parse(text);
        const cards = (data.cards || []).map((c) => (Array.isArray(c) ? { front: c[0], back: c[1] } : c)).filter((c) => c.front && c.back);
        deck = { name: data.name || file.name.replace(/\.\w+$/, ''), subject: SUBJECTS.some((s) => s.code === data.subject) ? data.subject : '', cards };
      } else {
        deck = { name: file.name.replace(/\.\w+$/, ''), cards: parseDelimited(text) };
      }
      if (!deck.cards.length) throw new Error('No cards found in that file');
      const id = createDeck(deck);
      toast(`Imported ${plural(deck.cards.length, 'card')}`);
      location.hash = `#/deck/${id}`;
    } catch (err) {
      toast(`Import failed: ${err.message}`);
    }
  });

}
