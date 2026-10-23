import { useEffect, useState } from 'react';
import { vi } from '../i18n/vi';
import { srsKey } from '../practice/decks';
import { speakChinese } from '../speech';
import type { Grade } from '../srs/sm2';
import { usePrefs } from '../storage/prefs';
import { rateItem } from '../storage/progress';
import type { WordItem } from '../types';
import { SpeakButton } from './Zh';

/**
 * A flashcard: picture, character and pinyin on the front (read aloud when
 * shown), meaning and Hán Việt on the back, then a 3-level self-rating.
 */
export function WordCard({ word, onRated }: { word: WordItem; onRated: (grade: Grade) => void }) {
  const prefs = usePrefs();
  const [flipped, setFlipped] = useState(false);

  // Parents key the card by word, so state starts fresh for each word.
  useEffect(() => {
    void speakChinese(word.zh);
  }, [word]);

  const rate = (grade: Grade) => {
    rateItem(srsKey.word(word.id), grade);
    onRated(grade);
  };

  return (
    <div className="stack">
      <button
        type="button"
        className={`flashcard${flipped ? ' is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? word.vi : vi.words.flipHint}
      >
        {word.emoji && <span className="flashcard-emoji" aria-hidden>{word.emoji}</span>}
        {prefs.showPinyin && <span className="pinyin pinyin--lg">{word.pinyin}</span>}
        <span lang="zh-CN" className="flashcard-zh">
          {word.zh}
        </span>
        {flipped ? (
          <span className="flashcard-back">
            <span className="flashcard-vi">{word.vi}</span>
            {word.hv && prefs.showHanViet && (
              <span className="hv">
                {vi.common.hanViet}: {word.hv}
              </span>
            )}
          </span>
        ) : (
          <span className="flashcard-hint">{vi.words.flipHint}</span>
        )}
      </button>
      <div className="row row--center">
        <SpeakButton text={word.zh} />
        <SpeakButton text={word.zh} rate={0.6} label={vi.speaking.slow} small />
      </div>
      {flipped && (
        <div className="stack-xs">
          <p className="muted center">{vi.rate.question}</p>
          <div className="rate-row">
            <button type="button" className="btn rate rate--bad" onClick={() => rate(1)}>
              {vi.rate.forgot}
            </button>
            <button type="button" className="btn rate rate--ok" onClick={() => rate(3)}>
              {vi.rate.hard}
            </button>
            <button type="button" className="btn rate rate--good" onClick={() => rate(4)}>
              {vi.rate.good}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
