import { useState, type ReactNode } from 'react';
import { vi } from '../i18n/vi';
import { Icon } from './Icon';
import { StatusPanel } from './StatusPanel';

interface Props<Q> {
  /** Builds a round's questions; called again for "Chơi lại". */
  build: () => Q[];
  /** Renders question i; call next() to move on and answered(right) on the first pick. */
  render: (q: Q, next: () => void, answered: (right: boolean) => void) => ReactNode;
  extraActions?: ReactNode;
}

/** A round of questions with a step counter and a score screen at the end. */
export function Round<Q>({ build, render, extraActions }: Props<Q>) {
  const [questions, setQuestions] = useState(build);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const again = () => {
    setQuestions(build());
    setIndex(0);
    setRight(0);
  };

  if (questions.length === 0) return <StatusPanel kind="empty" />;
  if (index >= questions.length) {
    return (
      <StatusPanel kind="done" title={vi.games.result(right, questions.length)}>
        <p className="stars-row" aria-label={vi.home.stars(right)}>
          {Array.from({ length: questions.length }, (_, i) => (
            <span key={i} className={i < right ? 'star is-on' : 'star'}>
              <Icon name="star" size={22} />
            </span>
          ))}
        </p>
        <div className="row row--center">
          <button type="button" className="btn btn--primary" onClick={again}>
            {vi.common.again}
          </button>
          {extraActions}
        </div>
      </StatusPanel>
    );
  }
  return (
    <div className="stack">
      <div className="round-head">
        <span className="count-badge">{vi.common.of(index + 1, questions.length)}</span>
        <div className="bar bar--thin" aria-hidden>
          <span style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="round-stars">
          <Icon name="star" size={16} />
          <span className="mono">{right}</span>
        </span>
      </div>
      <div key={index}>
        {render(
          questions[index],
          () => setIndex((i) => i + 1),
          (ok) => ok && setRight((r) => r + 1),
        )}
      </div>
    </div>
  );
}
