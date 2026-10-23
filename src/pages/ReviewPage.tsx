import { useState } from 'react';
import { Link } from 'react-router';
import { ContentGate } from '../components/ContentGate';
import { PageHeader } from '../components/Layout';
import { StatusPanel } from '../components/StatusPanel';
import { WordCard } from '../components/WordCard';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { srsKey } from '../practice/decks';
import { dueKeys } from '../practice/stats';
import { todayKey } from '../srs/sm2';
import { getProgress } from '../storage/progress';
import type { WordItem } from '../types';

export function ReviewPage() {
  const state = useContent('words');
  return (
    <div className="stack">
      <PageHeader title={vi.review.title} back="/">
        <p className="muted">{vi.review.intro}</p>
      </PageHeader>
      <ContentGate state={state}>{(words) => <ReviewDeck words={words} />}</ContentGate>
    </div>
  );
}

function ReviewDeck({ words }: { words: WordItem[] }) {
  // The due list is fixed when the page opens, so rated cards don't reshuffle it.
  const [deck] = useState(() => {
    const byKey = new Map(words.map((w) => [srsKey.word(w.id), w]));
    return dueKeys(getProgress().srs, todayKey(), 'word:').flatMap((k) => byKey.get(k) ?? []);
  });
  const [index, setIndex] = useState(0);

  if (deck.length === 0) {
    return (
      <StatusPanel kind="empty" title={vi.review.empty}>
        <Link to="/words" className="btn btn--primary">
          {vi.words.title}
        </Link>
      </StatusPanel>
    );
  }
  if (index >= deck.length) {
    return (
      <StatusPanel kind="done" title={vi.review.done}>
        <Link to="/" className="btn btn--primary">
          {vi.daily.home}
        </Link>
      </StatusPanel>
    );
  }
  return (
    <div className="stack-sm">
      <span className="count-badge">{vi.common.of(index + 1, deck.length)}</span>
      <WordCard key={index} word={deck[index]} onRated={() => setIndex((i) => i + 1)} />
    </div>
  );
}
