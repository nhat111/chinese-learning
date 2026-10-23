import type { CharacterJson } from 'hanzi-writer';

const cache = new Map<string, Promise<CharacterJson>>();

/**
 * Stroke data for one character, from /strokes/<char>.json: copied from
 * hanzi-writer-data at build time for every character in the content
 * (strokePlugin in vite.config.ts), so it is precached and works offline.
 */
export function loadStrokes(char: string): Promise<CharacterJson> {
  let p = cache.get(char);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}strokes/${encodeURIComponent(char)}.json`).then((r) => {
      if (!r.ok) throw new Error(`strokes ${r.status}`);
      return r.json() as Promise<CharacterJson>;
    });
    p.catch(() => cache.delete(char));
    cache.set(char, p);
  }
  return p;
}
