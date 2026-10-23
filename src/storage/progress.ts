// Learning progress in localStorage (`zv:progress:v1`): SM-2 cards keyed by
// srsKey (src/practice/decks.ts) and per-day counters. This module is the
// only place that reads or writes it.

import { useSyncExternalStore } from 'react';
import { review, todayKey, type CardState, type Grade } from '../srs/sm2';

export interface DayStats {
  /** Answers and ratings given. */
  answers: number;
  /** Right answers and "remembered" ratings. */
  correct: number;
  /** Daily-plan steps finished (Home's goal). */
  planSteps: number;
  /** Milliseconds of recorded speech. */
  recordMs: number;
}

export interface Progress {
  version: 1;
  srs: Record<string, CardState>;
  daily: Record<string, DayStats>;
}

const KEY = 'zv:progress:v1';
/** Days of history kept. */
const MAX_DAYS = 400;

export function emptyProgress(): Progress {
  return { version: 1, srs: {}, daily: {} };
}

function isCard(v: unknown): v is CardState {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.ef === 'number' &&
    typeof c.interval === 'number' &&
    typeof c.reps === 'number' &&
    typeof c.due === 'string' &&
    typeof c.lastReviewed === 'string'
  );
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);

/** Validates a stored or imported snapshot; null when it is not one. Bad entries are dropped. */
export function parseProgress(raw: unknown): Progress | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  const p = emptyProgress();
  if (typeof o.srs === 'object' && o.srs !== null) {
    for (const [k, v] of Object.entries(o.srs)) if (isCard(v)) p.srs[k] = v;
  }
  if (typeof o.daily === 'object' && o.daily !== null) {
    for (const [k, v] of Object.entries(o.daily)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || typeof v !== 'object' || v === null) continue;
      const d = v as Record<string, unknown>;
      p.daily[k] = { answers: num(d.answers), correct: num(d.correct), planSteps: num(d.planSteps), recordMs: num(d.recordMs) };
    }
  }
  return p;
}

let current: Progress | null = null;
const listeners = new Set<() => void>();

export function getProgress(): Progress {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    current = (raw && parseProgress(JSON.parse(raw))) || emptyProgress();
  } catch {
    current = emptyProgress();
  }
  return current;
}

function save(next: Progress): void {
  const days = Object.keys(next.daily).sort();
  for (const d of days.slice(0, Math.max(0, days.length - MAX_DAYS))) delete next.daily[d];
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: progress lives for this session only.
  }
  listeners.forEach((l) => l());
}

function bumpDay(p: Progress, patch: Partial<DayStats>): Record<string, DayStats> {
  const today = todayKey();
  const d = p.daily[today] ?? { answers: 0, correct: 0, planSteps: 0, recordMs: 0 };
  return {
    ...p.daily,
    [today]: {
      answers: d.answers + (patch.answers ?? 0),
      correct: d.correct + (patch.correct ?? 0),
      planSteps: d.planSteps + (patch.planSteps ?? 0),
      recordMs: d.recordMs + (patch.recordMs ?? 0),
    },
  };
}

/** A self-rating (flashcards, speaking): 1 forgot, 3 hard, 4 remembered. */
export function rateItem(key: string, grade: Grade): void {
  const p = getProgress();
  save({
    ...p,
    srs: { ...p.srs, [key]: review(p.srs[key], grade, todayKey()) },
    daily: bumpDay(p, { answers: 1, correct: grade >= 3 ? 1 : 0 }),
  });
}

/** A quiz answer: right = grade 4, wrong = grade 1. */
export function recordAnswer(key: string, right: boolean): void {
  rateItem(key, right ? 4 : 1);
}

export function savePlanStep(): void {
  const p = getProgress();
  save({ ...p, daily: bumpDay(p, { planSteps: 1 }) });
}

export function addRecordingTime(ms: number): void {
  if (ms <= 0) return;
  const p = getProgress();
  save({ ...p, daily: bumpDay(p, { recordMs: ms }) });
}

/** Replaces all progress with an imported snapshot. Returns false when it is not valid. */
export function importProgress(raw: unknown): boolean {
  const p = parseProgress(raw);
  if (!p) return false;
  save(p);
  return true;
}

export function resetProgress(): void {
  save(emptyProgress());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress);
}
