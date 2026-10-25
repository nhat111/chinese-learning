// Topic lists and SRS keys. Labels live in vi.ts (vi.topics, vi.phraseTopics,
// vi.hanziGroups); content tests check that every item uses a listed id.

export const WORD_TOPICS = [
  'greet',
  'number',
  'family',
  'color',
  'animal',
  'food',
  'fruit',
  'body',
  'school',
  'home',
  'nature',
  'time',
  'action',
] as const;
export type WordTopic = (typeof WORD_TOPICS)[number];

export const PHRASE_TOPICS = ['greet', 'intro', 'class', 'food', 'shop', 'daily'] as const;
export type PhraseTopic = (typeof PHRASE_TOPICS)[number];

export const HANZI_GROUPS = ['number', 'nature', 'body', 'animal', 'common'] as const;
export type HanziGroup = (typeof HANZI_GROUPS)[number];

/**
 * Progress keys. Never change their shape: saved progress is keyed by them.
 * - word:<id>      flashcard rating
 * - phrase:<id>    speaking self-rating
 * - hanzi:<id>     writing quiz
 * - pinyin:<lesson>:<i>  pinyin sound repeated
 * - tone:<zh>      tone quiz (by character, shared by words and hanzi)
 * - pic:<id>       "listen, pick the picture"
 * - mean:<id>      "what does it mean"
 * - glyph:<id>     "see the picture, pick the character" (pictographs)
 */
export const srsKey = {
  word: (id: string) => `word:${id}`,
  phrase: (id: string) => `phrase:${id}`,
  hanzi: (id: string) => `hanzi:${id}`,
  pinyin: (lesson: string, i: number) => `pinyin:${lesson}:${i}`,
  tone: (zh: string) => `tone:${zh}`,
  pic: (id: string) => `pic:${id}`,
  mean: (id: string) => `mean:${id}`,
  glyph: (id: string) => `glyph:${id}`,
};
