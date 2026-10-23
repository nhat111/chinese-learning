import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ContentGate } from '../components/ContentGate';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { MeaningQuestion, PictureQuestion } from '../components/Questions';
import { Round } from '../components/Round';
import { StatusPanel } from '../components/StatusPanel';
import { WordCard } from '../components/WordCard';
import { ZhText } from '../components/Zh';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { srsKey, WORD_TOPICS } from '../practice/decks';
import { meaningQuestion, pickRound, pictureQuestion, type Question } from '../practice/quiz';
import { todayKey } from '../srs/sm2';
import { getProgress, useProgress } from '../storage/progress';
import { usePrefs } from '../storage/prefs';
import type { WordItem } from '../types';

export function WordsPage() {
  const state = useContent('words');
  const { srs } = useProgress();
  return (
    <div className="stack">
      <PageHeader title={vi.words.title}>
        <p className="muted">{vi.words.intro}</p>
      </PageHeader>
      <ContentGate state={state}>
        {(words) => (
          <div className="topic-grid">
            {WORD_TOPICS.map((t) => {
              const list = words.filter((w) => w.topic === t);
              if (list.length === 0) return null;
              const learned = list.filter((w) => srs[srsKey.word(w.id)]).length;
              const cover = list.find((w) => w.emoji)?.emoji;
              return (
                <Link key={t} to={`/words/${t}`} className="topic-card">
                  <span className="topic-emoji" aria-hidden>
                    {cover}
                  </span>
                  <strong>{vi.topics[t]}</strong>
                  <span className="muted small mono">{vi.words.learned(learned, list.length)}</span>
                  <span className="bar bar--thin" aria-hidden>
                    <span style={{ width: `${(learned / list.length) * 100}%` }} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </ContentGate>
    </div>
  );
}

type Tab = 'list' | 'cards' | 'quiz';

export function WordTopicPage() {
  const { topic = '' } = useParams();
  const state = useContent('words');
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'list' ? 'list' : params.get('tab') === 'quiz' ? 'quiz' : 'cards';
  return (
    <div className="stack">
      <PageHeader title={vi.topics[topic] ?? vi.words.title} back="/words" />
      <div className="tabs" role="tablist">
        {(['cards', 'list', 'quiz'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' is-active' : ''}`} onClick={() => setParams(t === 'cards' ? {} : { tab: t }, { replace: true })}>
            {t === 'cards' ? vi.words.tabCards : t === 'list' ? vi.words.tabList : vi.words.tabQuiz}
          </button>
        ))}
      </div>
      <ContentGate state={state}>
        {(all) => {
          const words = all.filter((w) => w.topic === topic);
          if (words.length === 0) return <StatusPanel kind="empty" />;
          if (tab === 'list') return <WordList words={words} />;
          if (tab === 'quiz') return <TopicQuiz words={words} all={all} />;
          return <Deck words={words} />;
        }}
      </ContentGate>
    </div>
  );
}

function WordList({ words }: { words: WordItem[] }) {
  return (
    <ul className="list">
      {words.map((w) => (
        <li key={w.id} className="word-row">
          <span className="word-row-emoji" aria-hidden>
            {w.emoji ?? ''}
          </span>
          <ZhText zh={w.zh} pinyin={w.pinyin} hv={w.hv} size="sm" />
          <span className="word-row-vi">{w.vi}</span>
        </li>
      ))}
    </ul>
  );
}

function Deck({ words }: { words: WordItem[] }) {
  // Due cards first, then new ones; fixed for one pass through the deck.
  const build = () => pickRound(words, (w) => srsKey.word(w.id), getProgress().srs, todayKey(), words.length);
  const [order, setOrder] = useState(build);
  const [index, setIndex] = useState(0);
  if (index >= order.length) {
    return (
      <StatusPanel kind="done" title={vi.words.deckDone}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setIndex(0);
            setOrder(build());
          }}
        >
          {vi.words.restart}
        </button>
      </StatusPanel>
    );
  }
  return (
    <div className="stack-sm">
      <div className="round-head">
        <span className="count-badge">{vi.common.of(index + 1, order.length)}</span>
        <div className="bar bar--thin" aria-hidden>
          <span style={{ width: `${(index / order.length) * 100}%` }} />
        </div>
      </div>
      <WordCard key={`${order[index].id}-${index}`} word={order[index]} onRated={() => setIndex((i) => i + 1)} />
    </div>
  );
}

function TopicQuiz({ words, all }: { words: WordItem[]; all: WordItem[] }) {
  const prefs = usePrefs();
  const withPicture = words.filter((w) => w.emoji);
  const pictures = prefs.learner === 'kid' && withPicture.length >= 4;
  const build = () => {
    const today = todayKey();
    const { srs } = getProgress();
    if (pictures) {
      const pool = all.filter((w) => w.emoji);
      return pickRound(withPicture, (w) => srsKey.pic(w.id), srs, today, 10).map((w) => ({ kind: 'pic' as const, q: pictureQuestion(w, pool) }));
    }
    return pickRound(words, (w) => srsKey.mean(w.id), srs, today, 10).map((w) => ({ kind: 'mean' as const, q: meaningQuestion(w, all) }));
  };
  return (
    <Round<{ kind: 'pic' | 'mean'; q: Question<WordItem> }>
      key={`${words[0].topic}-${pictures}`}
      build={build}
      extraActions={
        <Link to="/words" className="btn btn--ghost">
          <Icon name="cards" size={18} />
          {vi.words.title}
        </Link>
      }
      render={(item, next, answered) =>
        item.kind === 'pic' ? (
          <PictureQuestion question={item.q} onNext={next} onAnswer={answered} />
        ) : (
          <MeaningQuestion question={item.q} onNext={next} onAnswer={answered} />
        )
      }
    />
  );
}
