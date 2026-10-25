import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentGate } from '../components/ContentGate';
import { HanziWriterBox } from '../components/HanziWriterBox';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { PictographStrip } from '../components/Pictograph';
import { ZhText } from '../components/Zh';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { HANZI_GROUPS, srsKey } from '../practice/decks';
import { pictographs } from '../practice/quiz';
import { playEffect } from '../speech';
import { usePrefs } from '../storage/prefs';
import { recordAnswer, useProgress } from '../storage/progress';
import type { HanziItem } from '../types';

export function HanziPage() {
  const state = useContent('hanzi');
  const { srs } = useProgress();
  return (
    <div className="stack">
      <PageHeader title={vi.hanzi.title}>
        <p className="muted">{vi.hanzi.intro}</p>
      </PageHeader>
      <ContentGate state={state}>
        {(items) => [
          <PictographIntro key="picto" count={pictographs(items).length} />,
          ...HANZI_GROUPS.map((g) => {
            const list = items.filter((h) => h.group === g);
            if (list.length === 0) return null;
            return (
              <section key={g} className="stack-sm">
                <p className="section-title">{vi.hanziGroups[g]}</p>
                <div className="char-grid">
                  {list.map((h) => (
                    <Link key={h.id} to={`/hanzi/${h.id}`} className={`char-tile${srs[srsKey.hanzi(h.id)] ? ' is-done' : ''}`}>
                      <span lang="zh-CN" className="char-tile-zh">
                        {h.char}
                      </span>
                      <span className="char-tile-vi">{h.vi.split(';')[0]}</span>
                      {h.sketch && (
                        <span className="char-tile-pic" aria-hidden>
                          {h.emoji}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          }),
        ]}
      </ContentGate>
    </div>
  );
}

const INTRO_PAIRS = [
  ['☀️', '日'],
  ['⛰️', '山'],
  ['🌳', '木'],
  ['🚶', '人'],
];

function PictographIntro({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <section className="card picto-intro stack-sm">
      <h2>{vi.hanzi.pictoTitle}</h2>
      <p className="picto-intro-row" aria-hidden>
        {INTRO_PAIRS.map(([emoji, char]) => (
          <span key={char}>
            {emoji} → <span lang="zh-CN">{char}</span>
          </span>
        ))}
      </p>
      <p className="muted">{vi.hanzi.pictoText(count)}</p>
      <Link to="/games/glyph" className="btn btn--primary">
        <Icon name="gamepad" size={18} />
        {vi.hanzi.pictoGame}
      </Link>
    </section>
  );
}

export function HanziDetailPage() {
  const { id } = useParams();
  const state = useContent('hanzi');
  return (
    <ContentGate state={state}>
      {(items) => {
        const i = items.findIndex((h) => h.id === id);
        if (i < 0) return <PageHeader title={vi.hanzi.title} back="/hanzi" />;
        return <HanziDetail key={items[i].id} item={items[i]} next={items[i + 1]} prev={items[i - 1]} />;
      }}
    </ContentGate>
  );
}

/** Watch the stroke order, then write it; the result is saved as hanzi:<id>. */
export function HanziPractice({
  item,
  onDone,
  initialMode = 'watch',
}: {
  item: HanziItem;
  onDone?: (mistakes: number) => void;
  initialMode?: 'watch' | 'practice';
}) {
  const [mode, setMode] = useState(initialMode);
  const [run, setRun] = useState(0);
  const [mistakes, setMistakes] = useState<number | null>(null);
  return (
    <div className="stack-sm">
      <div className="tabs" role="tablist">
        {(['watch', 'practice'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`tab${mode === m ? ' is-active' : ''}`}
            onClick={() => {
              setMistakes(null);
              setMode(m);
            }}
          >
            {m === 'watch' ? vi.hanzi.watch : vi.hanzi.practice}
          </button>
        ))}
      </div>
      {mode === 'practice' && <p className="muted small center">{vi.hanzi.practiceHint}</p>}
      <HanziWriterBox
        char={item.char}
        mode={mode}
        run={run}
        onComplete={(n) => {
          setMistakes(n);
          recordAnswer(srsKey.hanzi(item.id), n <= 2);
          playEffect(n <= 2 ? 'right' : 'wrong');
          onDone?.(n);
        }}
      />
      {mistakes !== null && (
        <div className={`feedback ${mistakes <= 2 ? 'feedback--right' : 'feedback--wrong'}`} role="status">
          <p className="feedback-title">{mistakes === 0 ? vi.hanzi.perfect : vi.hanzi.mistakes(mistakes)}</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setMistakes(null);
              setRun((r) => r + 1);
            }}
          >
            <Icon name="repeat" size={18} />
            {vi.hanzi.writeAgain}
          </button>
        </div>
      )}
    </div>
  );
}

function HanziDetail({ item, next, prev }: { item: HanziItem; next?: HanziItem; prev?: HanziItem }) {
  const prefs = usePrefs();
  return (
    <div className="stack">
      <PageHeader title={`${item.char} · ${item.vi}`} back="/hanzi" />
      <section className="card hanzi-info">
        {item.sketch ? (
          <PictographStrip item={item} />
        ) : item.emoji && (
          <span className="hanzi-emoji" aria-hidden>
            {item.emoji}
          </span>
        )}
        <ZhText zh={item.char} pinyin={item.pinyin} size="xl" />
        {item.kind && (
          <p className="small">
            <span className="kind-badge">{vi.hanzi.kinds[item.kind].name}</span> <span className="muted">{vi.hanzi.kinds[item.kind].text}</span>
          </p>
        )}
        <p>
          <strong>{item.vi}</strong>
          {prefs.showHanViet && (
            <span className="muted">
              {' '}
              · {vi.common.hanViet}: {item.hv}
            </span>
          )}
        </p>
        {item.note && (
          <p className="note">
            <strong>{vi.hanzi.origin}:</strong> {item.note}
          </p>
        )}
      </section>

      <HanziPractice item={item} />

      <section className="stack-sm">
        <p className="section-title">{vi.hanzi.words}</p>
        <ul className="list">
          {item.words.map((w) => (
            <li key={w.zh} className="word-row">
              <ZhText zh={w.zh} pinyin={w.pinyin} size="sm" />
              <span className="word-row-vi">{w.vi}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="row row--between">
        {prev ? (
          <Link to={`/hanzi/${prev.id}`} className="btn btn--ghost" lang="zh-CN">
            <Icon name="arrowLeft" size={18} /> {prev.char}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/hanzi/${next.id}`} className="btn btn--ghost" lang="zh-CN">
            {next.char} <Icon name="chevronRight" size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}
