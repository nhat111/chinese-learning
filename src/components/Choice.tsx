import { useState, type ReactNode } from 'react';
import { vi } from '../i18n/vi';
import { playEffect } from '../speech';
import { Icon } from './Icon';

interface ChoiceProps {
  /** The question area (text, a speak button, a big character). */
  prompt: ReactNode;
  /** Rendered options, in display order. */
  options: ReactNode[];
  answer: number;
  /** Big picture tiles (emoji) instead of text rows. */
  tiles?: boolean;
  /** Shown under the options once answered (the right answer explained). */
  explain?: ReactNode;
  /** Called once with the first pick. */
  onAnswer: (right: boolean) => void;
  onNext: () => void;
  nextLabel?: string;
}

/**
 * One multiple-choice question: pick an option, see right/wrong with a short
 * cheer, then "Tiếp". The first pick counts.
 */
export function Choice({ prompt, options, answer, tiles, explain, onAnswer, onNext, nextLabel }: ChoiceProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [cheer] = useState(() => vi.feedback.right[Math.floor(Math.random() * vi.feedback.right.length)]);
  const done = picked !== null;
  const right = picked === answer;

  const pick = (i: number) => {
    if (done) return;
    setPicked(i);
    playEffect(i === answer ? 'right' : 'wrong');
    onAnswer(i === answer);
  };

  return (
    <div className="stack">
      <div className="question-prompt">{prompt}</div>
      <div className={tiles ? 'choice-tiles' : 'choice-list'} role="group">
        {options.map((opt, i) => {
          const state = !done ? '' : i === answer ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim';
          return (
            <button key={i} type="button" className={`choice${state}`} onClick={() => pick(i)} disabled={done && i !== answer && i !== picked}>
              {opt}
              {done && i === answer && (
                <span className="choice-mark" aria-hidden>
                  <Icon name="check" size={18} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {done && (
        <div className={`feedback ${right ? 'feedback--right' : 'feedback--wrong'}`} role="status">
          <p className="feedback-title">
            {right ? (
              <>
                <span className="star-pop" aria-hidden>
                  <Icon name="star" size={22} />
                </span>
                {cheer}
              </>
            ) : (
              vi.feedback.wrong
            )}
          </p>
          {explain}
          <button type="button" className="btn btn--primary" onClick={onNext}>
            {nextLabel ?? vi.common.next}
          </button>
        </div>
      )}
    </div>
  );
}
