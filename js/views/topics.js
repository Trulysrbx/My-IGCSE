import { html } from '../lib/util.js';
import { get, update } from '../store.js';
import { subjectByCode, groupedSubjects } from '../data/subjects.js';

const LEVELS = [
  { v: 1, cls: 'r1', label: 'Weak' },
  { v: 2, cls: 'r2', label: 'OK' },
  { v: 3, cls: 'r3', label: 'Confident' },
];

function summary(code) {
  const subj = subjectByCode(code);
  const ratings = get().topics[code] || {};
  const n = subj.topics.length;
  const count = (v) => subj.topics.filter((_, i) => ratings[i] === v).length;
  return { n, green: count(3), amber: count(2), red: count(1), rated: Object.keys(ratings).length };
}

function bar(s) {
  const w = (x) => `${(x / s.n) * 100}%`;
  return html`<div class="rag-bar" title="${s.green} confident · ${s.amber} OK · ${s.red} weak">
    <span style="width:${w(s.green)}"></span><span style="width:${w(s.amber)}"></span><span style="width:${w(s.red)}"></span></div>`;
}

export default function topics(root, [code]) {
  if (!code) return index(root);
  const subj = subjectByCode(code);
  if (!subj) {
    root.innerHTML = String(html`<div class="empty"><h3>Unknown subject</h3><p><a href="#/topics">Back</a></p></div>`);
    return;
  }

  const render = () => {
    const ratings = get().topics[code] || {};
    const s = summary(code);
    const weakest = subj.topics.map((t, i) => [t, ratings[i] ?? 0, i]).filter(([, r]) => r < 3).sort((a, b) => a[1] - b[1]).slice(0, 3);
    root.innerHTML = String(html`
      <p><a href="#/topics">← All subjects</a></p>
      <div class="row between">
        <h1 style="margin:0">${subj.icon} ${subj.name} topics</h1>
        <a class="btn" href="#/papers/${code}">Past papers</a>
      </div>
      <div class="card section">
        <div class="row between"><b>${s.green} of ${s.n} topics confident</b><small>${s.n - s.rated} not rated yet</small></div>
        <div style="margin-top:10px">${bar(s)}</div>
        ${weakest.length ? html`<p class="muted" style="margin:12px 0 0">Focus next on: <b>${weakest.map(([t]) => t).join(' · ')}</b></p>` : html`<p style="margin:12px 0 0">🎉 Everything is green — keep it fresh with past papers.</p>`}
      </div>
      <div class="card section">
        ${subj.topics.map((t, i) => html`
          <div class="topic-row">
            <span class="name">${t}</span>
            <span class="rag" role="group" aria-label="Confidence for ${t}">
              ${LEVELS.map((l) => html`<button class="${l.cls}" data-i="${i}" data-v="${l.v}" aria-pressed="${ratings[i] === l.v}">${l.label}</button>`)}
            </span>
          </div>`)}
      </div>
      <p class="muted">Topics follow the current Cambridge syllabus headings. Always check the official syllabus for the full detail.</p>
    `);
    root.querySelectorAll('.rag button').forEach((b) =>
      b.addEventListener('click', () => {
        const i = b.dataset.i;
        const v = Number(b.dataset.v);
        update((st) => {
          const r = st.topics[code] || (st.topics[code] = {});
          if (r[i] === v) delete r[i];
          else r[i] = v;
        });
        const y = window.scrollY;
        render();
        window.scrollTo({ top: y });
      }),
    );
  };
  render();
}

function index(root) {
  root.innerHTML = String(html`
    <h1>Topic tracker</h1>
    <p class="muted">Rate how confident you feel on every syllabus topic. Red topics are where your revision time pays off most.</p>
    ${groupedSubjects().map(([group, list]) => html`
      <h2 class="group-title">${group}</h2>
      <div class="grid">
        ${list.map((s) => {
          const sum = summary(s.code);
          return html`<a class="card subject-tile" href="#/topics/${s.code}" style="flex-direction:column;align-items:stretch">
            <span class="row" style="flex-wrap:nowrap"><span class="ico" aria-hidden="true">${s.icon}</span><span><b>${s.name}</b><small>${sum.rated ? `${sum.green}/${sum.n} confident` : `${sum.n} topics`}</small></span></span>
            ${sum.rated ? bar(sum) : ''}
          </a>`;
        })}
      </div>`)}
  `);
}
