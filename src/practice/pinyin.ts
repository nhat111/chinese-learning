// Pinyin tone helpers (pure, tested). Syllables carry tone marks (mā, lǜ);
// a syllable without a mark is the neutral tone (5).

export type Tone = 1 | 2 | 3 | 4 | 5;

const MARKS: Record<string, string> = {
  a: 'āáǎà',
  e: 'ēéěè',
  i: 'īíǐì',
  o: 'ōóǒò',
  u: 'ūúǔù',
  ü: 'ǖǘǚǜ',
};

/** Marked vowel → [base vowel, tone]. */
const UNMARK = new Map<string, [string, Tone]>();
for (const [base, marked] of Object.entries(MARKS)) {
  [...marked].forEach((m, i) => {
    UNMARK.set(m, [base, (i + 1) as Tone]);
    UNMARK.set(m.toUpperCase(), [base.toUpperCase(), (i + 1) as Tone]);
  });
}

/** Tone of one syllable: 1-4 from its mark, 5 (neutral) without one. */
export function toneOf(syllable: string): Tone {
  for (const ch of syllable) {
    const hit = UNMARK.get(ch);
    if (hit) return hit[1];
  }
  return 5;
}

/** The syllable without its tone mark (ü stays ü). */
export function stripTone(syllable: string): string {
  return [...syllable].map((ch) => UNMARK.get(ch)?.[0] ?? ch).join('');
}

/**
 * Index of the vowel that carries the mark: a or e if present, the o of
 * "ou", otherwise the last vowel (so "liu" → u, "gui" → i).
 */
function markIndex(base: string): number {
  const lower = base.toLowerCase();
  const a = lower.search(/[ae]/);
  if (a >= 0) return a;
  const ou = lower.indexOf('ou');
  if (ou >= 0) return ou;
  for (let i = lower.length - 1; i >= 0; i--) if ('iouü'.includes(lower[i])) return i;
  return -1;
}

/** The syllable with the given tone (5 removes the mark). */
export function setTone(syllable: string, tone: Tone): string {
  const base = stripTone(syllable);
  if (tone === 5) return base;
  const i = markIndex(base);
  if (i < 0) return base;
  const ch = base[i];
  const marked = MARKS[ch.toLowerCase()]?.[tone - 1];
  if (!marked) return base;
  return base.slice(0, i) + (ch === ch.toLowerCase() ? marked : marked.toUpperCase()) + base.slice(i + 1);
}

/** The same syllable in tones 1-4, in tone order (the tone quiz options). */
export function toneVariants(syllable: string): string[] {
  return ([1, 2, 3, 4] as const).map((t) => setTone(syllable, t));
}

/** True for one written syllable (letters only, no spaces or apostrophes). */
export function isSingleSyllable(pinyin: string): boolean {
  return /^[\p{L}]+$/u.test(pinyin) && (pinyin.match(/[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+/giu)?.length ?? 0) === 1;
}

/** Vietnamese-friendly name of a tone, used in the quiz feedback. */
export const TONE_NAMES: Record<Tone, string> = {
  1: 'Thanh 1 (ngang, cao)',
  2: 'Thanh 2 (đi lên)',
  3: 'Thanh 3 (xuống rồi lên)',
  4: 'Thanh 4 (rơi mạnh)',
  5: 'Thanh nhẹ',
};
