import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { ContentGate } from '../components/ContentGate';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { SpeakPractice } from '../components/SpeakPractice';
import { ZhText } from '../components/Zh';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { PHRASE_TOPICS, srsKey } from '../practice/decks';
import { useProgress } from '../storage/progress';
import type { PhraseItem } from '../types';

export function PhrasesPage() {
  const state = useContent('phrases');
  const [params, setParams] = useSearchParams();
  const topic = params.get('topic') ?? PHRASE_TOPICS[0];
  return (
    <div className="stack">
      <PageHeader title={vi.phrases.title} back="/">
        <p className="muted">{vi.phrases.intro}</p>
      </PageHeader>
      <div className="chips chips--scroll" role="tablist">
        {PHRASE_TOPICS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={topic === t} className={`chip${topic === t ? ' is-active' : ''}`} onClick={() => setParams({ topic: t }, { replace: true })}>
            {vi.phraseTopics[t]}
          </button>
        ))}
      </div>
      <ContentGate state={state}>
        {(items) => (
          <ul className="list">
            {items
              .filter((p) => p.topic === topic)
              .map((p) => (
                <PhraseRow key={p.id} phrase={p} />
              ))}
          </ul>
        )}
      </ContentGate>
    </div>
  );
}

function PhraseRow({ phrase }: { phrase: PhraseItem }) {
  const [open, setOpen] = useState(false);
  const { srs } = useProgress();
  const done = srs[srsKey.phrase(phrase.id)] !== undefined;
  return (
    <li className={`card phrase${done ? ' is-done' : ''}`}>
      <div className="phrase-head">
        <ZhText zh={phrase.zh} pinyin={phrase.pinyin} size="md" />
        <button type="button" className="icon-btn" aria-expanded={open} aria-label={vi.speaking.say} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'x' : 'mic'} size={20} />
        </button>
      </div>
      <p>{phrase.vi}</p>
      {phrase.note && <p className="note small">{phrase.note}</p>}
      {open && <SpeakPractice text={phrase.zh} srsKey={srsKey.phrase(phrase.id)} />}
    </li>
  );
}
