import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { useContent } from '../data/content';
import { vi } from '../i18n/vi';
import { learnedCount, practicedCount, streak, totalStars, weekDays, type Skill } from '../practice/stats';
import { todayKey } from '../srs/sm2';
import { getProgress, importProgress, resetProgress, useProgress } from '../storage/progress';

const SKILLS: Skill[] = ['word', 'hanzi', 'phrase', 'pinyin'];

export function ProgressPage() {
  const progress = useProgress();
  const words = useContent('words');
  const hanzi = useContent('hanzi');
  const phrases = useContent('phrases');
  const pinyin = useContent('pinyin');
  const today = todayKey();
  const week = weekDays(today);
  const maxDay = Math.max(1, ...week.map((d) => progress.daily[d]?.answers ?? 0));
  const minutes = Math.round(Object.values(progress.daily).reduce((s, d) => s + d.recordMs, 0) / 60000);
  const totals: Record<Skill, number | null> = {
    word: words.status === 'ready' ? words.items.length : null,
    hanzi: hanzi.status === 'ready' ? hanzi.items.length : null,
    phrase: phrases.status === 'ready' ? phrases.items.length : null,
    pinyin: pinyin.status === 'ready' ? pinyin.items.reduce((s, l) => s + l.sounds.length, 0) : null,
  };

  return (
    <div className="stack-lg">
      <PageHeader title={vi.progress.title} />

      <div className="stat-grid">
        <div className="stat-tile stat-tile--star">
          <Icon name="star" />
          <strong className="mono">{totalStars(progress.daily)}</strong>
          <span>{vi.progress.stars}</span>
        </div>
        <div className="stat-tile stat-tile--flame">
          <Icon name="flame" />
          <strong className="mono">{streak(progress.daily, today)}</strong>
          <span>{vi.progress.streak}</span>
        </div>
        <div className="stat-tile">
          <Icon name="mic" />
          <strong className="mono">{minutes}</strong>
          <span>{vi.progress.minutes}</span>
        </div>
      </div>

      <section className="card stack-sm">
        <p className="section-title">{vi.progress.skills}</p>
        {SKILLS.map((s) => {
          const done = practicedCount(progress.srs, s);
          const total = totals[s];
          return (
            <div key={s} className="skill-row">
              <div className="row row--between">
                <span>{vi.progress.skill[s]}</span>
                <span className="mono small">
                  {done}
                  {total !== null && `/${total}`}
                </span>
              </div>
              <div className="bar" aria-hidden>
                <span style={{ width: `${total ? Math.min(100, (done / total) * 100) : 0}%` }} />
              </div>
              {s === 'word' && <span className="muted small">{vi.progress.learned(learnedCount(progress.srs, 'word', today))}</span>}
            </div>
          );
        })}
      </section>

      <section className="card stack-sm">
        <p className="section-title">{vi.progress.week}</p>
        <div className="week-chart" role="img" aria-label={week.map((d, i) => `${vi.progress.weekday[i]}: ${progress.daily[d]?.answers ?? 0}`).join(', ')}>
          {week.map((d, i) => {
            const n = progress.daily[d]?.answers ?? 0;
            return (
              <div key={d} className={`week-col${d === today ? ' is-today' : ''}`} title={vi.progress.dayAnswers(n)}>
                <span className="week-val mono">{n > 0 ? n : ''}</span>
                <span className="week-bar" style={{ height: `${(n / maxDay) * 100}%` }} />
                <span className="week-label">{vi.progress.weekday[i]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <Backup />
    </div>
  );
}

function Backup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(getProgress())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zhongvui-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const restore = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!window.confirm(vi.progress.importConfirm)) return;
      setMessage(importProgress(data) ? vi.progress.importDone : vi.progress.importBad);
    } catch {
      setMessage(vi.progress.importBad);
    }
  };

  return (
    <section className="card stack-sm">
      <p className="section-title">{vi.progress.backup}</p>
      <p className="muted small">{vi.progress.backupText}</p>
      <div className="row row--wrap">
        <button type="button" className="btn" onClick={download}>
          <Icon name="download" size={18} />
          {vi.progress.export}
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          {vi.progress.import}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void restore(f);
            e.target.value = '';
          }}
        />
      </div>
      {message && <p role="status">{message}</p>}
      <button
        type="button"
        className="link-btn link-btn--danger"
        onClick={() => {
          if (window.confirm(vi.progress.resetConfirm)) resetProgress();
        }}
      >
        {vi.progress.reset}
      </button>
    </section>
  );
}
