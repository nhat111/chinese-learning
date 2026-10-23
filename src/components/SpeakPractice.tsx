import { useRef, useState } from 'react';
import { vi } from '../i18n/vi';
import { compareZh, PASS_SCORE, type Comparison } from '../speaking/compare';
import { isRecognitionSupported, recognitionUnsupportedMessage, useSpeechRecognition } from '../speaking/recognition';
import { isRecordingSupported, playAudio, useRecorder } from '../speaking/recorder';
import { playEffect, speakChinese } from '../speech';
import type { Grade } from '../srs/sm2';
import { rateItem } from '../storage/progress';
import { Icon } from './Icon';

interface Props {
  /** The model sentence. */
  text: string;
  /** Progress key the rating is saved under. */
  srsKey: string;
  /** Called once the line has a rating (machine score or self-rating). */
  onRated?: (grade: Grade) => void;
}

function gradeFromScore(score: number): Grade {
  if (score >= 85) return 4;
  if (score >= PASS_SCORE) return 3;
  return 1;
}

/**
 * Listen → say it → compare. Key it by `text`: state belongs to one sentence.
 * With speech recognition the line is scored
 * character by character; without it (or alongside it) the learner records
 * themselves, listens back and rates how close it was.
 */
export function SpeakPractice({ text, srsKey, onRated }: Props) {
  const recognition = useSpeechRecognition();
  const recorder = useRecorder();
  const [result, setResult] = useState<{ heard: string; cmp: Comparison } | null>(null);
  const [rated, setRated] = useState<Grade | null>(null);
  const canRecognize = isRecognitionSupported();
  const canRecord = isRecordingSupported();
  const ratedRef = useRef(false);


  const rate = (grade: Grade) => {
    rateItem(srsKey, grade);
    setRated(grade);
    if (!ratedRef.current) {
      ratedRef.current = true;
      onRated?.(grade);
    }
  };

  const say = () => {
    if (recognition.status === 'listening') {
      recognition.stop();
      return;
    }
    setResult(null);
    recognition.start((heard) => {
      const cmp = compareZh(text, heard);
      setResult({ heard, cmp });
      playEffect(cmp.score >= PASS_SCORE ? 'right' : 'wrong');
      if (!ratedRef.current) rate(gradeFromScore(cmp.score));
    });
  };

  const record = () => {
    if (recorder.status === 'recording') recorder.stop();
    else void recorder.start({ autoStop: true });
  };

  const listening = recognition.status === 'listening';
  const recording = recorder.status === 'recording';

  return (
    <div className="speak stack-sm">
      <div className="speak-row">
        <button type="button" className="speak-btn" onClick={() => void speakChinese(text)}>
          <Icon name="volume" />
          <span>{vi.speaking.listen}</span>
        </button>
        {canRecognize && (
          <button type="button" className={`speak-btn speak-btn--main${listening ? ' is-live' : ''}`} onClick={say} disabled={recording}>
            <Icon name={listening ? 'square' : 'mic'} />
            <span>{listening ? vi.speaking.stop : vi.speaking.say}</span>
          </button>
        )}
        {canRecord && (
          <button
            type="button"
            className={`speak-btn${canRecognize ? '' : ' speak-btn--main'}${recording ? ' is-live' : ''}`}
            onClick={record}
            disabled={listening}
          >
            <Icon name={recording ? 'square' : 'pen'} />
            <span>{recording ? vi.speaking.stop : vi.speaking.record}</span>
          </button>
        )}
        {recorder.url && (
          <button type="button" className="speak-btn" onClick={() => void playAudio(recorder.url!)}>
            <Icon name="headphones" />
            <span>{vi.speaking.myVoice}</span>
          </button>
        )}
      </div>

      <p className="speak-status muted" role="status">
        {listening
          ? recognition.interim || vi.speaking.listening
          : recording
            ? vi.speaking.recording
            : (recognition.error ?? recorder.error ?? (!canRecognize && !canRecord ? vi.speaking.noMic : !canRecognize ? recognitionUnsupportedMessage() : ''))}
      </p>

      {result && (
        <div className="speak-result stack-xs">
          <p className="speak-score">
            <span className={`score ${result.cmp.score >= PASS_SCORE ? 'score--ok' : 'score--bad'}`}>{vi.speaking.score(result.cmp.score)}</span>
            <span>
              {result.cmp.score >= 85 ? vi.speaking.scoreGood : result.cmp.score >= PASS_SCORE ? vi.speaking.scoreOk : vi.speaking.scoreLow}
            </span>
          </p>
          <p lang="zh-CN" className="marks" aria-label={text}>
            {result.cmp.marks.map((m, i) => (
              <span key={i} className={m.ok ? 'mark-ok' : 'mark-miss'}>
                {m.ch}
              </span>
            ))}
          </p>
          <p className="muted small">
            {vi.speaking.heard} <span lang="zh-CN">{result.heard}</span>
          </p>
        </div>
      )}

      {recorder.url && !result && (
        <div className="stack-xs">
          <p className="muted center">{vi.speaking.selfRate}</p>
          <div className="rate-row">
            {(
              [
                [1, vi.speaking.rateBad, 'bad'],
                [3, vi.speaking.rateOk, 'ok'],
                [4, vi.speaking.rateGood, 'good'],
              ] as const
            ).map(([g, label, tone]) => (
              <button key={g} type="button" className={`btn rate rate--${tone}${rated === g ? ' is-picked' : ''}`} onClick={() => rate(g)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
