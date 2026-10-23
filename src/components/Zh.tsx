import { isSpeechSupported, speakChinese } from '../speech';
import { vi } from '../i18n/vi';
import { usePrefs } from '../storage/prefs';
import { Icon } from './Icon';

export function SpeakButton({ text, small, rate, label }: { text: string; small?: boolean; rate?: number; label?: string }) {
  if (!isSpeechSupported()) return null;
  return (
    <button
      type="button"
      className={small ? 'icon-btn icon-btn--small' : 'icon-btn'}
      onClick={(e) => {
        // Don't trigger parent click handlers (e.g. flipping a card).
        e.stopPropagation();
        void speakChinese(text, rate);
      }}
      aria-label={label ?? vi.common.speak}
      title={label ?? vi.common.speak}
    >
      <Icon name="volume" size={small ? 18 : 22} />
    </button>
  );
}

interface ZhTextProps {
  zh: string;
  pinyin?: string;
  hv?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show the speak button next to the text. */
  speak?: boolean;
}

/**
 * Chinese text with its pinyin above (when shown in Settings) and the Hán Việt
 * reading below (adults, when shown).
 */
export function ZhText({ zh, pinyin, hv, size = 'md', speak = true }: ZhTextProps) {
  const prefs = usePrefs();
  return (
    <div className={`zh-text zh-text--${size}`}>
      <div className="zh-text-main">
        {pinyin && prefs.showPinyin && <span className="pinyin">{pinyin}</span>}
        <span lang="zh-CN" className="zh">
          {zh}
        </span>
        {hv && prefs.showHanViet && <span className="hv">{hv}</span>}
      </div>
      {speak && <SpeakButton text={zh} small={size === 'sm'} />}
    </div>
  );
}
