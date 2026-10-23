// Loads content from public/data/*.json. Files are fetched once and cached for
// the session; adding items to the JSON files needs no code changes.

import { useEffect, useState } from 'react';
import type { HanziItem, PhraseItem, PinyinLesson, WordItem } from '../types';
import { parseHanzi, parsePhrases, parsePinyin, parseWords, type ParseResult } from './validate';

interface ContentMap {
  words: WordItem;
  phrases: PhraseItem;
  pinyin: PinyinLesson;
  hanzi: HanziItem;
}

export type ContentKind = keyof ContentMap;

const parsers: { [K in ContentKind]: (data: unknown) => ParseResult<ContentMap[K]> } = {
  words: parseWords,
  phrases: parsePhrases,
  pinyin: parsePinyin,
  hanzi: parseHanzi,
};

const cache = new Map<ContentKind, Promise<unknown[]>>();

async function fetchContent<K extends ContentKind>(kind: K): Promise<ContentMap[K][]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${kind}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { items, errors } = parsers[kind](await res.json());
  if (errors.length > 0) console.warn(`[content] ${kind}.json có ${errors.length} lỗi, đã bỏ qua mục lỗi:`, errors);
  return items;
}

export function loadContent<K extends ContentKind>(kind: K): Promise<ContentMap[K][]> {
  let p = cache.get(kind);
  if (!p) {
    p = fetchContent(kind);
    // Allow a retry after a failed request.
    p.catch(() => cache.delete(kind));
    cache.set(kind, p);
  }
  return p as Promise<ContentMap[K][]>;
}

export type ContentState<T> = { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'ready'; items: T[] };

export function useContent<K extends ContentKind>(kind: K): ContentState<ContentMap[K]> {
  const [state, setState] = useState<ContentState<ContentMap[K]>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    loadContent(kind).then(
      (items) => alive && setState({ status: 'ready', items }),
      () => alive && setState({ status: 'error', retry: () => setAttempt((a) => a + 1) }),
    );
    return () => {
      alive = false;
    };
  }, [kind, attempt]);
  return state;
}
