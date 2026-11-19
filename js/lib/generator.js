// Turn revision notes into flashcards. Runs entirely in the browser — no AI,
// no server — using simple, predictable patterns that students already use
// when writing notes.
//
// Supported patterns (one per line unless stated):
//   Q: question           followed by   A: answer   (can span lines)
//   term - definition     (also – — : = :: -> and tab)
//   Photosynthesis is the process by which ...      ("X is/are/means/refers to Y")
//   The **mitochondria** is where respiration happens   (bold words become blanks)
//   The {{mitochondria}} is where respiration happens   (cloze deletions)

const MAX_TERM_WORDS = 8;
const MAX_TERM_CHARS = 80;

const SEPARATORS = [' :: ', '\t', ' -> ', ' → ', ' = ', ' – ', ' — ', ' - ', ': '];
const DEFINERS = [
  ' is defined as ',
  ' are defined as ',
  ' refers to ',
  ' refer to ',
  ' is called ',
  ' means ',
  ' is ',
  ' are ',
];

const clean = (s) => s.replace(/^\s*(?:[-*•▪◦]|\d+[.)])\s+/, '').replace(/\s+/g, ' ').trim();
const stripEnd = (s) => s.replace(/[.;,]+$/, '').trim();
const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;
const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function looksLikeTerm(s) {
  return s.length > 0 && s.length <= MAX_TERM_CHARS && wordCount(s) <= MAX_TERM_WORDS && /[a-z0-9]/i.test(s);
}

/** Make cloze cards from {{...}} or **...** markers in a line. */
function clozeCards(line) {
  const re = /\{\{(.+?)\}\}|\*\*(.+?)\*\*/g;
  const answers = [];
  let m;
  while ((m = re.exec(line))) answers.push({ text: m[1] ?? m[2], index: answers.length });
  if (!answers.length) return [];
  const plain = line.replace(re, (_, a, b) => a ?? b);
  return answers.map((ans) => {
    let n = -1;
    const front = line.replace(re, (_, a, b) => {
      n++;
      return n === ans.index ? '_____' : a ?? b;
    });
    return { front: clean(front), back: ans.text.trim(), source: plain, kind: 'cloze' };
  });
}

function separatorCard(line) {
  for (const sep of SEPARATORS) {
    const i = line.indexOf(sep);
    if (i <= 0) continue;
    const term = line.slice(0, i).trim();
    const def = line.slice(i + sep.length).trim();
    if (!def || !looksLikeTerm(term)) continue;
    // Avoid treating "Note: see page 4" style headings as cards.
    if (sep === ': ' && wordCount(def) < 2 && !/\d/.test(def)) continue;
    return { front: term, back: def, source: line, kind: 'term' };
  }
  return null;
}

// " is "/" are " only count as definitions when followed by a determiner,
// e.g. "Osmosis is the net movement…" but not "The rate is increased by…".
const DEFINITION_START = /^(a|an|the|when|where|how|any|one|two|known as)\b/i;

function definerCard(line) {
  const lower = ` ${line.toLowerCase()}`;
  for (const d of DEFINERS) {
    const i = lower.indexOf(d); // index in `lower`; the same space is at i - 1 in `line`
    if (i <= 0) continue;
    const subject = line.slice(0, i - 1).trim();
    const rest = stripEnd(line.slice(i - 1 + d.length).trim());
    const verb = d.trim();
    if (!looksLikeTerm(subject) || wordCount(rest) < (verb === 'is called' ? 1 : 2)) continue;
    if (/^(it|this|that|these|those|there|they|he|she|which|what|who)$/i.test(subject)) continue;
    if ((verb === 'is' || verb === 'are') && !DEFINITION_START.test(rest)) continue;

    if (verb === 'is called') {
      // "The loss of water from leaves is called transpiration"
      return { front: `${capitalise(subject)} is called…?`, back: capitalise(rest), source: line, kind: 'definition' };
    }
    const term = subject.replace(/^(the|a|an)\s+/i, '');
    const front = verb === 'is' || verb === 'are' ? `What ${verb} ${term}?` : `Define: ${term}`;
    return { front, back: capitalise(rest), source: line, kind: 'definition' };
  }
  return null;
}

/**
 * Generate flashcards from free text.
 * @param {string} text
 * @param {{definitions?: boolean, cloze?: boolean, sentences?: boolean, reverse?: boolean}} opts
 * @returns {{front: string, back: string, source: string, kind: string}[]}
 */
export function generateCards(text, opts = {}) {
  const { definitions = true, cloze = true, sentences = true, reverse = false } = opts;
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const cards = [];

  // Pass 1: Q/A blocks.
  const used = new Set();
  for (let i = 0; i < lines.length; i++) {
    const q = lines[i].match(/^\s*Q(?:uestion)?\s*[:.)]\s*(.+)$/i);
    if (!q) continue;
    let j = i + 1;
    let answer = [];
    while (j < lines.length && !/^\s*A(?:nswer)?\s*[:.)]/i.test(lines[j]) && !/^\s*Q(?:uestion)?\s*[:.)]/i.test(lines[j])) j++;
    if (j < lines.length && /^\s*A(?:nswer)?\s*[:.)]/i.test(lines[j])) {
      answer.push(lines[j].replace(/^\s*A(?:nswer)?\s*[:.)]\s*/i, ''));
      let k = j + 1;
      while (k < lines.length && lines[k].trim() && !/^\s*Q(?:uestion)?\s*[:.)]/i.test(lines[k])) answer.push(lines[k++]);
      for (let x = i; x < k; x++) used.add(x);
      cards.push({ front: q[1].trim(), back: answer.map((a) => a.trim()).join('\n').trim(), source: lines.slice(i, k).join('\n'), kind: 'qa' });
    }
  }

  // Pass 2: everything else, line by line (long lines are split into sentences).
  for (let i = 0; i < lines.length; i++) {
    if (used.has(i)) continue;
    const line = clean(lines[i]);
    if (!line || line.startsWith('#')) continue;

    if (cloze) {
      const cz = clozeCards(line);
      if (cz.length) {
        cards.push(...cz);
        continue;
      }
    }
    if (definitions) {
      const c = separatorCard(line);
      if (c) {
        cards.push(c);
        continue;
      }
    }
    if (sentences) {
      const parts = line.replace(/([.!?])\s+(?=[A-Z])/g, '$1\n').split('\n');
      for (const p of parts) {
        const c = definerCard(p.trim());
        if (c) cards.push(c);
      }
    }
  }

  if (reverse) {
    const extra = cards
      .filter((c) => c.kind === 'term' && wordCount(c.back) <= 30)
      .map((c) => ({ front: c.back, back: c.front, source: c.source, kind: 'reverse' }));
    cards.push(...extra);
  }

  // De-duplicate on the front+back pair.
  const seen = new Set();
  return cards.filter((c) => {
    const key = `${c.front.toLowerCase()}|${c.back.toLowerCase()}`;
    if (!c.front || !c.back || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Parse CSV/TSV text exported from Quizlet, Anki, Excel etc. into cards.
 * Accepts "front,back" or "front<TAB>back" per line, with optional quotes.
 */
export function parseDelimited(text) {
  const rows = [];
  const src = String(text ?? '').replace(/\r\n?/g, '\n');
  const delim = src.includes('\t') ? '\t' : ',';
  let field = '';
  let row = [];
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows
    .filter((r) => r.length >= 2 && r[0].trim() && r[1].trim())
    .map((r) => ({ front: r[0].trim(), back: r[1].trim(), source: r.join(delim), kind: 'import' }));
}
