import { useState } from 'react';
import { PageHeader } from '../components/Layout';
import { vi } from '../i18n/vi';
import { checkForUpdate } from '../registerSW';
import { VOICE_SAMPLE } from '../speaking/audioKey';
import { hasDeviceChineseVoice, speakChinese } from '../speech';
import { updatePrefs, usePrefs, type DailyMinutes } from '../storage/prefs';

const SPEEDS = [0.6, 0.75, 0.9, 1];

export function SettingsPage() {
  const prefs = usePrefs();
  const [update, setUpdate] = useState<string | null>(null);

  return (
    <div className="stack-lg">
      <PageHeader title={vi.settings.title} />

      <section className="card stack-sm">
        <p className="section-title">{vi.settings.learner}</p>
        <div className="chips">
          {(['kid', 'adult'] as const).map((l) => (
            <button key={l} type="button" className={`chip${prefs.learner === l ? ' is-active' : ''}`} aria-pressed={prefs.learner === l} onClick={() => updatePrefs({ learner: l, showHanViet: l === 'adult' })}>
              {l === 'kid' ? vi.settings.kid : vi.settings.adult}
            </button>
          ))}
        </div>
        <p className="label">{vi.settings.minutes}</p>
        <div className="chips">
          {([5, 10, 15] as DailyMinutes[]).map((m) => (
            <button key={m} type="button" className={`chip${prefs.minutes === m ? ' is-active' : ''}`} aria-pressed={prefs.minutes === m} onClick={() => updatePrefs({ minutes: m })}>
              {vi.welcome.minutesOption(m)}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack-sm">
        <p className="section-title">{vi.settings.display}</p>
        {(
          [
            ['showPinyin', vi.settings.showPinyin],
            ['showHanViet', vi.settings.showHanViet],
            ['effects', vi.settings.effects],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="switch-row">
            <span>{label}</span>
            <input type="checkbox" className="switch" checked={prefs[key]} onChange={(e) => updatePrefs({ [key]: e.target.checked })} />
          </label>
        ))}
      </section>

      <section className="card stack-sm">
        <p className="section-title">{vi.settings.voice}</p>
        {(['natural', 'device'] as const).map((v) => (
          <label key={v} className="radio-row">
            <input type="radio" name="voice" checked={prefs.voiceSource === v} onChange={() => updatePrefs({ voiceSource: v })} />
            <span>{v === 'natural' ? vi.settings.voiceNatural : vi.settings.voiceDevice}</span>
          </label>
        ))}
        {prefs.voiceSource === 'device' && !hasDeviceChineseVoice() && <p className="note small">{vi.settings.noDeviceVoice}</p>}
        <p className="label">{vi.settings.speed}</p>
        <div className="chips">
          {SPEEDS.map((r) => (
            <button key={r} type="button" className={`chip${prefs.speechRate === r ? ' is-active' : ''}`} aria-pressed={prefs.speechRate === r} onClick={() => updatePrefs({ speechRate: r })}>
              {vi.settings.speedValue(r)}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => void speakChinese(VOICE_SAMPLE)}>
          {vi.settings.test}
        </button>
      </section>

      <section className="card stack-sm">
        <p className="section-title">{vi.settings.about}</p>
        <p className="small">{vi.settings.aboutText}</p>
        <p className="muted small">{vi.settings.credits}</p>
        <p className="muted small mono">
          {vi.settings.version}: {__APP_VERSION__}
        </p>
        <div className="row row--wrap">
          <button
            type="button"
            className="btn"
            onClick={() =>
              void checkForUpdate().then((r) => {
                if (r === 'latest') setUpdate(vi.settings.updateLatest);
                if (r === 'unavailable') setUpdate(vi.settings.updateUnavailable);
              })
            }
          >
            {vi.settings.checkUpdate}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => updatePrefs({ onboarded: false })}>
            {vi.settings.welcomeAgain}
          </button>
        </div>
        {update && <p role="status">{update}</p>}
      </section>
    </div>
  );
}
