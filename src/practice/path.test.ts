import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseHanzi, parsePhrases, parsePinyin, parseWords } from '../data/validate';
import type { CardState } from '../srs/sm2';
import { buildPath, currentStage } from './path';

function load(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'));
}

const content = {
  pinyin: parsePinyin(load('pinyin')).items,
  words: parseWords(load('words')).items,
  phrases: parsePhrases(load('phrases')).items,
  hanzi: parseHanzi(load('hanzi')).items,
};

const card: CardState = { ef: 2.5, interval: 1, reps: 1, due: '2026-10-30', lastReviewed: '2026-10-24' };

describe('buildPath', () => {
  it('starts a new learner at the tones', () => {
    const path = buildPath(content, {});
    expect(path.map((s) => s.id)).toEqual(['tones', 'sounds', 'greet', 'numbers', 'pictographs', 'moreSounds', 'family', 'animals', 'food']);
    expect(path.every((s) => s.total > 0 && s.done === 0)).toBe(true);
    expect(currentStage(path)).toBe(0);
    expect(path[0].to).toBe('/pinyin/py-tones');
  });

  it('moves on once most of a stage is practiced and links to the next step', () => {
    const tones = content.pinyin.filter((l) => l.id === 'py-tones' || l.id === 'py-tones-2');
    const srs: Record<string, CardState> = {};
    for (const l of tones) l.sounds.forEach((_, i) => (srs[`pinyin:${l.id}:${i}`] = card));
    const path = buildPath(content, srs);
    expect(path[0].complete).toBe(true);
    expect(currentStage(path)).toBe(1);

    const first = content.hanzi.find((h) => h.kind === 'pictograph')!;
    srs[`hanzi:${first.id}`] = card;
    const picto = buildPath(content, srs).find((s) => s.id === 'pictographs')!;
    expect(picto.done).toBe(1);
    expect(picto.to).not.toBe(`/hanzi/${first.id}`);
  });

  it('is done when every stage is', () => {
    const path = buildPath(content, {}).map((s) => ({ ...s, complete: true }));
    expect(currentStage(path)).toBe(-1);
  });
});
