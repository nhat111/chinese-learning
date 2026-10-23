import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentGate } from '../components/ContentGate';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { MeaningQuestion, PictureQuestion, ToneQuestionView } from '../components/Questions';
import { Round } from '../components/Round';
import { StatusPanel } from '../components/StatusPanel';
import { useContent, type ContentState } from '../data/content';
import { vi } from '../i18n/vi';
import { srsKey } from '../practice/decks';
import { meaningQuestion, pickRound, pictureQuestion, shuffle, toneQuestion, toneTargets } from '../practice/quiz';
import { todayKey } from '../srs/sm2';
import { playEffect, speakChinese } from '../speech';
import { usePrefs } from '../storage/prefs';
import { getProgress, recordAnswer } from '../storage/progress';
import type { HanziItem, WordItem } from '../types';

const GAMES: { kind: string; icon: IconName; tone: string }[] = [
  { kind: 'picture', icon: 'headphones', tone: 'teal' },
  { kind: 'meaning', icon: 'book', tone: 'amber' },
  { kind: 'tone', icon: 'music', tone: 'blue' },
  { kind: 'match', icon: 'puzzle', tone: 'violet' },
];

const ROUND = 10;

export function GamesPage() {
  return (
    <div className="stack">
      <PageHeader title={vi.games.title}>
        <p className="muted">{vi.games.intro}</p>
      </PageHeader>
      <div className="card-grid">
        {GAMES.map((g) => (
          <Link key={g.kind} to={`/games/${g.kind}`} className="nav-card">
            <span className={`card-icon card-icon--${g.tone}`} aria-hidden>
              <Icon name={g.icon} />
            </span>
            <span className="nav-card-text">
              <strong>{vi.games.list[g.kind].title}</strong>
              <span className="muted small">{vi.games.list[g.kind].text}</span>
            </span>
          </Link>
        ))}
      </div>
      <Link to="/phrases" className="list-card">
        <span className="card-icon card-icon--red" aria-hidden>
          <Icon name="mic" />
        </span>
        <span className="list-card-text">
          <strong>{vi.home.cards.phrases.title}</strong>
          <span className="muted small">{vi.home.cards.phrases.text}</span>
        </span>
        <Icon name="chevronRight" size={20} />
      </Link>
    </div>
  );
}

function both<A, B>(a: ContentState<A>, b: ContentState<B>): ContentState<[A[], B[]]> {
  if (a.status === 'error') return a;
  if (b.status === 'error') return b;
  if (a.status === 'loading' || b.status === 'loading') return { status: 'loading' };
  return { status: 'ready', items: [[a.items, b.items]] };
}

export function GamePlayPage() {
  const { kind = '' } = useParams();
  const words = useContent('words');
  const hanzi = useContent('hanzi');
  const known = GAMES.some((g) => g.kind === kind);
  return (
    <div className="stack">
      <PageHeader title={known ? vi.games.list[kind].title : vi.games.title} back="/games" />
      {!known ? (
        <StatusPanel kind="empty" title={vi.games.unknown} />
      ) : (
        <ContentGate state={both(words, hanzi)}>{(data) => <Game kind={kind} words={data[0][0]} hanzi={data[0][1]} />}</ContentGate>
      )}
    </div>
  );
}

function Game({ kind, words, hanzi }: { kind: string; words: WordItem[]; hanzi: HanziItem[] }) {
  const prefs = usePrefs();
  const [match, setMatch] = useState(0);
  const pool = prefs.learner === 'kid' ? words.filter((w) => w.level <= 2) : words;
  const key = `${kind}-${prefs.learner}`;

  if (kind === 'match') return <MatchGame key={`${key}-${match}`} words={pool} onAgain={() => setMatch((m) => m + 1)} />;
  if (kind === 'tone') {
    const build = () => {
      const targets = toneTargets([...pool, ...hanzi.map((h) => ({ ...h, zh: h.char }))]);
      return pickRound(targets, (t) => srsKey.tone(t.zh), getProgress().srs, todayKey(), ROUND).map(toneQuestion);
    };
    return <Round key={key} build={build} render={(q, next, answered) => <ToneQuestionView question={q} onNext={next} onAnswer={answered} />} />;
  }
  const build = () => {
    const { srs } = getProgress();
    const today = todayKey();
    if (kind === 'picture') {
      const withPic = pool.filter((w) => w.emoji);
      return pickRound(withPic, (w) => srsKey.pic(w.id), srs, today, ROUND).map((w) => pictureQuestion(w, withPic));
    }
    return pickRound(pool, (w) => srsKey.mean(w.id), srs, today, ROUND).map((w) => meaningQuestion(w, pool));
  };
  return (
    <Round
      key={key}
      build={build}
      render={(q, next, answered) =>
        kind === 'picture' ? (
          <PictureQuestion question={q} onNext={next} onAnswer={answered} />
        ) : (
          <MeaningQuestion question={q} onNext={next} onAnswer={answered} />
        )
      }
    />
  );
}

const PAIRS = 6;

/** Tap a character, then its picture (children) or meaning (adults). */
function MatchGame({ words, onAgain }: { words: WordItem[]; onAgain: () => void }) {
  const prefs = usePrefs();
  const pictures = prefs.learner === 'kid';
  const [board] = useState(() => {
    const candidates = pictures ? words.filter((w) => w.emoji) : words;
    const picked: WordItem[] = [];
    const seen = new Set<string>();
    for (const w of pickRound(candidates, (x) => srsKey.mean(x.id), getProgress().srs, todayKey(), candidates.length)) {
      const label = pictures ? w.emoji! : w.vi;
      if (seen.has(label)) continue;
      seen.add(label);
      picked.push(w);
      if (picked.length === PAIRS) break;
    }
    return { left: shuffle(picked), right: shuffle(picked) };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [missed, setMissed] = useState<Set<string>>(new Set());

  if (matched.size === board.left.length) {
    return (
      <StatusPanel kind="done" title={vi.games.matchDone(missed.size)}>
        <button type="button" className="btn btn--primary" onClick={onAgain}>
          {vi.common.again}
        </button>
      </StatusPanel>
    );
  }

  const pickRight = (w: WordItem) => {
    if (!selected || matched.has(w.id)) return;
    if (w.id === selected) {
      recordAnswer(srsKey.mean(w.id), !missed.has(w.id));
      playEffect('right');
      setMatched(new Set(matched).add(w.id));
      setSelected(null);
    } else {
      playEffect('wrong');
      setMissed(new Set(missed).add(selected));
      setWrong(w.id);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="stack-sm">
      <p className="question-text">{vi.games.matchQ}</p>
      <div className="match">
        <div className="match-col">
          {board.left.map((w) => (
            <button
              key={w.id}
              type="button"
              lang="zh-CN"
              className={`match-item match-item--zh${selected === w.id ? ' is-selected' : ''}${matched.has(w.id) ? ' is-matched' : ''}`}
              disabled={matched.has(w.id)}
              onClick={() => {
                setSelected(w.id);
                void speakChinese(w.zh);
              }}
            >
              {w.zh}
            </button>
          ))}
        </div>
        <div className="match-col">
          {board.right.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`match-item${pictures ? ' match-item--emoji' : ''}${matched.has(w.id) ? ' is-matched' : ''}${wrong === w.id ? ' is-wrong' : ''}`}
              disabled={matched.has(w.id)}
              onClick={() => pickRight(w)}
              aria-label={w.vi}
            >
              {pictures ? w.emoji : w.vi}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
