import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { vi } from '../i18n/vi';
import { HANZI_GROUPS, PHRASE_TOPICS, WORD_TOPICS } from '../practice/decks';
import { toneOf } from '../practice/pinyin';
import { parseHanzi, parsePhrases, parsePinyin, parseWords } from './validate';

function load(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../public/data/${name}.json`, import.meta.url), 'utf8'));
}

describe('content files', () => {
  const words = parseWords(load('words'));
  const phrases = parsePhrases(load('phrases'));
  const pinyin = parsePinyin(load('pinyin'));
  const hanzi = parseHanzi(load('hanzi'));

  it('have no invalid items', () => {
    expect(words.errors).toEqual([]);
    expect(phrases.errors).toEqual([]);
    expect(pinyin.errors).toEqual([]);
    expect(hanzi.errors).toEqual([]);
    expect(words.items.length).toBeGreaterThan(100);
  });

  it('have no duplicate Chinese text', () => {
    for (const list of [words.items.map((w) => w.zh), phrases.items.map((p) => p.zh), hanzi.items.map((h) => h.char)]) {
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('every topic and group has a label and at least 4 items', () => {
    for (const t of WORD_TOPICS) {
      expect(vi.topics[t]).toBeTruthy();
      expect(words.items.filter((w) => w.topic === t).length).toBeGreaterThanOrEqual(4);
    }
    for (const t of PHRASE_TOPICS) {
      expect(vi.phraseTopics[t]).toBeTruthy();
      expect(phrases.items.filter((p) => p.topic === t).length).toBeGreaterThanOrEqual(4);
    }
    for (const g of HANZI_GROUPS) {
      expect(vi.hanziGroups[g]).toBeTruthy();
      expect(hanzi.items.filter((h) => h.group === g).length).toBeGreaterThanOrEqual(4);
    }
  });

  it('tone lessons show each tone in its label', () => {
    for (const lesson of pinyin.items.filter((l) => l.kind === 'tone')) {
      for (const s of lesson.sounds) expect(s.label).toBe(s.pinyin);
    }
    const first = pinyin.items.find((l) => l.id === 'py-tones')!;
    expect(first.sounds.map((s) => toneOf(s.pinyin))).toEqual([1, 2, 3, 4, 5]);
  });

  it('pictographs map a real thing to the character', () => {
    const picto = hanzi.items.filter((h) => h.kind === 'pictograph');
    expect(picto.length).toBeGreaterThanOrEqual(20);
    for (const h of picto) {
      expect(h.emoji, h.char).toBeTruthy();
      expect(h.sketch, h.char).toBeTruthy();
      expect(h.note, h.char).toBeTruthy();
    }
    const emoji = picto.map((h) => h.emoji);
    expect(new Set(emoji).size).toBe(emoji.length);
  });

  it('single-character words agree with the hanzi list', () => {
    for (const h of hanzi.items) {
      const w = words.items.find((x) => x.zh === h.char);
      if (w) expect(w.pinyin, h.char).toBe(h.pinyin);
    }
  });
});
