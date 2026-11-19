import { html, uid, dayKey, toast } from '../lib/util.js';
import { get, update, streak } from '../store.js';
import * as timer from '../lib/timer.js';
import { SUBJECTS, subjectByCode } from '../data/subjects.js';

export default function planner(root) {
  const render = () => {
    const s = get();
    const now = Date.now();
    const exams = [...s.exams].sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcoming = exams.filter((e) => new Date(e.date).getTime() > now - 86400000);
    const past = exams.filter((e) => new Date(e.date).getTime() <= now - 86400000);

    // Last 28 days of activity for the heat map.
    const days = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const score = (s.stats.reviews[k] || 0) + (s.stats.minutes[k] || 0);
      days.push({ k, level: score === 0 ? 0 : score < 20 ? 1 : score < 60 ? 2 : 3, score });
    }
    const weekMinutes = days.slice(-7).reduce((n, d) => n + (s.stats.minutes[d.k] || 0), 0);
    const t = timer.state();

    root.innerHTML = String(html`
      <h1>Planner</h1>
      <div class="grid wide" style="align-items:start">
        <div class="card" style="text-align:center">
          <h2>${t.mode === 'focus' ? '🎯 Focus' : '☕ Break'}</h2>
          <div class="timer-face" id="face">${timer.format(t.remaining)}</div>
          <div class="row" style="justify-content:center">
            ${t.running ? html`<button class="btn" id="pause">Pause</button>` : html`<button class="btn primary" id="start">${t.started ? 'Resume' : 'Start'}</button>`}
            <button class="btn" id="reset">Reset</button>
            <button class="btn ghost" id="switch">${t.mode === 'focus' ? 'Switch to break' : 'Switch to focus'}</button>
          </div>
          <div class="row" style="justify-content:center;margin-top:16px">
            <label class="muted" style="margin:0;font-weight:500">Focus <input type="number" id="pom" min="5" max="120" value="${s.settings.pomodoro}" style="width:70px;display:inline-block"> min</label>
            <label class="muted" style="margin:0;font-weight:500">Break <input type="number" id="brk" min="1" max="60" value="${s.settings.shortBreak}" style="width:70px;display:inline-block"> min</label>
          </div>
          <p class="muted" style="margin:12px 0 0">The timer keeps running while you use the rest of the site.</p>
        </div>

        <div class="card">
          <h2>Your activity</h2>
          <div class="stats" style="margin-bottom:16px">
            <div class="stat"><b>${streak()}</b><span>day streak</span></div>
            <div class="stat"><b>${weekMinutes}</b><span>focus mins this week</span></div>
          </div>
          <div class="heat" aria-label="Activity over the last 4 weeks">
            ${days.map((d) => html`<span data-l="${d.level}" title="${d.k}: ${d.score ? `${s.stats.reviews[d.k] || 0} reviews, ${s.stats.minutes[d.k] || 0} min` : 'no activity'}"></span>`)}
          </div>
          <small>Last 4 weeks · flashcard reviews + focus minutes</small>
        </div>
      </div>

      <section class="section card">
        <div class="section-head"><h2>Exam countdown</h2></div>
        <form id="add-exam" class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));align-items:end">
          <div><label for="ex-subject">Subject</label>
            <select id="ex-subject" required><option value="">Choose…</option>${SUBJECTS.map((x) => html`<option value="${x.code}">${x.name}</option>`)}</select></div>
          <div><label for="ex-title">Paper (optional)</label><input id="ex-title" type="text" placeholder="e.g. Paper 4"></div>
          <div><label for="ex-date">Date &amp; time</label><input id="ex-date" type="datetime-local" required></div>
          <div><button class="btn primary" style="width:100%">Add exam</button></div>
        </form>
        <div style="margin-top:16px">
          ${upcoming.length ? upcoming.map((e) => {
            const ms = new Date(e.date).getTime() - now;
            const d = Math.max(0, Math.ceil(ms / 86400000));
            const subj = subjectByCode(e.subject);
            return html`<div class="exam-item">
              <div class="days" style="color:${d <= 7 ? 'var(--bad)' : d <= 30 ? 'var(--warn)' : 'var(--accent)'}">${ms < 0 ? '✓' : d}<small>${ms < 0 ? 'today' : d === 1 ? 'day' : 'days'}</small></div>
              <div class="spacer"><b>${subj?.icon} ${subj?.name || e.subject}</b>${e.title ? ` — ${e.title}` : ''}<br>
                <small>${new Date(e.date).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div>
              <a class="btn small ghost" href="#/papers/${e.subject}">Papers</a>
              <button class="btn small ghost danger" data-del="${e.id}" aria-label="Remove exam">✕</button>
            </div>`;
          }) : html`<p class="muted">Add your exams from your timetable to see a countdown here and on the home page.</p>`}
          ${past.length ? html`<details style="margin-top:12px"><summary class="muted">${past.length} past exam(s)</summary>
            ${past.map((e) => html`<div class="exam-item"><div class="spacer">${subjectByCode(e.subject)?.name} ${e.title} · ${new Date(e.date).toLocaleDateString()}</div><button class="btn small ghost danger" data-del="${e.id}">✕</button></div>`)}
          </details>` : ''}
        </div>
      </section>
    `);

    const $ = (q) => root.querySelector(q);
    $('#start')?.addEventListener('click', () => { timer.start(); render(); });
    $('#pause')?.addEventListener('click', () => { timer.pause(); render(); });
    $('#reset').addEventListener('click', () => { timer.reset(); render(); });
    $('#switch').addEventListener('click', () => { timer.reset(t.mode === 'focus' ? 'break' : 'focus'); render(); });
    const setMin = (key, el) => el.addEventListener('change', () => {
      const v = Math.max(1, Math.min(120, Number(el.value) || 1));
      update((st) => { st.settings[key] = v; });
      if (!timer.state().started) timer.reset();
      render();
    });
    setMin('pomodoro', $('#pom'));
    setMin('shortBreak', $('#brk'));

    $('#add-exam').addEventListener('submit', (e) => {
      e.preventDefault();
      const exam = { id: uid(), subject: $('#ex-subject').value, title: $('#ex-title').value.trim(), date: $('#ex-date').value };
      if (!exam.subject || !exam.date) return;
      update((st) => { st.exams.push(exam); });
      toast('Exam added');
      render();
    });
    root.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => { update((st) => { st.exams = st.exams.filter((x) => x.id !== b.dataset.del); }); render(); }),
    );
  };

  render();
  let lastMode = timer.state().mode;
  let lastRunning = timer.state().running;
  const unsub = timer.subscribe((t) => {
    // Re-render on mode/run changes; otherwise just update the clock face.
    if (t.mode !== lastMode || t.running !== lastRunning) {
      lastMode = t.mode; lastRunning = t.running;
      render();
      return;
    }
    const face = root.querySelector('#face');
    if (face) face.textContent = timer.format(t.remaining);
  });
  return unsub;
}
