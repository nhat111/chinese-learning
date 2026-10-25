// Content types for public/data/*.json. The runtime checks in
// src/data/validate.ts mirror these; when a type changes, update both.

/** A vocabulary word (words.json). */
export interface WordItem {
  /** Stable id, never renamed: `w-<topic>-<n>`. */
  id: string;
  /** One of WORD_TOPICS (src/practice/decks.ts). */
  topic: string;
  /** Simplified Chinese. */
  zh: string;
  /** Hanyu Pinyin with tone marks, syllables of one word written together (péngyou). */
  pinyin: string;
  /** Vietnamese meaning. */
  vi: string;
  /** Sino-Vietnamese reading (Hán Việt), one syllable per character. */
  hv?: string;
  /** Picture for children and the picture games. */
  emoji?: string;
  /** 1 = first words, 2 = everyday, 3 = a bit harder. */
  level: 1 | 2 | 3;
}

/** A sentence to listen to and repeat (phrases.json). */
export interface PhraseItem {
  /** `p-<n>`. */
  id: string;
  /** One of PHRASE_TOPICS. */
  topic: string;
  zh: string;
  pinyin: string;
  vi: string;
  /** Usage note in Vietnamese. */
  note?: string;
  level: 1 | 2 | 3;
}

/** One sound in a pinyin lesson, read aloud through an example word. */
export interface PinyinSound {
  /** What is taught: "b", "ang", "mā". */
  label: string;
  /** Example word read aloud. */
  zh: string;
  /** Pinyin of the example word. */
  pinyin: string;
  /** Vietnamese meaning of the example word. */
  vi: string;
  /** How to say it, compared with Vietnamese sounds. */
  tip?: string;
}

/** A pinyin lesson (pinyin.json). Sounds are keyed by index: only append. */
export interface PinyinLesson {
  /** `py-<name>`. */
  id: string;
  kind: 'tone' | 'initial' | 'final' | 'sandhi';
  title: string;
  intro: string;
  sounds: PinyinSound[];
}

/** An example word for a character. */
export interface HanziWord {
  zh: string;
  pinyin: string;
  vi: string;
}

/**
 * How a character was formed: a drawing of a real thing (pictograph, 象形),
 * strokes pointing at an idea (indicative, 指事: numbers, 上, 下) or two
 * characters put together (compound, 会意: 好 = 女 + 子).
 */
export type HanziKind = 'pictograph' | 'indicative' | 'compound';

/** A character to learn to write (hanzi.json). */
export interface HanziItem {
  /** `hz-<n>`. */
  id: string;
  /** One of HANZI_GROUPS. */
  group: string;
  /** A single simplified character. */
  char: string;
  pinyin: string;
  vi: string;
  hv: string;
  /** The real thing (pictographs) or a picture of the meaning. */
  emoji?: string;
  kind?: HanziKind;
  /**
   * Pictographs: SVG path data (viewBox 0 0 100 100, drawn as strokes) of the
   * thing drawn simply, the step between the emoji and the character.
   */
  sketch?: string;
  /** How the character came to look like this (pictographs), or a memory hook. */
  note?: string;
  /** 1-3 words using the character. */
  words: HanziWord[];
}
