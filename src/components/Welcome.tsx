import { useState } from 'react';
import { vi } from '../i18n/vi';
import { updatePrefs, usePrefs, type DailyMinutes, type Learner } from '../storage/prefs';

const MINUTES: DailyMinutes[] = [5, 10, 15];

/**
 * First run: who is learning and for how long. Kid mode hides the Hán Việt
 * reading and slows the voice down a little.
 */
export function Welcome() {
  const prefs = usePrefs();
  const [learner, setLearner] = useState<Learner>(prefs.learner);
  const [minutes, setMinutes] = useState<DailyMinutes>(prefs.minutes);

  const finish = () =>
    updatePrefs({
      onboarded: true,
      learner,
      minutes,
      showHanViet: learner === 'adult',
      speechRate: learner === 'kid' ? 0.8 : 0.9,
    });

  return (
    <section className="card welcome stack">
      <p lang="zh-CN" className="welcome-zh">
        你好！
      </p>
      <h2>{vi.welcome.title}</h2>
      <p className="muted">{vi.welcome.text}</p>

      <fieldset className="stack-xs">
        <legend className="label">{vi.welcome.who}</legend>
        <div className="option-grid">
          {(['kid', 'adult'] as const).map((l) => (
            <button key={l} type="button" className={`option${learner === l ? ' is-picked' : ''}`} aria-pressed={learner === l} onClick={() => setLearner(l)}>
              <span className="option-emoji" aria-hidden>
                {l === 'kid' ? '🧒' : '🧑'}
              </span>
              <strong>{l === 'kid' ? vi.welcome.kid : vi.welcome.adult}</strong>
              <span className="muted small">{l === 'kid' ? vi.welcome.kidText : vi.welcome.adultText}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="stack-xs">
        <legend className="label">{vi.welcome.minutes}</legend>
        <div className="chips">
          {MINUTES.map((m) => (
            <button key={m} type="button" className={`chip${minutes === m ? ' is-active' : ''}`} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
              {vi.welcome.minutesOption(m)}
            </button>
          ))}
        </div>
      </fieldset>

      {learner === 'kid' && <p className="note">{vi.welcome.parentNote}</p>}

      <div className="row">
        <button type="button" className="btn btn--primary btn--grow" onClick={finish}>
          {vi.welcome.start}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => updatePrefs({ onboarded: true })}>
          {vi.welcome.skip}
        </button>
      </div>
    </section>
  );
}
