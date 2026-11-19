import { test } from 'node:test';
import assert from 'node:assert/strict';

import { review, newSrs, buildQueue, deckStats, isNew } from '../js/lib/srs.js';
import { generateCards, parseDelimited } from '../js/lib/generator.js';
import { buildMultipleChoice, markTyped } from '../js/lib/quiz.js';
import { encodeDeck, decodeDeck } from '../js/lib/share.js';
import { paperFilename, parseFilename, isReleased, listPapers, availableYears } from '../js/lib/papers.js';
import { html, raw, esc, similarity } from '../js/lib/util.js';
import { SUBJECTS } from '../js/data/subjects.js';
import { LIBRARY } from '../js/data/decks.js';
import { SOURCES } from '../js/data/sources.js';

const DAY = 86400000;
const NOW = Date.UTC(2026, 0, 1);

test('html escapes interpolations but not nested html/raw', () => {
  assert.equal(String(html`<p>${'<b>x</b>'}</p>`), '<p>&lt;b&gt;x&lt;/b&gt;</p>');
  assert.equal(String(html`<p>${html`<b>${'&'}</b>`}</p>`), '<p><b>&amp;</b></p>');
  assert.equal(String(html`${[1, 2]}${null}${false}${raw('<i>')}`), '12<i>');
  assert.equal(esc(`"'`), '&quot;&#39;');
});

test('srs: good grades grow the interval, again resets it', () => {
  let s = newSrs();
  assert.ok(isNew(s));
  s = review(s, 'good', NOW);
  assert.equal(s.interval, 1);
  s = review(s, 'good', NOW);
  assert.equal(s.interval, 3);
  s = review(s, 'good', NOW);
  assert.ok(s.interval >= 7, `expected >= 7, got ${s.interval}`);
  assert.equal(s.due, NOW + s.interval * DAY);
  const lapsed = review(s, 'again', NOW);
  assert.equal(lapsed.reps, 0);
  assert.equal(lapsed.lapses, 1);
  assert.ok(lapsed.ease < s.ease);
  assert.ok(lapsed.due - NOW < DAY);
  assert.ok(!isNew(lapsed));
});

test('srs: easy > good > hard intervals', () => {
  const base = review(review(newSrs(), 'good', NOW), 'good', NOW);
  const [h, g, e] = ['hard', 'good', 'easy'].map((x) => review(base, x, NOW).interval);
  assert.ok(h < g && g < e, `${h} ${g} ${e}`);
  assert.ok(review(newSrs(), 'hard', NOW).ease >= 1.3);
});

test('srs: queue puts due reviews before new cards and limits new', () => {
  const cards = [
    { id: 'n1', srs: newSrs() },
    { id: 'n2', srs: newSrs() },
    { id: 'later', srs: { ...newSrs(), reps: 2, interval: 5, due: NOW + DAY } },
    { id: 'due', srs: { ...newSrs(), reps: 2, interval: 5, due: NOW - DAY } },
  ];
  assert.deepEqual(buildQueue(cards, { now: NOW, newLimit: 1 }).map((c) => c.id), ['due', 'n1']);
  assert.deepEqual(deckStats(cards, NOW), { total: 4, new: 2, due: 1, learned: 0 });
});

test('generator: separators, sentences, cloze and Q/A', () => {
  const cards = generateCards(`# Heading
Enzyme - a protein that acts as a biological catalyst
Osmosis is the net movement of water molecules through a partially permeable membrane.
The loss of water vapour from leaves is called transpiration.
The {{mitochondria}} is the site of respiration.
Glucose is stored as **starch** in plants.
The rate is increased by temperature.
Q: What is produced in photosynthesis?
A: Glucose
and oxygen`);
  const find = (front) => cards.find((c) => c.front === front);
  assert.equal(find('Enzyme')?.back, 'a protein that acts as a biological catalyst');
  assert.equal(find('What is Osmosis?')?.back, 'The net movement of water molecules through a partially permeable membrane');
  assert.equal(find('The loss of water vapour from leaves is called…?')?.back, 'Transpiration');
  assert.equal(find('The _____ is the site of respiration.')?.back, 'mitochondria');
  assert.equal(find('Glucose is stored as _____ in plants.')?.back, 'starch');
  assert.equal(find('What is produced in photosynthesis?')?.back, 'Glucose\nand oxygen');
  assert.ok(!cards.some((c) => /rate/i.test(c.front)), 'non-definition sentence should be skipped');
  assert.ok(!cards.some((c) => c.front.startsWith('#')));
});

