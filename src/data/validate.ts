// Hand-written runtime checks for public/data/*.json. They mirror src/types.ts:
// when a type changes, update both. Invalid items are skipped with an error
// message instead of breaking the app.

import { HANZI_GROUPS, PHRASE_TOPICS, WORD_TOPICS } from '../practice/decks';
import type { HanziItem, HanziWord, PhraseItem, PinyinLesson, PinyinSound, WordItem } from '../types';

export interface ParseResult<T> {
  items: T[];
  errors: string[];
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(o: Obj, key: string): string | undefined {
  const v = o[key];
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

function optStr(o: Obj, key: string): boolean {
  return o[key] === undefined || str(o, key) !== undefined;
}

function level(o: Obj): o is Obj & { level: 1 | 2 | 3 } {
  return o.level === 1 || o.level === 2 || o.level === 3;
}

const HAN = /^\p{Script=Han}+$/u;
const HANZI_KINDS = ['pictograph', 'indicative', 'compound'];
/** Path commands and numbers only, starting with a move. */
const SVG_PATH = /^M[\d\s.,MmLlHhVvCcSsQqAaZz-]+$/;

function parseFile<T>(data: unknown, check: (item: Obj) => string | null): ParseResult<T> {
  if (!isObj(data) || data.version !== 1 || !Array.isArray(data.items)) {
    return { items: [], errors: ['file must be { "version": 1, "items": [...] }'] };
  }
  const items: T[] = [];
  const errors: string[] = [];
  const ids = new Set<string>();
  data.items.forEach((raw, i) => {
    const id = isObj(raw) ? str(raw, 'id') : undefined;
    const problem = !isObj(raw) ? 'not an object' : !id ? 'missing id' : ids.has(id) ? 'duplicate id' : check(raw);
    if (problem) {
      errors.push(`#${i} ${id ?? ''}: ${problem}`);
      return;
    }
    ids.add(id!);
    items.push(raw as T);
  });
  return { items, errors };
}

export function parseWords(data: unknown): ParseResult<WordItem> {
  return parseFile<WordItem>(data, (o) => {
    const zh = str(o, 'zh');
    if (!zh || !HAN.test(zh)) return 'zh must be Chinese characters';
    if (!(WORD_TOPICS as readonly unknown[]).includes(o.topic)) return 'unknown topic';
    if (!str(o, 'pinyin') || !str(o, 'vi')) return 'missing pinyin or vi';
    if (!optStr(o, 'hv') || !optStr(o, 'emoji')) return 'bad hv or emoji';
    const hv = str(o, 'hv');
    if (hv && hv.split(/\s+/).length !== [...zh].length) return 'hv needs one syllable per character';
    if (!level(o)) return 'level must be 1-3';
    return null;
  });
}

export function parsePhrases(data: unknown): ParseResult<PhraseItem> {
  return parseFile<PhraseItem>(data, (o) => {
    if (!str(o, 'zh') || !str(o, 'pinyin') || !str(o, 'vi')) return 'missing zh, pinyin or vi';
    if (!(PHRASE_TOPICS as readonly unknown[]).includes(o.topic)) return 'unknown topic';
    if (!optStr(o, 'note')) return 'bad note';
    if (!level(o)) return 'level must be 1-3';
    return null;
  });
}

function isSound(v: unknown): v is PinyinSound {
  return isObj(v) && !!str(v, 'label') && !!str(v, 'zh') && !!str(v, 'pinyin') && !!str(v, 'vi') && optStr(v, 'tip');
}

export function parsePinyin(data: unknown): ParseResult<PinyinLesson> {
  return parseFile<PinyinLesson>(data, (o) => {
    if (!['tone', 'initial', 'final', 'sandhi'].includes(o.kind as string)) return 'bad kind';
    if (!str(o, 'title') || !str(o, 'intro')) return 'missing title or intro';
    if (!Array.isArray(o.sounds) || o.sounds.length < 2 || !o.sounds.every(isSound)) return 'needs 2+ valid sounds';
    return null;
  });
}

function isHanziWord(v: unknown): v is HanziWord {
  return isObj(v) && !!str(v, 'zh') && !!str(v, 'pinyin') && !!str(v, 'vi');
}

export function parseHanzi(data: unknown): ParseResult<HanziItem> {
  return parseFile<HanziItem>(data, (o) => {
    const ch = str(o, 'char');
    if (!ch || [...ch].length !== 1 || !HAN.test(ch)) return 'char must be one Chinese character';
    if (!(HANZI_GROUPS as readonly unknown[]).includes(o.group)) return 'unknown group';
    if (!str(o, 'pinyin') || !str(o, 'vi') || !str(o, 'hv')) return 'missing pinyin, vi or hv';
    if (!optStr(o, 'emoji') || !optStr(o, 'note')) return 'bad emoji or note';
    if (o.kind !== undefined && !HANZI_KINDS.includes(o.kind as string)) return 'bad kind';
    if (o.sketch !== undefined) {
      if (o.kind !== 'pictograph' || !str(o, 'emoji')) return 'only pictographs with an emoji have a sketch';
      if (typeof o.sketch !== 'string' || !SVG_PATH.test(o.sketch)) return 'sketch must be SVG path data';
    }
    if (!Array.isArray(o.words) || o.words.length < 1 || o.words.length > 3 || !o.words.every(isHanziWord)) {
      return 'needs 1-3 words';
    }
    if (!o.words.every((w) => (w as HanziWord).zh.includes(ch))) return 'every word must contain the character';
    return null;
  });
}
