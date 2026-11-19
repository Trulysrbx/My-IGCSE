import { html, toast } from '../lib/util.js';
import { deckList, createDeck } from '../store.js';
import { COMMAND_WORDS } from '../data/commandWords.js';

export default function commandWords(root) {
  const existing = deckList().find((d) => d.from === 'command-words');
  root.innerHTML = String(html`
    <div class="row between">
      <div>
        <h1 style="margin-bottom:4px">Command words</h1>
        <p class="muted" style="margin:0">The first word of a question tells you exactly what the examiner wants. Get it wrong and you can lose marks even if you know the content.</p>
      </div>
      ${existing
        ? html`<a class="btn primary" href="#/study/${existing.id}">Study as flashcards</a>`
        : html`<button class="btn primary" id="make">Turn into flashcards</button>`}
    </div>
    <input type="search" id="filter" placeholder="Filter…" class="section" aria-label="Filter command words">
    <div class="card section" id="list">
      ${COMMAND_WORDS.map((c) => html`
        <div class="cw" data-word="${c.word.toLowerCase()}">
          <b>${c.word}</b><span>${c.meaning}</span><span class="tip">💡 ${c.tip}</span>
        </div>`)}
    </div>
  `);

  root.querySelector('#filter').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    root.querySelectorAll('.cw').forEach((el) => { el.hidden = q && !el.textContent.toLowerCase().includes(q); });
  });
  root.querySelector('#make')?.addEventListener('click', () => {
    const id = createDeck({
      name: 'Command words',
      from: 'command-words',
      cards: COMMAND_WORDS.map((c) => ({ front: `What does "${c.word}" ask you to do?`, back: `${c.meaning}\n\nTip: ${c.tip}` })),
    });
    toast('Deck created');
    location.hash = `#/study/${id}`;
  });
}
