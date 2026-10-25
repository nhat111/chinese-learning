# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project purpose

**ZhongVui** (趣中文): a Chinese (Mandarin, simplified) practice app for **Vietnamese absolute beginners, children
and adults** (HSK 0-1). Same architecture as the sibling project `korean-practice` (KoDevTalk): static React app,
JSON content, localStorage progress, PWA, no accounts.

## Language rules

- **All UI text is in Vietnamese**, kept in `src/i18n/vi.ts`. Don't scatter literal strings in components.
- **Learning content is Chinese** (simplified), with pinyin (tone marks), Vietnamese meaning and, for words and
  characters, the Hán Việt reading (`hv`, one syllable per character, tested).
- Code, identifiers, comments and commit messages are in English.
- Content must suit children: simple, friendly sentences; no adult topics.

## Stack

- React 19 + Vite + TypeScript (strict, no `any`), react-router. No backend.
- `hanzi-writer` draws stroke order and runs the writing quiz. Stroke data comes from the `hanzi-writer-data`
  devDependency: `strokePlugin` in `vite.config.ts` copies `strokes/<char>.json` for every character in
  `hanzi.json` into the build (precached, works offline) and serves it in dev. Arphic Public License: keep the
  credit in Settings.

## Structure

```
public/data/      words, phrases, pinyin, hanzi .json (+ audio-index.json, generated)
public/audio/zh/  natural-voice MP3s (npm run tts), named audioKey(text)
src/types.ts      content types; src/data/validate.ts mirrors them (update both)
src/practice/     pure, tested: pinyin.ts (tones), quiz.ts (questions, rounds), plan.ts (daily lesson, new items in content order), path.ts ("Lộ trình từ số 0" on Home), stats.ts, decks.ts (topics + SRS keys)
src/speaking/     compare.ts (character LCS score), recognition.ts (zh-CN), recorder.ts, audioKey.ts (pinned hash)
src/storage/      prefs.ts, progress.ts: the only modules that touch localStorage
src/components/   Layout, Zh (ZhText, SpeakButton), Choice, Questions, Round, WordCard, SpeakPractice, HanziWriterBox, Pictograph, Welcome
src/pages/        Home, Daily, Review, Pinyin(+lesson), Words(+topic), Hanzi(+detail), Phrases, Games(+play), Progress, Settings
```

## Content conventions

- Each file is `{ "version": 1, "items": [...] }`. `npm test` (`src/data/content.test.ts`) validates every file.
  Adding content needs no code changes. **Never rename or reuse an id**: progress is keyed by ids.
- `words.json`: id `w-<topic>-<nn>`, `topic` in `WORD_TOPICS` (labels in `vi.topics`), `zh`, `pinyin`, `vi`, `hv`,
  optional `emoji` (the picture for kids and the picture games; keep it concrete), `level` 1-3. No duplicate `zh`.
- `phrases.json`: id `p-<nnn>`, `topic` in `PHRASE_TOPICS`, optional Vietnamese `note`, `level` (1 = kid-friendly).
  Pinyin shows tone sandhi of 不/一 as spoken (bú kèqi, yí biàn).
- `pinyin.json`: lessons (`tone | initial | final | sandhi`); each sound is taught through an example word `zh`
  (that is what is read aloud), `tip` compares with Vietnamese sounds. Sounds are keyed by index: only append.
- `hanzi.json`: one character, `group` in `HANZI_GROUPS`, `hv`, optional `note` (pictograph origin / memory hook),
  1-3 `words` containing the character. Optional `kind` (`pictograph | indicative | compound`). Pictographs carry
  `emoji` (the real thing), `sketch` (SVG path data, viewBox 100, strokes; each `M` subpath draws in turn) and a
  `note` that walks from the real thing to the strokes; they get the "Ngoài đời → Vẽ lại → Chữ Hán" strip and the
  glyph game. Pictograph emoji are unique (tested).
- Content order matters: the daily lesson teaches new words and characters in file order, easiest first.
- After adding or editing content run `npm run tts` (needs `pip install edge-tts`, ffmpeg; behind a TLS proxy set
  `TTS_CA_FILE`). Missing files fall back to the device voice.

## Progress and SRS

- `zv:progress:v1`: `srs` (SM-2 cards) and `daily` (answers, correct = stars, planSteps, recordMs). Keys from
  `srsKey` in `src/practice/decks.ts`: `word:`, `phrase:`, `hanzi:`, `pinyin:<lesson>:<i>`, `tone:<zh>`, `pic:`, `mean:`, `glyph:`.
- `zv:prefs:v1`: learner (`kid | adult`), minutes, onboarded, speechRate, voiceSource, showPinyin, showHanViet,
  effects. Missing fields default. Shape changes need a migration, not dropped data.
- Wrap storage access in try/catch; the app must work with storage unavailable.

## UI

- Mobile-first (360px), touch targets ≥ 44px, `.app` fixed with only `.main` scrolling (`src/viewport.ts`).
- 5 tabs (Trang chủ, Phát âm, Từ vựng, Chữ Hán, Trò chơi); Progress and Settings are topbar icons; phrases are
  reached from Home and Games. Don't add a sixth tab.
- Tokens at the top of `src/index.css` (Chinese red `--primary`, gold `--gold` for stars, warm paper background);
  `.app--kid` enlarges characters (`--zh-scale`), pictures and buttons. Respect dark mode and reduced motion.
- Icons via `<Icon name=… />` (inline Lucide paths). Emoji are content pictures only, not UI icons.
- Components whose state belongs to one item (WordCard, SpeakPractice, question views) are keyed by the item
  by their parents instead of resetting state in effects. `Round` owns a round's questions (`build`) and replay.

## Commands

```bash
npm run dev | npm run build | npm run lint | npm test
npm run check   # lint + test + build; run before considering a change done (Vercel's build command)
npm run tts
```
