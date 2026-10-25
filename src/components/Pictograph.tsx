import { useState } from 'react';
import { vi } from '../i18n/vi';
import type { HanziItem } from '../types';
import { Icon } from './Icon';

/** A pictograph's simple drawing; each stroke (subpath) draws itself in turn. */
export function Sketch({ d, size = 76 }: { d: string; size?: number }) {
  const strokes = d.split(/(?=M)/);
  return (
    <svg className="sketch" viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      {strokes.map((s, i) => (
        <path key={i} d={s} pathLength={1} style={{ animationDelay: `${(i * 0.9) / strokes.length}s` }} />
      ))}
    </svg>
  );
}

/** Real thing → simple drawing → character. Tap the drawing to draw it again. */
export function PictographStrip({ item }: { item: HanziItem }) {
  const [run, setRun] = useState(0);
  if (!item.sketch) return null;
  return (
    <div className="picto-strip" role="img" aria-label={`${item.vi}: ${item.emoji} → ${item.char}`}>
      <figure className="picto-step">
        <span className="picto-emoji" aria-hidden>
          {item.emoji}
        </span>
        <figcaption>{vi.hanzi.real}</figcaption>
      </figure>
      <Icon name="chevronRight" size={18} />
      <figure className="picto-step">
        <button type="button" className="picto-redraw" onClick={() => setRun((r) => r + 1)} aria-label={vi.hanzi.drawn}>
          <Sketch key={run} d={item.sketch} />
        </button>
        <figcaption>{vi.hanzi.drawn}</figcaption>
      </figure>
      <Icon name="chevronRight" size={18} />
      <figure className="picto-step">
        <span lang="zh-CN" className="picto-char" aria-hidden>
          {item.char}
        </span>
        <figcaption>{vi.hanzi.glyph}</figcaption>
      </figure>
    </div>
  );
}
