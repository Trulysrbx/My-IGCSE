import { html, toast, download, readFile, dayKey } from '../lib/util.js';
import { get, update, exportAll, importAll, resetAll } from '../store.js';
import { SOURCES } from '../data/sources.js';
import { groupedSubjects } from '../data/subjects.js';

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

export default function settings(root) {
  const s = get().settings;
  root.innerHTML = String(html`
    <h1>Settings</h1>
    <div class="card">
      <h2>Appearance</h2>
      <div class="row">
        ${['auto', 'light', 'dark'].map((t) => html`<label class="check"><input type="radio" name="theme" value="${t}" ${s.theme === t ? 'checked' : ''}> ${t === 'auto' ? 'Match my device' : t[0].toUpperCase() + t.slice(1)}</label>`)}
      </div>
    </div>

    <div class="card">
      <h2>My subjects</h2>
      <p class="muted">Pinned to the top of the past papers page.</p>
      ${groupedSubjects().map(([group, list]) => html`
        <h3 class="group-title" style="margin-top:12px">${group}</h3>
        <div class="row">${list.map((x) => html`<label class="check"><input type="checkbox" name="subj" value="${x.code}" ${s.subjects.includes(x.code) ? 'checked' : ''}> ${x.name}</label>`)}</div>`)}
    </div>

    <div class="card">
      <h2>Study</h2>
      <div class="grid">
        <div class="field"><label for="newPerDay">New flashcards per session</label><input id="newPerDay" type="number" min="1" max="500" value="${s.newPerDay}"></div>
        <div class="field"><label for="source">Default past paper source</label>
          <select id="source">${SOURCES.map((x) => html`<option value="${x.id}" ${x.id === s.source ? 'selected' : ''}>${x.name}</option>`)}</select></div>
      </div>
    </div>

    <div class="card">
      <h2>Your data</h2>
      <p class="muted">Everything is stored only in this browser. Download a backup to keep it safe or move it to another device — there's no account to sync with.</p>
      <div class="row">
        <button class="btn primary" id="export">Download backup</button>
        <label class="btn" style="margin:0">Restore backup<input type="file" id="import" accept=".json" hidden></label>
        <span class="spacer"></span>
        <button class="btn danger" id="reset">Delete all my data</button>
      </div>
    </div>

    <div class="card">
      <h2>About</h2>
      <p>My IGCSE is free and open source under the MIT licence. It has no accounts, no ads, no analytics and no server-side storage.
      Past papers are © Cambridge University Press &amp; Assessment; this site only links to publicly available copies.</p>
      <p><a href="https://github.com/trulysrbx/my-igcse" target="_blank" rel="noopener">View the source, report a bug or add a subject on GitHub ↗</a></p>
    </div>
  `);

  root.querySelectorAll('input[name="theme"]').forEach((r) =>
    r.addEventListener('change', () => { update((st) => { st.settings.theme = r.value; }); applyTheme(r.value); }),
  );
  root.querySelectorAll('input[name="subj"]').forEach((c) =>
    c.addEventListener('change', () => {
      update((st) => { st.settings.subjects = [...root.querySelectorAll('input[name="subj"]:checked')].map((x) => x.value); });
    }),
  );
  root.querySelector('#newPerDay').addEventListener('change', (e) =>
    update((st) => { st.settings.newPerDay = Math.max(1, Math.min(500, Number(e.target.value) || 20)); }),
  );
  root.querySelector('#source').addEventListener('change', (e) => update((st) => { st.settings.source = e.target.value; }));
  root.querySelector('#export').addEventListener('click', () => download(`my-igcse-backup-${dayKey()}.json`, exportAll()));
  root.querySelector('#import').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm('Restoring replaces everything currently saved in this browser. Continue?')) return;
    try {
      importAll(await readFile(f));
      applyTheme(get().settings.theme);
      toast('Backup restored');
      settings(root);
    } catch (err) {
      toast(`Could not restore: ${err.message}`);
    }
  });
  root.querySelector('#reset').addEventListener('click', () => {
    if (!confirm('Delete all decks, progress, scores and exams from this browser? This cannot be undone.')) return;
    resetAll();
    applyTheme('auto');
    toast('All data deleted');
    settings(root);
  });
}
