// Build quizzes out of flashcards: multiple choice (distractors come from the
// other cards in the deck) and typed answers with forgiving marking.

import { shuffle, similarity, normalise } from './util.js';

/**
 * @param {{front: string, back: string}[]} cards
 * @param {{count?: number, options?: number, rng?: () => number, reverse?: boolean}} opts
 * @returns {{prompt: string, options: string[], answer: number, card: object}[]}
 */
export function buildMultipleChoice(cards, { count = 10, options = 4, rng = Math.random, reverse = false } = {}) {
  const usable = cards.filter((c) => c.front && c.back);
  const answerOf = (c) => (reverse ? c.front : c.back);
  const promptOf = (c) => (reverse ? c.back : c.front);
  const distinctAnswers = [...new Set(usable.map((c) => normalise(answerOf(c))))];
  if (distinctAnswers.length < 2) return [];

  const picked = shuffle(usable, rng).slice(0, Math.min(count, usable.length));
  return picked.map((card) => {
    const correct = answerOf(card);
    const len = correct.length;
    // Prefer distractors of a similar length so the right answer doesn't stand out.
    const pool = shuffle(
      usable.filter((c) => normalise(answerOf(c)) !== normalise(correct)),
      rng,
    ).sort((a, b) => Math.abs(answerOf(a).length - len) - Math.abs(answerOf(b).length - len));

    const chosen = [];
    const seen = new Set([normalise(correct)]);
    for (const c of pool) {
      const n = normalise(answerOf(c));
      if (seen.has(n)) continue;
      seen.add(n);
      chosen.push(answerOf(c));
      if (chosen.length >= options - 1) break;
    }
    const opts = shuffle([correct, ...chosen], rng);
    return { prompt: promptOf(card), options: opts, answer: opts.indexOf(correct), card };
  });
}

/**
 * Mark a typed answer. Accepts small typos and answers that contain all the
 * key words of a short expected answer.
 * @returns {'correct'|'close'|'wrong'}
 */
export function markTyped(given, expected) {
  const g = normalise(given);
  const e = normalise(expected);
  if (!g) return 'wrong';
  if (g === e) return 'correct';
  const sim = similarity(g, e);
  if (sim >= 0.85) return 'correct';
  // For short expected answers, containing every key word counts.
  const keyWords = e.split(' ').filter((w) => w.length > 3);
  if (keyWords.length && keyWords.length <= 6 && keyWords.every((w) => g.includes(w))) return 'correct';
  if (sim >= 0.6) return 'close';
  if (keyWords.length) {
    const hits = keyWords.filter((w) => g.includes(w)).length;
    if (hits / keyWords.length >= 0.5) return 'close';
  }
  return 'wrong';
}
