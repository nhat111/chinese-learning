import { useState } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '../components/Icon';
import { Welcome } from '../components/Welcome';
import { SpeakButton, ZhText } from '../components/Zh';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { planSize } from '../practice/plan';
import { seededRng } from '../practice/quiz';
import { dueKeys, greetingSlot, streak, totalStars, weekDays } from '../practice/stats';
import { todayKey } from '../srs/sm2';
import { usePrefs } from '../storage/prefs';
import { useProgress } from '../storage/progress';

const CARDS: { to: string; key: keyof typeof vi.home.cards; icon: IconName; tone: string; zh: string }[] = [
  { to: '/pinyin', key: 'pinyin', icon: 'music', tone: 'blue', zh: 'pīn' },
  { to: '/words', key: 'words', icon: 'cards', tone: 'amber', zh: '词' },
  { to: '/hanzi', key: 'hanzi', icon: 'pen', tone: 'red', zh: '字' },
  { to: '/phrases', key: 'phrases', icon: 'mic', tone: 'teal', zh: '说' },
  { to: '/games', key: 'games', icon: 'gamepad', tone: 'violet', zh: '玩' },
  { to: '/progress', key: 'progress', icon: 'chart', tone: 'green', zh: '星' },
];

function dayNumber(date: string): number {
  return Number(date.replaceAll('-', ''));
}

export function HomePage() {
  const prefs = usePrefs();
  const progress = useProgress();
  const words = useContent('words');
  const today = todayKey();
  const [hour] = useState(() => new Date().getHours());
  const greeting = vi.home.greetings[greetingSlot(hour)];
  const days = streak(progress.daily, today);
  const stars = totalStars(progress.daily);
  const goal = planSize(prefs.minutes);
  const done = progress.daily[today]?.planSteps ?? 0;
  const due = dueKeys(progress.srs, today, 'word:').length;
  const week = weekDays(today);

  const pool = words.status === 'ready' ? words.items.filter((w) => w.emoji && (prefs.learner === 'adult' || w.level === 1)) : [];
  const wordOfDay = pool.length > 0 ? pool[Math.floor(seededRng(dayNumber(today))() * pool.length)] : null;

  return (
    <div className="stack-lg">
      {!prefs.onboarded && <Welcome />}

      <section className="hero">
        <div className="hero-line">
          <p lang="zh-CN" className="hero-zh">
            {greeting.zh}
          </p>
          <SpeakButton text={greeting.zh} />
        </div>
        {prefs.showPinyin && <p className="pinyin">{greeting.pinyin}</p>}
        <p className="muted">{greeting.vi}</p>
        {(days > 0 || stars > 0) && (
          <div className="hero-stats">
            <span className="stat-pill stat-pill--flame">
              <Icon name="flame" size={18} />
              {vi.home.streak(days)}
            </span>
            <span className="stat-pill stat-pill--star">
              <Icon name="star" size={18} />
              {vi.home.stars(stars)}
            </span>
          </div>
        )}
      </section>

      <section className="card today stack-sm">
        <div className="row row--between">
          <h2>{vi.home.todayTitle}</h2>
          <span className="count-badge">{vi.home.todayProgress(Math.min(done, goal), goal)}</span>
        </div>
        <div className="bar" aria-hidden>
          <span style={{ width: `${Math.min(100, (done / goal) * 100)}%` }} />
        </div>
        <p className="muted">{done >= goal ? vi.home.todayDone : vi.home.todayText(prefs.minutes)}</p>
        <div className="week-dots" aria-label={vi.home.week}>
          {week.map((d, i) => {
            const active = (progress.daily[d]?.answers ?? 0) > 0;
            return (
              <span key={d} className={`week-dot${active ? ' is-on' : ''}${d === today ? ' is-today' : ''}`} title={d}>
                {vi.progress.weekday[i]}
              </span>
            );
          })}
        </div>
        <Link to="/daily" className="btn btn--primary btn--big">
          <Icon name="play" size={20} />
          {done > 0 ? vi.home.continueToday : vi.home.startToday}
        </Link>
        {due > 0 && (
          <Link to="/review" className="btn btn--ghost">
            <Icon name="repeat" size={18} />
            {vi.home.review(due)}
          </Link>
        )}
      </section>

      {wordOfDay && (
        <section className="card word-of-day">
          <p className="section-title">{vi.home.wordOfDay}</p>
          <div className="word-of-day-body">
            <span className="word-of-day-emoji" aria-hidden>
              {wordOfDay.emoji}
            </span>
            <div className="stack-xs">
              <ZhText zh={wordOfDay.zh} pinyin={wordOfDay.pinyin} hv={wordOfDay.hv} size="lg" />
              <p>{wordOfDay.vi}</p>
            </div>
          </div>
        </section>
      )}

      <section className="stack-sm">
        <p className="section-title">{vi.home.sections}</p>
        <div className="card-grid">
          {CARDS.map((c) => (
            <Link key={c.to} to={c.to} className="nav-card">
              <span className={`card-icon card-icon--${c.tone}`} aria-hidden>
                <Icon name={c.icon} />
              </span>
              <span className="nav-card-text">
                <strong>{vi.home.cards[c.key].title}</strong>
                <span className="muted small">{vi.home.cards[c.key].text}</span>
              </span>
              <span lang="zh-CN" className={`nav-card-zh tone-${c.tone}`} aria-hidden>
                {c.zh}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
