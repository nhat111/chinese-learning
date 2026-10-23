import { useState } from 'react';
import { Link } from 'react-router';
import { ContentGate } from '../components/ContentGate';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { MeaningQuestion, PictureQuestion, ToneQuestionView } from '../components/Questions';
import { SpeakPractice } from '../components/SpeakPractice';
import { StatusPanel } from '../components/StatusPanel';
import { WordCard } from '../components/WordCard';
import { ZhText } from '../components/Zh';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { srsKey } from '../practice/decks';
import { buildDailyPlan, type PlanContent, type PlanStep } from '../practice/plan';
import { todayKey } from '../srs/sm2';
import { usePrefs } from '../storage/prefs';
import { getProgress, savePlanStep } from '../storage/progress';
import { HanziPractice } from './HanziPage';

export function DailyPage() {
  const words = useContent('words');
  const phrases = useContent('phrases');
  const hanzi = useContent('hanzi');
  return (
    <div className="stack">
      <PageHeader title={vi.daily.title} back="/" />
      <ContentGate state={words}>
        {(w) => (
          <ContentGate state={phrases}>
            {(p) => <ContentGate state={hanzi}>{(h) => <Session content={{ words: w, phrases: p, hanzi: h }} />}</ContentGate>}
          </ContentGate>
        )}
      </ContentGate>
    </div>
  );
}

function Session({ content }: { content: PlanContent }) {
  const [session, setSession] = useState(0);
  return <Steps key={session} content={content} onMore={() => setSession((s) => s + 1)} />;
}

function Steps({ content, onMore }: { content: PlanContent; onMore: () => void }) {
  const prefs = usePrefs();
  // Built once per session: answering must not reshuffle the remaining steps.
  const [steps] = useState(() => buildDailyPlan(content, getProgress().srs, todayKey(), prefs.minutes, prefs.learner));
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);

  const next = () => setIndex((i) => i + 1);
  const complete = (good: boolean) => {
    savePlanStep();
    if (good) setStars((s) => s + 1);
  };

  if (index >= steps.length) {
    return (
      <StatusPanel kind="done" title={vi.daily.doneTitle}>
        <p>{vi.daily.doneText(stars)}</p>
        <div className="row row--center">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onMore}
          >
            {vi.daily.more}
          </button>
          <Link to="/" className="btn btn--ghost">
            {vi.daily.home}
          </Link>
        </div>
      </StatusPanel>
    );
  }

  const step = steps[index];
  return (
    <div className="stack">
      <div className="round-head">
        <span className="count-badge">{vi.daily.step(index + 1, steps.length)}</span>
        <div className="bar bar--thin" aria-hidden>
          <span style={{ width: `${(index / steps.length) * 100}%` }} />
        </div>
        <span className="round-stars">
          <Icon name="star" size={16} />
          <span className="mono">{stars}</span>
        </span>
      </div>
      <p className="kicker">{vi.daily.kinds[step.kind]}</p>
      <div key={index}>
        <StepView step={step} onComplete={complete} onNext={next} />
      </div>
    </div>
  );
}

function StepView({ step, onComplete, onNext }: { step: PlanStep; onComplete: (good: boolean) => void; onNext: () => void }) {
  const [done, setDone] = useState(false);
  const finish = (good: boolean) => {
    if (done) return;
    setDone(true);
    onComplete(good);
  };

  switch (step.kind) {
    case 'word':
      return (
        <WordCard
          word={step.item}
          onRated={(g) => {
            finish(g >= 3);
            onNext();
          }}
        />
      );
    case 'picture':
      return <PictureQuestion question={step.question} onAnswer={finish} onNext={onNext} />;
    case 'meaning':
      return <MeaningQuestion question={step.question} onAnswer={finish} onNext={onNext} />;
    case 'tone':
      return <ToneQuestionView question={step.question} onAnswer={finish} onNext={onNext} />;
    case 'hanzi':
      return (
        <div className="stack">
          <div className="center stack-xs">
            <ZhText zh={step.item.char} pinyin={step.item.pinyin} size="lg" />
            <p>{step.item.vi}</p>
          </div>
          <HanziPractice item={step.item} onDone={(m) => finish(m <= 2)} />
          <NextRow done={done} onNext={onNext} />
        </div>
      );
    case 'phrase':
      return (
        <div className="stack">
          <div className="card stack-xs">
            <ZhText zh={step.item.zh} pinyin={step.item.pinyin} size="lg" />
            <p>{step.item.vi}</p>
            {step.item.note && <p className="note small">{step.item.note}</p>}
          </div>
          <SpeakPractice text={step.item.zh} srsKey={srsKey.phrase(step.item.id)} onRated={(g) => finish(g >= 3)} />
          <NextRow done={done} onNext={onNext} />
        </div>
      );
  }
}

/** "Tiếp" once the step is done; "Bỏ qua" before that (skips don't count toward the goal). */
function NextRow({ done, onNext }: { done: boolean; onNext: () => void }) {
  return (
    <div className="row row--center">
      {done ? (
        <button type="button" className="btn btn--primary btn--grow" onClick={onNext}>
          {vi.common.next}
        </button>
      ) : (
        <button type="button" className="btn btn--ghost" onClick={onNext}>
          {vi.common.skip}
        </button>
      )}
    </div>
  );
}
