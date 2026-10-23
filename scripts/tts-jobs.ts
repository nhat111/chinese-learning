// Prints the list of texts to synthesize as JSON: [{ key, text }].
// Usage: node scripts/tts-jobs.ts > tts-jobs.json (see `npm run tts`).

import { readFileSync } from 'node:fs';
import { audioKey, spokenTexts } from '../src/speaking/audioKey.ts';

const load = (name: string) => JSON.parse(readFileSync(`public/data/${name}.json`, 'utf8')).items;

const texts = spokenTexts({
  words: load('words'),
  phrases: load('phrases'),
  pinyin: load('pinyin'),
  hanzi: load('hanzi'),
});
console.log(JSON.stringify(texts.map((text) => ({ key: audioKey(text), text }))));
