import HanziWriter from 'hanzi-writer';
import { useEffect, useRef, useState } from 'react';
import { loadStrokes } from '../hanzi/strokes';
import { vi } from '../i18n/vi';

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

interface Props {
  char: string;
  mode: 'watch' | 'practice';
  /** Practice finished: mistakes made on the way. */
  onComplete?: (mistakes: number) => void;
  /** Bumped to restart the animation or the practice. */
  run?: number;
  size?: number;
}

/**
 * Hanzi Writer on a 米字格 practice grid: "watch" loops the stroke order,
 * "practice" lets the learner draw each stroke with a finger.
 */
export function HanziWriterBox({ char, mode, onComplete, run = 0, size = 260 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const writer = HanziWriter.create(el, char, {
      width: size,
      height: size,
      padding: 12,
      showOutline: true,
      showCharacter: mode === 'watch',
      strokeAnimationSpeed: 0.9,
      delayBetweenStrokes: 350,
      delayBetweenLoops: 1600,
      strokeColor: cssVar('--text', '#222'),
      outlineColor: cssVar('--grid', '#ddd'),
      highlightColor: cssVar('--primary', '#c0262d'),
      drawingColor: cssVar('--primary', '#c0262d'),
      radicalColor: null,
      drawingWidth: 18,
      showHintAfterMisses: 3,
      charDataLoader: (c, onLoad, onError) => {
        loadStrokes(c).then(
          (data) => {
            setStrokes(data.strokes.length);
            onLoad(data);
          },
          (e: unknown) => {
            setFailed(true);
            onError(e);
          },
        );
      },
    });
    if (mode === 'watch') void writer.loopCharacterAnimation();
    else void writer.quiz({ onComplete: ({ totalMistakes }) => completeRef.current?.(totalMistakes) });
    return () => {
      if (mode === 'practice') writer.cancelQuiz();
      else void writer.pauseAnimation();
      el.innerHTML = '';
    };
  }, [char, mode, run, size]);

  return (
    <div className="stack-xs center">
      <div className="writer-grid" style={{ width: size, height: size }}>
        <svg className="writer-grid-lines" viewBox="0 0 100 100" aria-hidden>
          <path d="M0 0 L100 100 M100 0 L0 100 M50 0 V100 M0 50 H100" />
        </svg>
        <div ref={ref} className="writer-target" aria-label={char} role="img" />
      </div>
      {failed ? <p className="error">{vi.hanzi.loadFailed}</p> : strokes !== null && <p className="muted mono">{vi.hanzi.strokes(strokes)}</p>}
    </div>
  );
}
