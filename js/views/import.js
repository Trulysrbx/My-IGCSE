import { html, plural } from '../lib/util.js';
import { createDeck } from '../store.js';
import { decodeDeck } from '../lib/share.js';
import { SUBJECTS } from '../data/subjects.js';

// Opened from a share link: #/share/<encoded deck>
export default function importShared(root, [code]) {
  root.innerHTML = String(html`<div class="empty"><p>Opening shared deck…</p></div>`);
  decodeDeck(code)
    .then((deck) => {
      root.innerHTML = String(html`<div class="flash-wrap">
        <h1>Someone shared a deck with you</h1>
        <div class="card">
          <h2>${deck.name}</h2>
          <p class="muted">${plural(deck.cards.length, 'card')}</p>
          <ul class="preview-list">${deck.cards.slice(0, 50).map((c) => html`<li><div><div class="q">${c.front}</div><div class="a">${c.back}</div></div></li>`)}</ul>
          ${deck.cards.length > 50 ? html`<p class="muted">…and ${deck.cards.length - 50} more</p>` : ''}
          <div class="row section"><button class="btn primary" id="add">Add to my decks</button><a class="btn" href="#/flashcards">Cancel</a></div>
        </div></div>`);
      root.querySelector('#add').addEventListener('click', () => {
        const subject = SUBJECTS.some((s) => s.code === deck.subject) ? deck.subject : '';
        const id = createDeck({ ...deck, subject });
        location.hash = `#/deck/${id}`;
      });
    })
    .catch((err) => {
      root.innerHTML = String(html`<div class="empty"><h3>That link didn't work</h3><p>${err.message}. It may have been cut off when it was copied.</p><p><a href="#/flashcards">Go to flashcards</a></p></div>`);
    });
}
