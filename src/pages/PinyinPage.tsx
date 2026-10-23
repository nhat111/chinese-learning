import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ContentGate } from '../components/ContentGate';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { ToneQuestionView } from '../components/Questions';
import { Round } from '../components/Round';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { srsKey } from '../practice/decks';
import { shuffle, toneQuestion, toneTargets } from '../practice/quiz';
import { speakChinese } from '../speech';
import { usePrefs } from '../storage/prefs';
import { recordAnswer, useProgress } from '../storage/progress';
import type { PinyinLesson } from '../types';

export function PinyinPage() {
  const state = useContent('pinyin');
  const { srs } = useProgress();
  return (
    <div className="stack">
      <PageHeader title={vi.pinyin.title}>
        <p className="muted">{vi.pinyin.intro}</p>
      </PageHeader>
      <ContentGate state={state}>
        {(lessons) => (
          <ol className="list">
            {lessons.map((l, n) => {
              const heard = l.sounds.filter((_, i) => srs[srsKey.pinyin(l.id, i)]).length;
              return (
                <li key={l.id}>
                  <Link to={`/pinyin/${l.id}`} className="list-card">
                    <span className="list-num mono">{n + 1}</span>
                    <span className="list-card-text">
                      <span className="kicker">{vi.pinyin.kinds[l.kind]}</span>
                      <strong>{l.title}</strong>
                      <span className="muted small mono">
                        {heard}/{l.sounds.length} {vi.pinyin.heard}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={20} />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </ContentGate>
    </div>
  );
}

export function PinyinLessonPage() {
  const { id } = useParams();
  const state = useContent('pinyin');
  return (
    <ContentGate state={state}>
      {(lessons) => {
        const lesson = lessons.find((l) => l.id === id);
        if (!lesson) return <PageHeader title={vi.pinyin.title} back="/pinyin" />;
        const next = lessons[lessons.indexOf(lesson) + 1];
        return <Lesson lesson={lesson} next={next} />;
      }}
    </ContentGate>
  );
}

function Lesson({ lesson, next }: { lesson: PinyinLesson; next?: PinyinLesson }) {
  const [params, setParams] = useSearchParams();
  const targets = useMemo(() => toneTargets(lesson.sounds), [lesson]);
  const hasQuiz = targets.length >= 2;
  const tab = hasQuiz && params.get('tab') === 'quiz' ? 'quiz' : 'sounds';
  return (
    <div className="stack">
      <PageHeader title={lesson.title} back="/pinyin">
        <p className="muted">{lesson.intro}</p>
      </PageHeader>
      {hasQuiz && (
        <div className="tabs" role="tablist">
          {(['sounds', 'quiz'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' is-active' : ''}`} onClick={() => setParams(t === 'quiz' ? { tab: t } : {}, { replace: true })}>
              {t === 'sounds' ? vi.pinyin.tabSounds : vi.pinyin.tabQuiz}
            </button>
          ))}
        </div>
      )}
      {tab === 'sounds' ? <Sounds lesson={lesson} /> : <ToneRound lesson={lesson} />}
      {next && (
        <Link to={`/pinyin/${next.id}`} className="btn btn--ghost">
          {next.title}
          <Icon name="chevronRight" size={18} />
        </Link>
      )}
    </div>
  );
}

function Sounds({ lesson }: { lesson: PinyinLesson }) {
  const prefs = usePrefs();
  const { srs } = useProgress();
  return (
    <>
      <p className="muted small">{vi.pinyin.tapHint}</p>
      <div className="sound-grid">
        {lesson.sounds.map((s, i) => {
          const key = srsKey.pinyin(lesson.id, i);
          return (
            <button
              key={i}
              type="button"
              className={`sound-card${srs[key] ? ' is-heard' : ''}`}
              onClick={() => {
                void speakChinese(s.zh);
                if (!srs[key]) recordAnswer(key, true);
              }}
            >
              <span className="sound-label">{s.label}</span>
              <span className="sound-example">
                <span lang="zh-CN" className="zh">
                  {s.zh}
                </span>
                {prefs.showPinyin && <span className="pinyin">{s.pinyin}</span>}
                <span className="muted small">{s.vi}</span>
              </span>
              {s.tip && <span className="sound-tip">{s.tip}</span>}
              <span className="sound-play" aria-hidden>
                <Icon name="volume" size={18} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ToneRound({ lesson }: { lesson: PinyinLesson }) {
  const build = () => {
    const targets = toneTargets(lesson.sounds);
    // Repeat short lessons so a round has at least 6 questions.
    const list = targets.length >= 6 ? targets : [...targets, ...targets, ...targets].slice(0, 6);
    return shuffle(list).map(toneQuestion);
  };
  return (
    <Round
      key={lesson.id}
      build={build}
      render={(q, next, answered) => <ToneQuestionView question={q} onNext={next} onAnswer={answered} />}
    />
  );
}
