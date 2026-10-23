// The daily lesson (pure, tested): a few new or due words, then quick
// questions on them, the tones, one character to write and one sentence to say.

import type { CardState } from '../srs/sm2';
import type { Learner } from '../storage/prefs';
import type { HanziItem, PhraseItem, WordItem } from '../types';
import { srsKey } from './decks';
import {
  meaningQuestion,
  pickRound,
  pictureQuestion,
  toneQuestion,
  toneTargets,
  type Question,
  type Rng,
  type ToneQuestion,
} from './quiz';

export type PlanStep =
  | { kind: 'word'; item: WordItem }
  | { kind: 'picture'; question: Question<WordItem> }
  | { kind: 'meaning'; question: Question<WordItem> }
  | { kind: 'tone'; question: ToneQuestion }
  | { kind: 'hanzi'; item: HanziItem }
  | { kind: 'phrase'; item: PhraseItem };

export interface PlanContent {
  words: WordItem[];
  phrases: PhraseItem[];
  hanzi: HanziItem[];
}

/** Steps per 5 minutes. */
const BASE = { word: 3, quiz: 2, tone: 2, hanzi: 1, phrase: 1 };

/** How many steps a session of `minutes` has (Home's daily goal). */
export function planSize(minutes: number): number {
  const scale = Math.max(1, Math.round(minutes / 5));
  return Object.values(BASE).reduce((sum, n) => sum + n * scale, 0);
}

export function buildDailyPlan(
  content: PlanContent,
  srs: Record<string, CardState>,
  today: string,
  minutes: number,
  learner: Learner,
  rng: Rng = Math.random,
): PlanStep[] {
  const scale = Math.max(1, Math.round(minutes / 5));
  const kid = learner === 'kid';
  // Children start with level 1-2 words and level 1 sentences.
  const words = kid ? content.words.filter((w) => w.level <= 2) : content.words;
  const phrases = kid ? content.phrases.filter((p) => p.level === 1) : content.phrases;

  const newWords = pickRound(words, (w) => srsKey.word(w.id), srs, today, BASE.word * scale, rng);
  const steps: PlanStep[] = newWords.map((item) => ({ kind: 'word', item }));

  // Questions on today's words first, then others that are due.
  const quizCount = BASE.quiz * scale;
  if (kid) {
    const withPicture = words.filter((w) => w.emoji);
    const targets = [
      ...newWords.filter((w) => w.emoji),
      ...pickRound(withPicture.filter((w) => !newWords.includes(w)), (w) => srsKey.pic(w.id), srs, today, quizCount, rng),
    ].slice(0, quizCount);
    for (const t of targets) steps.push({ kind: 'picture', question: pictureQuestion(t, withPicture, rng) });
  } else {
    const targets = [
      ...newWords,
      ...pickRound(words.filter((w) => !newWords.includes(w)), (w) => srsKey.mean(w.id), srs, today, quizCount, rng),
    ].slice(0, quizCount);
    for (const t of targets) steps.push({ kind: 'meaning', question: meaningQuestion(t, words, rng) });
  }

  const tones = pickRound(toneTargets([...words, ...content.hanzi.map((h) => ({ ...h, zh: h.char }))]), (t) => srsKey.tone(t.zh), srs, today, BASE.tone * scale, rng);
  for (const t of tones) steps.push({ kind: 'tone', question: toneQuestion(t) });

  for (const item of pickRound(content.hanzi, (h) => srsKey.hanzi(h.id), srs, today, BASE.hanzi * scale, rng)) {
    steps.push({ kind: 'hanzi', item });
  }
  for (const item of pickRound(phrases, (p) => srsKey.phrase(p.id), srs, today, BASE.phrase * scale, rng)) {
    steps.push({ kind: 'phrase', item });
  }
  return steps;
}
