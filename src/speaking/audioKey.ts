// Pre-generated natural voice (Edge TTS, see scripts/tts.py). Each spoken text
// is stored at /audio/zh/<audioKey(text)>.mp3. Imports use explicit .ts
// extensions so scripts/tts-jobs.ts can load it directly with Node.

export const NATURAL_VOICE = 'zh-CN-XiaoxiaoNeural';

/** Stable 53-bit hash (cyrb53) of the trimmed text, as 14 hex digits. Never change it. */
export function audioKey(text: string): string {
  const s = text.trim();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** `base` is the audio host without a trailing slash; '' means this origin. */
export function audioUrl(text: string, base = ''): string {
  return `${base}/audio/zh/${audioKey(text)}.mp3`;
}

/** Sentence used by the "test voice" button in Settings. */
export const VOICE_SAMPLE = '你好！我们一起学中文吧。';

interface ContentFiles {
  words: { zh: string }[];
  phrases: { zh: string }[];
  pinyin: { sounds: { zh: string }[] }[];
  hanzi: { char: string; words: { zh: string }[] }[];
}

/** Every Chinese text the app can read aloud from static content. */
export function spokenTexts(c: ContentFiles): string[] {
  const out = new Set<string>([VOICE_SAMPLE]);
  for (const w of c.words) out.add(w.zh);
  for (const p of c.phrases) out.add(p.zh);
  for (const l of c.pinyin) for (const s of l.sounds) out.add(s.zh);
  for (const h of c.hanzi) {
    out.add(h.char);
    for (const w of h.words) out.add(w.zh);
  }
  return [...out].map((t) => t.trim()).filter(Boolean);
}
