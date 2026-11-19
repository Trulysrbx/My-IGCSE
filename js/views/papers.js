import { html, toast } from '../lib/util.js';
import { get, update } from '../store.js';
import { SUBJECTS, subjectByCode, groupedSubjects } from '../data/subjects.js';
import { SOURCES, sourceById, officialPage } from '../data/sources.js';
import { SESSIONS, paperFilename, availableYears, sessionsFor, variantsFor, listPapers, parseFilename } from '../lib/papers.js';

export default function papers(root, [code], query) {
  if (code) return subjectPage(root, code, query);
  return indexPage(root, query);
}

function subjectTile(s) {
  const done = Object.entries(get().papers).filter(([k, v]) => v.done && k.startsWith(s.code + '_')).length;
  return html`
    <a class="card subject-tile" href="#/papers/${s.code}">
      <span class="ico" aria-hidden="true">${s.icon}</span>
      <span><b>${s.name}</b><small>${s.code}${done ? ` · ${done} done` : ''}</small></span>
    </a>`;
}

function indexPage(root, query) {
  const mine = get().settings.subjects.map(subjectByCode).filter(Boolean);
  root.innerHTML = String(html`
    <h1>Past papers</h1>
    <p class="muted">Pick a subject to see every paper, mark scheme, insert and examiner report by year. Tick papers off as you do them and record your score.</p>

    <form class="card row" id="jump" role="search">
      <div class="spacer" style="min-width:220px">
        <label for="jump-input">Know the paper code? Jump straight to it</label>
        <input id="jump-input" type="search" placeholder="e.g. 0610_s23_qp_42 or 0620" autocomplete="off" value="${query.q || ''}">
      </div>
      <button class="btn primary" style="align-self:flex-end">Go</button>
    </form>

    ${mine.length ? html`<h2 class="group-title">My subjects</h2><div class="grid">${mine.map(subjectTile)}</div>` : ''}
    ${groupedSubjects().map(([group, list]) => html`
      <h2 class="group-title">${group}</h2>
      <div class="grid">${list.map(subjectTile)}</div>`)}
    <p class="section muted">Subject missing? It's a few lines in <code>js/data/subjects.js</code> — contributions welcome.</p>
  `);

  root.querySelector('#jump').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = root.querySelector('#jump-input').value.trim();
    const parsed = parseFilename(v);
    if (parsed && subjectByCode(parsed.code)) {
      const subject = subjectByCode(parsed.code);
      const src = sourceById(get().settings.source);
      window.open(src.pdf({ file: v.replace(/\.pdf$/i, ''), subject, year: parsed.year }), '_blank', 'noopener');
      return;
    }
    const code = v.match(/\d{4}/)?.[0];
    const byName = SUBJECTS.find((s) => s.name.toLowerCase().includes(v.toLowerCase()));
    const target = (code && subjectByCode(code)) || (v && byName);
    if (target) location.hash = `#/papers/${target.code}`;
    else toast('No matching subject — try a 4-digit syllabus code like 0610');
  });
}

