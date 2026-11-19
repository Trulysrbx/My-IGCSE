import { html, plural, toast, readFile } from '../lib/util.js';
import { get, update, createDeck, deckList, makeCard } from '../store.js';
import { generateCards, parseDelimited } from '../lib/generator.js';
import { SUBJECTS } from '../data/subjects.js';

const SAMPLE = `# Paste your notes here — try editing this example!

Osmosis is the net movement of water molecules from a dilute solution to a concentrated solution through a partially permeable membrane.
Enzyme - a protein that acts as a biological catalyst
Catalyst: a substance that speeds up a reaction without being used up
The loss of water vapour from leaves is called transpiration.
The {{mitochondria}} are the site of aerobic respiration.
Glucose is stored in plants as **starch**.

Q: What are the products of photosynthesis?
A: Glucose and oxygen`;

let draft = '';

export default function generate(root, _params, query) {
  const decks = deckList();
  const targetId = query.deck && get().decks[query.deck] ? query.deck : '';
  let cards = [];

  root.innerHTML = String(html`
    <h1>Generate flashcards</h1>
    <p class="muted">Paste notes from class, a revision guide or your own summaries. Cards are made instantly in your browser — nothing is uploaded.</p>

    <div class="grid wide" style="align-items:start">
      <div class="card">
        <div class="field">
          <div class="row between"><label for="notes" style="margin:0">Your notes</label>
            <div class="row" style="gap:6px">
              <button class="btn small ghost" id="sample">Load example</button>
              <label class="btn small ghost" style="margin:0">Open .txt / .csv<input type="file" id="file" accept=".txt,.md,.csv,.tsv" hidden></label>
            </div>
          </div>
          <textarea id="notes" rows="14" style="margin-top:8px" placeholder="term - definition&#10;X is the …&#10;Q: … / A: …&#10;The {{answer}} is hidden">${draft}</textarea>
        </div>
        <div class="field">
          <label>Format</label>
          <div class="row">
            <label class="check"><input type="radio" name="fmt" value="notes" checked> Notes</label>
            <label class="check"><input type="radio" name="fmt" value="table"> Spreadsheet / Quizlet export (two columns)</label>
          </div>
        </div>
        <div class="field" id="opts">
          <label>Make cards from</label>
          <div class="row">
            <label class="check"><input type="checkbox" name="definitions" checked> term – definition lines</label>
            <label class="check"><input type="checkbox" name="sentences" checked> "X is…" sentences</label>
            <label class="check"><input type="checkbox" name="cloze" checked> {{blanks}} &amp; **bold**</label>
            <label class="check"><input type="checkbox" name="reverse"> also reverse cards</label>
          </div>
        </div>
        <details>
          <summary class="muted" style="cursor:pointer">How to write notes that turn into great cards</summary>
          <ul class="muted">
            <li><b>term - definition</b> (also <code>:</code>, <code>=</code>, <code>-&gt;</code>, or a tab) on one line</li>
            <li><b>Sentences</b> like "Diffusion is the…", "X means…", "… is called Y"</li>
            <li><b>Blanks</b>: wrap a key word in <code>{{double braces}}</code> or <code>**bold**</code></li>
            <li><b>Q:</b> question then <b>A:</b> answer (the answer can be several lines)</li>
            <li>Lines starting with <code>#</code> are ignored — use them for headings</li>
          </ul>
        </details>
      </div>

      <div class="card">
        <div class="row between"><h2 style="margin:0" id="count">Preview</h2>
          <div class="row" style="gap:6px"><button class="btn small ghost" id="all">Select all</button><button class="btn small ghost" id="none">None</button></div>
        </div>
        <ul class="preview-list section" id="preview" style="margin-top:12px"></ul>
        <hr style="border:0;border-top:1px solid var(--border);margin:16px 0">
        <div class="field"><label for="target">Save to</label>
          <select id="target">
            <option value="">➕ New deck</option>
            ${decks.map((d) => html`<option value="${d.id}" ${d.id === targetId ? 'selected' : ''}>${d.name}</option>`)}
          </select>
        </div>
        <div id="new-fields" class="grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
          <div class="field"><label for="deck-name">Deck name</label><input id="deck-name" type="text" placeholder="e.g. Biology – Cells"></div>
          <div class="field"><label for="deck-subject">Subject</label>
            <select id="deck-subject"><option value="">— none —</option>${SUBJECTS.map((s) => html`<option value="${s.code}">${s.name}</option>`)}</select></div>
        </div>
        <button class="btn primary" id="save" style="width:100%">Save cards</button>
      </div>
    </div>
  `);

  const $ = (s) => root.querySelector(s);
  const notes = $('#notes');

  function run() {
    draft = notes.value;
    const fmt = root.querySelector('input[name="fmt"]:checked').value;
    const opt = (n) => root.querySelector(`input[name="${n}"]`).checked;
    $('#opts').hidden = fmt === 'table';
    cards = fmt === 'table'
      ? parseDelimited(notes.value)
      : generateCards(notes.value, { definitions: opt('definitions'), sentences: opt('sentences'), cloze: opt('cloze'), reverse: opt('reverse') });
    cards.forEach((c) => (c.keep = true));
    renderPreview();
  }

  function renderPreview() {
    const list = $('#preview');
    list.innerHTML = cards.length
      ? String(html`${cards.map((c, i) => html`
          <li><input type="checkbox" data-i="${i}" ${c.keep ? 'checked' : ''} aria-label="Keep card" style="margin-top:4px;width:18px;height:18px;accent-color:var(--accent)">
          <div><div class="q">${c.front}</div><div class="a">${c.back}</div></div></li>`)}`)
      : String(html`<li class="muted">Cards will appear here as you type.</li>`);
    updateCount();
  }

  const updateCount = () => {
    const n = cards.filter((c) => c.keep).length;
    $('#count').textContent = cards.length ? `${plural(n, 'card')} selected` : 'Preview';
    $('#save').disabled = n === 0;
  };

  const syncTarget = () => { $('#new-fields').hidden = !!$('#target').value; };

  let t;
  notes.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 200); });
  root.querySelectorAll('input[name="fmt"], #opts input').forEach((el) => el.addEventListener('change', run));
  $('#preview').addEventListener('change', (e) => {
    const i = e.target.dataset.i;
    if (i != null) { cards[i].keep = e.target.checked; updateCount(); }
  });
  $('#all').addEventListener('click', () => { cards.forEach((c) => (c.keep = true)); renderPreview(); });
  $('#none').addEventListener('click', () => { cards.forEach((c) => (c.keep = false)); renderPreview(); });
  $('#sample').addEventListener('click', () => { notes.value = SAMPLE; run(); });
  $('#file').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    notes.value = await readFile(f);
    if (/\.(csv|tsv)$/i.test(f.name)) root.querySelector('input[name="fmt"][value="table"]').checked = true;
    if (!$('#deck-name').value) $('#deck-name').value = f.name.replace(/\.\w+$/, '');
    run();
  });
  $('#target').addEventListener('change', syncTarget);

  $('#save').addEventListener('click', () => {
    const keep = cards.filter((c) => c.keep);
    if (!keep.length) return;
    let id = $('#target').value;
    if (id) update((s) => { s.decks[id].cards.push(...keep.map((c) => makeCard(c.front, c.back))); });
    else id = createDeck({ name: $('#deck-name').value.trim() || 'Generated deck', subject: $('#deck-subject').value, cards: keep });
    draft = '';
    toast(`Saved ${plural(keep.length, 'card')}`);
    location.hash = `#/deck/${id}`;
  });

  syncTarget();
  run();
}