test('generator: reverse cards and de-duplication', () => {
  const cards = generateCards('Anode: the positive electrode\nAnode: the positive electrode', { reverse: true });
  assert.equal(cards.length, 2);
  assert.ok(cards.some((c) => c.front === 'the positive electrode' && c.back === 'Anode'));
});

test('parseDelimited handles CSV quotes and TSV', () => {
  assert.deepEqual(
    parseDelimited('"a, b",c\n"say ""hi""",d\n,skip').map((c) => [c.front, c.back]),
    [['a, b', 'c'], ['say "hi"', 'd']],
  );
  assert.deepEqual(parseDelimited('x\ty\n').map((c) => [c.front, c.back]), [['x', 'y']]);
});

test('quiz: multiple choice has one correct, distinct options', () => {
  const cards = 'abcdefgh'.split('').map((l, i) => ({ front: `Q${i}`, back: `Answer ${l}` }));
  const qs = buildMultipleChoice(cards, { count: 5 });
  assert.equal(qs.length, 5);
  for (const q of qs) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.equal(q.options[q.answer], q.card.back);
  }
  assert.deepEqual(buildMultipleChoice([{ front: 'a', back: 'x' }]), []);
});

test('quiz: typed marking is forgiving', () => {
  assert.equal(markTyped('mitochondria', 'Mitochondria'), 'correct');
  assert.equal(markTyped('mitocondria', 'mitochondria'), 'correct');
  assert.equal(markTyped('glucose and oxygen are made', 'Glucose and oxygen'), 'correct');
  assert.equal(markTyped('glucose', 'Glucose and oxygen'), 'close');
  assert.equal(markTyped('banana', 'Glucose and oxygen'), 'wrong');
  assert.equal(markTyped('', 'x'), 'wrong');
  assert.ok(similarity('abc', 'abc') === 1);
});

test('share: deck round-trips through a link', async () => {
  const deck = { name: 'Test ✓', subject: '0610', cards: [{ front: 'a', back: 'b' }, { front: 'π', back: 'ß "q"' }] };
  const code = await encodeDeck(deck);
  assert.match(code, /^[zj][A-Za-z0-9_-]+$/);
  assert.deepEqual(await decodeDeck(code), deck);
  await assert.rejects(decodeDeck('xabc'));
});

test('papers: filenames and parsing', () => {
  assert.equal(paperFilename({ code: '0610', year: 2023, session: 's', type: 'qp', paper: 4, variant: 2 }), '0610_s23_qp_42');
  assert.equal(paperFilename({ code: '0620', year: 2019, session: 'w', type: 'er' }), '0620_w19_er');
  assert.deepEqual(parseFilename('0610_s23_ms_42.pdf'), { code: '0610', session: 's', year: 2023, type: 'ms', paper: 4, variant: 2 });
  assert.equal(parseFilename('0610_s23_gt').paper, undefined);
  assert.equal(parseFilename('hello'), null);
});

test('papers: release dates hide sessions that are not out yet', () => {
  const nov2026 = new Date(2026, 10, 19);
  assert.ok(isReleased(2026, 's', nov2026));
  assert.ok(!isReleased(2026, 'w', nov2026));
  assert.ok(isReleased(2025, 'w', nov2026));
  const bio = SUBJECTS.find((s) => s.code === '0610');
  const list = listPapers(bio, 2026, nov2026);
  assert.ok(list.every((p) => p.session !== 'w'));
  assert.equal(list.filter((p) => p.session === 'm').length, 6); // Feb/March: variant 2 only
  assert.equal(availableYears(bio, nov2026)[0], 2026);
});

test('data: subjects, decks and sources are well-formed', () => {
  const codes = new Set();
  for (const s of SUBJECTS) {
    assert.match(s.code, /^\d{4}$/);
    assert.ok(!codes.has(s.code), `duplicate ${s.code}`);
    codes.add(s.code);
    assert.ok(s.name && s.slug && s.group && s.icon);
    assert.ok(Object.keys(s.papers).length > 0);
    assert.ok(Array.isArray(s.topics) && s.topics.length > 0);
  }
  const ids = new Set();
  for (const d of LIBRARY) {
    assert.ok(!ids.has(d.id));
    ids.add(d.id);
    assert.ok(codes.has(d.subject), `${d.id} has unknown subject`);
    assert.ok(d.cards.length >= 10);
    for (const c of d.cards) assert.ok(c.length === 2 && c[0].trim() && c[1].trim(), `bad card in ${d.id}`);
  }
  const subject = SUBJECTS[0];
  for (const src of SOURCES) assert.match(src.pdf({ file: '0580_s23_qp_42', subject, year: 2023 }), /^https:\/\//);
});
