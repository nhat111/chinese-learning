import { describe, expect, it } from 'vitest';
import type { CardState } from '../srs/sm2';
import type { HanziItem, WordItem } from '../types';
import { glyphQuestion, meaningQuestion, pickRound, pictureQuestion, seededRng, toneQuestion, toneTargets } from './quiz';

const w = (id: string, topic: string, zh: string, pinyin: string, vi: string, emoji?: string): WordItem => ({
  id,
  topic,
  zh,
  pinyin,
  vi,
  emoji,
  level: 1,
});

const POOL = [
  w('a', 'animal', '猫', 'māo', 'mèo', '🐱'),
  w('b', 'animal', '狗', 'gǒu', 'chó', '🐶'),
  w('c', 'animal', '鱼', 'yú', 'cá', '🐟'),
  w('d', 'animal', '马', 'mǎ', 'ngựa', '🐴'),
  w('e', 'food', '水', 'shuǐ', 'nước', '💧'),
  w('f', 'food', '茶', 'chá', 'trà'),
  w('g', 'greet', '你好', 'nǐ hǎo', 'xin chào', '👋'),
  w('h', 'greet', '再见', 'zàijiàn', 'tạm biệt', '👋'),
  w('i', 'greet', '吗', 'ma', '(hỏi)'),
];

describe('questions', () => {
  it('picture options have 4 distinct emoji including the target', () => {
    for (let s = 0; s < 20; s++) {
      const q = pictureQuestion(POOL[0], POOL, seededRng(s));
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answer]).toBe(POOL[0]);
      const emoji = q.options.map((o) => o.emoji);
      expect(new Set(emoji).size).toBe(4);
      expect(emoji).not.toContain(undefined);
    }
  });

  it('prefers distractors from the same topic', () => {
    const q = pictureQuestion(POOL[0], POOL, seededRng(3));
    expect(q.options.every((o) => o.topic === 'animal')).toBe(true);
  });

  it('meaning options never repeat a meaning', () => {
    const q = meaningQuestion(POOL[6], POOL, seededRng(1));
    expect(new Set(q.options.map((o) => o.vi)).size).toBe(4);
    expect(q.options[q.answer]).toBe(POOL[6]);
  });

  it('tone quiz uses one-syllable, toned characters only', () => {
    const targets = toneTargets(POOL);
    expect(targets.map((t) => t.zh)).toEqual(['猫', '狗', '鱼', '马', '水', '茶']);
    const q = toneQuestion(POOL[3]);
    expect(q.options).toEqual(['mā', 'má', 'mǎ', 'mà']);
    expect(q.answer).toBe(2);
  });
});

describe('pickRound', () => {
  const card = (due: string): CardState => ({ ef: 2.5, interval: 1, reps: 1, due, lastReviewed: due });

  it('puts due items first, then new ones, then the rest', () => {
    const srs = { 'k:a': card('2026-01-05'), 'k:b': card('2026-01-01'), 'k:c': card('2026-02-01') };
    const round = pickRound(['a', 'b', 'c', 'd'], (x) => `k:${x}`, srs, '2026-01-10', 4, seededRng(7));
    expect(round.slice(0, 2)).toEqual(['b', 'a']);
    expect(round[2]).toBe('d');
    expect(round[3]).toBe('c');
  });

  it('returns at most n items', () => {
    expect(pickRound(['a', 'b', 'c'], (x) => x, {}, '2026-01-01', 2)).toHaveLength(2);
  });
});

describe('glyphQuestion', () => {
  const h = (id: string, char: string): HanziItem => ({ id, group: 'nature', char, pinyin: 'x', vi: id, hv: 'x', kind: 'pictograph', words: [] });
  const pool = [h('a', '日'), h('b', '月'), h('c', '山'), h('d', '水'), h('e', '火')];

  it('offers the target and 3 other characters', () => {
    const q = glyphQuestion(pool[2], pool, seededRng(5));
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answer]).toBe(pool[2]);
    expect(new Set(q.options.map((o) => o.char)).size).toBe(4);
  });
});

describe('pickRound in order', () => {
  it('keeps new items in content order', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(pickRound(items, (x) => x, {}, '2026-10-23', 3, seededRng(6), true)).toEqual(['a', 'b', 'c']);
  });
});
