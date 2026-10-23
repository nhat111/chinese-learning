// The question types shared by the games, the daily lesson and the pinyin
// pages. Each one plays its sound when shown and saves the answer.

import { useEffect } from 'react';
import { vi } from '../i18n/vi';
import { srsKey } from '../practice/decks';
import { toneOf } from '../practice/pinyin';
import type { Question, ToneQuestion } from '../practice/quiz';
import { speakChinese } from '../speech';
import { usePrefs } from '../storage/prefs';
import { recordAnswer } from '../storage/progress';
import type { WordItem } from '../types';
import { Choice } from './Choice';
import { Icon } from './Icon';
import { ZhText } from './Zh';

interface Props<Q> {
  question: Q;
  onNext: () => void;
  /** Called with the first pick (e.g. to count the round's score). */
  onAnswer?: (right: boolean) => void;
  nextLabel?: string;
}

function ReplayButton({ text }: { text: string }) {
  return (
    <button type="button" className="play-big" onClick={() => void speakChinese(text)} aria-label={vi.tone.replay}>
      <Icon name="volume" size={40} />
    </button>
  );
}

/** Hear a word, pick its picture. */
export function PictureQuestion({ question, onNext, onAnswer, nextLabel }: Props<Question<WordItem>>) {
  const { target } = question;
  useEffect(() => {
    void speakChinese(target.zh);
  }, [target]);
  return (
    <Choice
      key={target.id}
      prompt={
        <>
          <p className="question-text">{vi.games.pictureQ}</p>
          <ReplayButton text={target.zh} />
        </>
      }
      tiles
      options={question.options.map((o) => (
        <span key={o.id} className="tile-emoji" aria-label={o.vi}>
          {o.emoji}
        </span>
      ))}
      answer={question.answer}
      explain={<ZhText zh={target.zh} pinyin={target.pinyin} hv={target.hv} size="md" />}
      onAnswer={(right) => {
        recordAnswer(srsKey.pic(target.id), right);
        onAnswer?.(right);
      }}
      onNext={onNext}
      nextLabel={nextLabel}
    />
  );
}

/** See a word, pick its meaning. */
export function MeaningQuestion({ question, onNext, onAnswer, nextLabel }: Props<Question<WordItem>>) {
  const { target } = question;
  const prefs = usePrefs();
  return (
    <Choice
      key={target.id}
      prompt={
        <>
          <p className="question-text">{vi.games.meaningQ}</p>
          <ZhText zh={target.zh} pinyin={target.pinyin} size="xl" />
        </>
      }
      options={question.options.map((o) => (
        <span key={o.id}>{o.vi}</span>
      ))}
      answer={question.answer}
      explain={
        target.hv && prefs.showHanViet ? (
          <p className="muted">
            {vi.common.hanViet}: {target.hv}
          </p>
        ) : undefined
      }
      onAnswer={(right) => {
        recordAnswer(srsKey.mean(target.id), right);
        onAnswer?.(right);
      }}
      onNext={onNext}
      nextLabel={nextLabel}
    />
  );
}

/** Hear one syllable, pick its tone. */
export function ToneQuestionView({ question, onNext, onAnswer, nextLabel }: Props<ToneQuestion>) {
  const { target } = question;
  useEffect(() => {
    void speakChinese(target.zh);
  }, [target]);
  const tone = toneOf(target.pinyin);
  return (
    <Choice
      key={target.zh}
      prompt={
        <>
          <p className="question-text">{vi.tone.question}</p>
          <ReplayButton text={target.zh} />
        </>
      }
      tiles
      options={question.options.map((o, i) => (
        <span key={o} className="tone-option">
          <ToneContour tone={i + 1} />
          <span className="tone-option-py">{o}</span>
          <span className="tone-option-name">{vi.tone.names[i]}</span>
        </span>
      ))}
      answer={question.answer}
      explain={
        <div className="stack-xs">
          <ZhText zh={target.zh} pinyin={target.pinyin} size="md" />
          <p className="muted">
            {target.vi} · {vi.tone.names[tone - 1]}: {vi.tone.shapes[tone - 1]}
          </p>
        </div>
      }
      onAnswer={(right) => {
        recordAnswer(srsKey.tone(target.zh), right);
        onAnswer?.(right);
      }}
      onNext={onNext}
      nextLabel={nextLabel}
    />
  );
}

/** The pitch shape of a tone on a 5-level scale (Chao tone letters 55, 35, 214, 51). */
export function ToneContour({ tone }: { tone: number }) {
  const paths: Record<number, string> = {
    1: 'M6 8 H42',
    2: 'M6 24 L42 8',
    3: 'M6 20 Q20 42 42 14',
    4: 'M6 8 L42 36',
  };
  return (
    <svg className="tone-contour" viewBox="0 0 48 44" width="48" height="44" aria-hidden>
      <path d="M4 40 H44" className="tone-contour-base" />
      <path d={paths[tone] ?? ''} className="tone-contour-line" />
    </svg>
  );
}