function subjectPage(root, code, query) {
  const subject = subjectByCode(code);
  if (!subject) {
    root.innerHTML = String(html`<div class="empty"><h3>Unknown subject ${code}</h3><p><a href="#/papers">Back to subjects</a></p></div>`);
    return;
  }
  const years = availableYears(subject);
  const year = Number(query.year) || years[0];
  const s = get();
  const src = sourceById(s.settings.source);
  const link = (file) => src.pdf({ file, subject, year });
  const fileFor = (session, type, paper, variant) => paperFilename({ code, year, session, type, paper, variant });

  const all = years.flatMap((y) => listPapers(subject, y));
  const doneList = all.map((p) => s.papers[p.id]).filter((r) => r?.done);
  const scored = doneList.filter((r) => r.max > 0 && r.score != null);
  const avg = scored.length ? Math.round(scored.reduce((n, r) => n + (r.score / r.max) * 100, 0) / scored.length) : null;

  const row = (session, paper, variant) => {
    const qp = fileFor(session, 'qp', paper, variant);
    const rec = s.papers[qp] || {};
    const hasInsert = subject.inserts?.includes(paper);
    return html`
      <tr class="${rec.done ? 'done' : ''}" data-id="${qp}">
        <td><b>Paper ${paper}${variant}</b><br><small>${subject.papers[paper]}</small></td>
        <td><div class="links">
          <a href="${link(qp)}" target="_blank" rel="noopener" title="${qp}.pdf">Question paper</a>
          <a href="${link(fileFor(session, 'ms', paper, variant))}" target="_blank" rel="noopener">Mark scheme</a>
          ${hasInsert ? html`<a href="${link(fileFor(session, 'in', paper, variant))}" target="_blank" rel="noopener">Insert</a>` : ''}
        </div></td>
        <td><label class="check"><input type="checkbox" data-act="done" ${rec.done ? 'checked' : ''}> Done</label></td>
        <td><div class="row" style="gap:4px;flex-wrap:nowrap">
          <input class="score-input" type="number" min="0" inputmode="numeric" placeholder="score" aria-label="Score" data-act="score" value="${rec.score ?? ''}">
          <span class="muted">/</span>
          <input class="score-input" type="number" min="1" inputmode="numeric" placeholder="max" aria-label="Maximum mark" data-act="max" value="${rec.max ?? ''}">
          ${rec.max ? html`<span class="pill ${pctClass(rec.score / rec.max)}">${Math.round((rec.score / rec.max) * 100)}%</span>` : ''}
        </div></td>
      </tr>`;
  };

  root.innerHTML = String(html`
    <p><a href="#/papers">← All subjects</a></p>
    <div class="row between">
      <div>
        <h1 style="margin-bottom:4px">${subject.icon} ${subject.name} <span class="muted">(${subject.code})</span></h1>
        <p class="muted" style="margin:0">${doneList.length} papers done${avg != null ? ` · average ${avg}%` : ''}</p>
      </div>
      <div class="row">
        <button class="btn" id="random">🎲 Random paper</button>
        <a class="btn" href="#/topics/${code}">Topic tracker</a>
      </div>
    </div>

    ${subject.note ? html`<p class="notice section">${subject.note}</p>` : ''}

    <div class="tabs" role="tablist" aria-label="Year">
      ${years.map((y) => html`<a role="tab" href="#/papers/${code}?year=${y}" class="${y === year ? 'active' : ''}" aria-selected="${y === year}">${y}</a>`)}
    </div>

    <div class="row" style="margin-bottom:8px">
      <label for="source" style="margin:0">Open papers from</label>
      <select id="source" style="width:auto">
        ${SOURCES.map((x) => html`<option value="${x.id}" ${x.id === src.id ? 'selected' : ''}>${x.name}</option>`)}
      </select>
      <a href="${officialPage(subject)}" target="_blank" rel="noopener">Official Cambridge page ↗</a>
    </div>

    ${sessionsFor(subject, year).map((session) => html`
      <div class="session-head">
        <h3>${SESSIONS[session].label} ${year}</h3>
        <div class="links">
          <a href="${link(fileFor(session, 'er'))}" target="_blank" rel="noopener">Examiner report</a>
          <a href="${link(fileFor(session, 'gt'))}" target="_blank" rel="noopener">Grade thresholds</a>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Paper</th><th>Documents</th><th>Status</th><th>Score</th></tr></thead>
        <tbody>
          ${Object.keys(subject.papers).map(Number).flatMap((p) => variantsFor(session, subject).map((v) => row(session, p, v)))}
        </tbody>
      </table></div>`)}

    <div class="notice section">
      <p><b>Link not working?</b> Not every subject sits every variant (especially in Feb/March), and archive sites sometimes move files.
      Switch the source above, or use "Web search" which always finds the file by its official name.
      Papers are © Cambridge University Press &amp; Assessment — My IGCSE only links to them.</p>
    </div>
  `);

  root.querySelector('#source').addEventListener('change', (e) => {
    update((st) => { st.settings.source = e.target.value; });
    subjectPage(root, code, query);
  });

  root.querySelector('#random').addEventListener('click', () => {
    const todo = all.filter((p) => !get().papers[p.id]?.done);
    if (!todo.length) return toast('You have done every paper — amazing!');
    const p = todo[Math.floor(Math.random() * todo.length)];
    toast(`Try ${SESSIONS[p.session].label} ${p.year}, Paper ${p.paper}${p.variant}`);
    if (p.year !== year) location.hash = `#/papers/${code}?year=${p.year}`;
    setTimeout(() => {
      const tr = document.querySelector(`tr[data-id="${p.id}"]`);
      tr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      tr?.animate?.([{ outline: '3px solid var(--accent)' }, { outline: '3px solid transparent' }], { duration: 2000 });
    }, 150);
  });

  root.querySelectorAll('tr[data-id]').forEach((tr) => {
    const id = tr.dataset.id;
    tr.addEventListener('change', (e) => {
      const act = e.target.dataset.act;
      if (!act) return;
      update((st) => {
        const rec = st.papers[id] || (st.papers[id] = {});
        if (act === 'done') {
          rec.done = e.target.checked;
          rec.date = Date.now();
        } else {
          const n = e.target.value === '' ? null : Number(e.target.value);
          rec[act] = n;
          if (n != null) rec.done = true;
        }
        if (!rec.done && rec.score == null && rec.max == null) delete st.papers[id];
      });
      subjectPage(root, code, query);
      document.querySelector(`tr[data-id="${id}"] [data-act="${act === 'score' ? 'max' : act}"]`)?.focus();
    });
  });
}

const pctClass = (r) => (r >= 0.7 ? 'good' : r >= 0.5 ? 'warn' : 'bad');
