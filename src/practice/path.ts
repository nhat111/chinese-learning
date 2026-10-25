// The path for learners starting from zero (pure, tested): sounds first, then
// greetings, numbers, pictographs and everyday topics. Each stage links to the
// page that teaches it and counts as done once most of its items were practiced.

import type { CardState } from '../srs/sm2';
import type { HanziItem, PhraseItem, PinyinLesson, WordItem } from '../types';
import { srsKey } from './decks';
import { pictographs } from './quiz';

export interface PathContent {
  pinyin: PinyinLesson[];
  words: WordItem[];
  phrases: PhraseItem[];
  hanzi: HanziItem[];
}

/** One stage: its label key (vi.path.stages) and the steps that make it up. */
interface StageDef {
  id: string;
  pinyin?: string[];
  words?: string[];
  phrases?: string[];
  hanzi?: (items: HanziItem[]) => HanziItem[];
}

const STAGES: StageDef[] = [
  { id: 'tones', pinyin: ['py-tones', 'py-tones-2'] },
  { id: 'sounds', pinyin: ['py-finals-1', 'py-initials-1'] },
  { id: 'greet', words: ['greet'], phrases: ['greet'] },
  { id: 'numbers', words: ['number'], hanzi: (h) => h.filter((x) => x.group === 'number') },
  { id: 'pictographs', hanzi: pictographs },
  { id: 'moreSounds', pinyin: ['py-initials-2', 'py-initials-3', 'py-finals-2', 'py-finals-3'] },
  { id: 'family', words: ['family'], phrases: ['intro'] },
  { id: 'animals', words: ['animal', 'color'] },
  { id: 'food', words: ['food', 'fruit'], phrases: ['food'] },
];

/** A thing to practice: its progress key and the page that teaches it. */
interface Step {
  key: string;
  to: string;
}

export interface PathStage {
  id: string;
  done: number;
  total: number;
  complete: boolean;
  /** The page of the first step not yet practiced (or the first step). */
  to: string;
}

/** Share of a stage's steps that must be practiced to move on. */
const ENOUGH = 0.8;

function stepsOf(def: StageDef, content: PathContent): Step[] {
  const steps: Step[] = [];
  for (const id of def.pinyin ?? []) {
    const lesson = content.pinyin.find((l) => l.id === id);
    lesson?.sounds.forEach((_, i) => steps.push({ key: srsKey.pinyin(id, i), to: `/pinyin/${id}` }));
  }
  for (const topic of def.words ?? []) {
    for (const w of content.words) if (w.topic === topic) steps.push({ key: srsKey.word(w.id), to: `/words/${topic}` });
  }
  for (const topic of def.phrases ?? []) {
    for (const p of content.phrases) if (p.topic === topic) steps.push({ key: srsKey.phrase(p.id), to: `/phrases?topic=${topic}` });
  }
  for (const h of def.hanzi?.(content.hanzi) ?? []) steps.push({ key: srsKey.hanzi(h.id), to: `/hanzi/${h.id}` });
  return steps;
}

export function buildPath(content: PathContent, srs: Record<string, CardState>): PathStage[] {
  return STAGES.flatMap((def) => {
    const steps = stepsOf(def, content);
    if (steps.length === 0) return [];
    const done = steps.filter((s) => srs[s.key]).length;
    const next = steps.find((s) => !srs[s.key]) ?? steps[0];
    return [{ id: def.id, done, total: steps.length, complete: done >= Math.ceil(steps.length * ENOUGH), to: next.to }];
  });
}

/** Index of the first stage not complete, or -1 when the whole path is done. */
export function currentStage(path: readonly PathStage[]): number {
  return path.findIndex((s) => !s.complete);
}
