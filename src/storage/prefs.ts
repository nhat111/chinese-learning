// Device preferences in localStorage (`zv:prefs:v1`). Missing fields default,
// so older saved prefs still load.

import { useSyncExternalStore } from 'react';

export type Learner = 'kid' | 'adult';
export type VoiceSource = 'natural' | 'device';
export type DailyMinutes = 5 | 10 | 15;

export interface Prefs {
  /** Kid mode: bigger pictures and buttons, rewards, no Hán Việt by default. */
  learner: Learner;
  minutes: DailyMinutes;
  /** The welcome was answered or skipped. */
  onboarded: boolean;
  /** 0.5-1.2; applied as playbackRate for the natural voice. */
  speechRate: number;
  voiceSource: VoiceSource;
  showPinyin: boolean;
  showHanViet: boolean;
  /** Short sounds for right and wrong answers. */
  effects: boolean;
}

const KEY = 'zv:prefs:v1';

export const DEFAULT_PREFS: Prefs = {
  learner: 'adult',
  minutes: 5,
  onboarded: false,
  speechRate: 0.9,
  voiceSource: 'natural',
  showPinyin: true,
  showHanViet: true,
  effects: true,
};

/** Reads saved prefs field by field; anything missing or invalid takes its default. */
export function parsePrefs(raw: unknown): Prefs {
  const p = { ...DEFAULT_PREFS };
  if (typeof raw !== 'object' || raw === null) return p;
  const o = raw as Record<string, unknown>;
  if (o.learner === 'kid' || o.learner === 'adult') p.learner = o.learner;
  if (o.minutes === 5 || o.minutes === 10 || o.minutes === 15) p.minutes = o.minutes;
  if (typeof o.speechRate === 'number' && o.speechRate >= 0.5 && o.speechRate <= 1.2) p.speechRate = o.speechRate;
  if (o.voiceSource === 'natural' || o.voiceSource === 'device') p.voiceSource = o.voiceSource;
  for (const k of ['onboarded', 'showPinyin', 'showHanViet', 'effects'] as const) {
    if (typeof o[k] === 'boolean') p[k] = o[k];
  }
  return p;
}

let current: Prefs | null = null;
const listeners = new Set<() => void>();

export function getPrefs(): Prefs {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    current = parsePrefs(raw ? JSON.parse(raw) : null);
  } catch {
    current = { ...DEFAULT_PREFS };
  }
  return current;
}

export function updatePrefs(patch: Partial<Prefs>): void {
  current = { ...getPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage full or blocked: keep the change for this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getPrefs);
}
