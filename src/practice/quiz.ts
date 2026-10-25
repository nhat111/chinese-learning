// Question building for the games and the daily plan (pure, tested).

import type { CardState } from '../srs/sm2';
import type { HanziItem, WordItem } from '../types';
import { isSingleSyllable, toneOf, toneVariants } from './pinyin';

/** Random number in [0, 1). Tests pass a seeded one. */
export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Small deterministic generator (mulberry32) for tests and "of the day" picks. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks `n` items for a round: due reviews first (oldest first), then items
 * never practiced, then the rest, each group shuffled. With `freshInOrder` new
 * items keep their content order (easiest first), for learners starting from zero.
 */
export function pickRound<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  srs: Record<string, CardState>,
  today: string,
  n: number,
  rng: Rng = Math.random,
  freshInOrder = false,
): T[] {
  const due: T[] = [];
  const fresh: T[] = [];
  const rest: T[] = [];
  for (const it of items) {
    const card = srs[keyOf(it)];
    if (!card) fresh.push(it);
    else if (card.due <= today) due.push(it);
    else rest.push(it);
  }
  const dueSorted = shuffle(due, rng).sort((a, b) => srs[keyOf(a)].due.localeCompare(srs[keyOf(b)].due));
  return [...dueSorted, ...(freshInOrder ? fresh : shuffle(fresh, rng)), ...shuffle(rest, rng)].slice(0, n);
}

export interface Question<T> {
  target: T;
  options: T[];
  /** Index of the target in options. */
  answer: number;
}

/**
 * The target plus up to `count - 1` distractors whose `distinct` value differs
 * from the target's and from each other's; same-topic words first so the
 * choice is not given away by the topic.
 */
function withDistractors(
  target: WordItem,
  pool: readonly WordItem[],
  count: number,
  distinct: (w: WordItem) => string | undefined,
  rng: Rng,
): Question<WordItem> {
  const seen = new Set([distinct(target)]);
  const options = [target];
  const same = shuffle(pool.filter((w) => w.topic === target.topic), rng);
  const other = shuffle(pool.filter((w) => w.topic !== target.topic), rng);
  for (const w of [...same, ...other]) {
    if (options.length >= count) break;
    const d = distinct(w);
    if (d === undefined || seen.has(d)) continue;
    seen.add(d);
    options.push(w);
  }
  const shuffled = shuffle(options, rng);
  return { target, options: shuffled, answer: shuffled.indexOf(target) };
}

/** "Listen, pick the picture": 4 different emoji. The target must have one. */
export function pictureQuestion(target: WordItem, pool: readonly WordItem[], rng: Rng = Math.random, count = 4) {
  return withDistractors(target, pool, count, (w) => w.emoji, rng);
}

/** "What does it mean": 4 different Vietnamese meanings. */
export function meaningQuestion(target: WordItem, pool: readonly WordItem[], rng: Rng = Math.random, count = 4) {
  return withDistractors(target, pool, count, (w) => w.vi, rng);
}

/** Something to hear with a one-syllable pinyin: a word or a character. */
export interface ToneTarget {
  zh: string;
  pinyin: string;
  vi: string;
}

export interface ToneQuestion {
  target: ToneTarget;
  /** The syllable in tones 1-4, always in tone order. */
  options: string[];
  answer: number;
}

/** Items the tone quiz can use: one character, one syllable, tones 1-4. */
export function toneTargets<T extends ToneTarget>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    if ([...it.zh].length !== 1 || !isSingleSyllable(it.pinyin) || toneOf(it.pinyin) === 5 || seen.has(it.zh)) return false;
    seen.add(it.zh);
    return true;
  });
}

export function toneQuestion(target: ToneTarget): ToneQuestion {
  return { target, options: toneVariants(target.pinyin), answer: toneOf(target.pinyin) - 1 };
}

/** Characters drawn from real things, with the picture and sketch the glyph game shows. */
export function pictographs(items: readonly HanziItem[]): HanziItem[] {
  return items.filter((h) => h.kind === 'pictograph' && h.emoji && h.sketch);
}

/** "See the picture, pick the character": the target and `count - 1` other characters. */
export function glyphQuestion(target: HanziItem, pool: readonly HanziItem[], rng: Rng = Math.random, count = 4): Question<HanziItem> {
  const others = shuffle(pool.filter((h) => h.char !== target.char), rng).slice(0, count - 1);
  const options = shuffle([target, ...others], rng);
  return { target, options, answer: options.indexOf(target) };
}
