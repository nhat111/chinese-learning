// Reads Chinese aloud: the pre-generated natural voice (MP3) when a file
// exists, otherwise the device's SpeechSynthesis (zh-CN).

import { audioKey, audioUrl } from './speaking/audioKey';
import { getPrefs } from './storage/prefs';

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined');
}

function deviceSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Mandarin voices on this device, zh-CN first. */
function chineseVoices(): SpeechSynthesisVoice[] {
  if (!deviceSpeechSupported()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => /^(zh|cmn)/i.test(v.lang) && !/HK|yue/i.test(v.lang))
    .sort((a, b) => Number(/zh[-_]CN/i.test(b.lang)) - Number(/zh[-_]CN/i.test(a.lang)));
}

// Some browsers load voices asynchronously; touching getVoices() early helps.
if (deviceSpeechSupported()) {
  chineseVoices();
  window.speechSynthesis.addEventListener('voiceschanged', chineseVoices);
}

/** True when the device can read Chinese without the natural-voice files. */
export function hasDeviceChineseVoice(): boolean {
  return chineseVoices().length > 0;
}

/**
 * Speaks `text` with the learner's speed (or `rate`). Resolves when speech
 * ends, fails or is stopped.
 */
export function speakChinese(text: string, rate?: number): Promise<void> {
  const prefs = getPrefs();
  const r = rate ?? prefs.speechRate;
  if (prefs.voiceSource === 'natural' && hasAudio(text)) {
    return playNatural(text, r).catch(() => speakDevice(text, r));
  }
  return speakDevice(text, r);
}

function speakDevice(text: string, rate: number): Promise<void> {
  if (!deviceSpeechSupported()) return Promise.resolve();
  const synth = window.speechSynthesis;
  // iOS WebKit can drop an utterance when speak() follows cancel() on an idle synthesizer.
  if (synth.speaking || synth.pending) synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    const voice = chineseVoices()[0];
    u.lang = voice?.lang ?? 'zh-CN';
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

// Which texts have a natural-voice file (written by scripts/tts.py). Until it
// loads (or if it fails) every text is tried, falling back on 404.
let audioIndex: Set<string> | null = null;

function hasAudio(text: string): boolean {
  return audioIndex === null || audioIndex.has(audioKey(text));
}

if (typeof window !== 'undefined') {
  fetch(`${import.meta.env.BASE_URL}data/audio-index.json`)
    .then((r) => (r.ok ? (r.json() as Promise<unknown>) : null))
    .then((data) => {
      const keys = (data as { keys?: unknown } | null)?.keys;
      if (Array.isArray(keys)) audioIndex = new Set(keys.filter((k): k is string => typeof k === 'string'));
    })
    .catch(() => undefined);
}

// 50 ms of silence, played on the first tap so iOS lets this element play
// later without a gesture (after the async fetch below).
const SILENT_MP3 =
  'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEwAAAAAAAAAAAAEluZm8AAAAPAAAABQAAAigAenp6enp6enp6enp6enp6enp6epubm5ubm5ubm5ubm5ubm5ubm5ubvb29vb29vb29vb29vb29vb29vb3e3t7e3t7e3t7e3t7e3t7e3t7e3v//////////////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQEUAAAAAAAAAIoTTfS5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//M0xAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVV//M0xDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//M0xHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//M0xLEAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//M0xMQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

let player: HTMLAudioElement | null = null;
let playId = 0;

function getPlayer(): HTMLAudioElement {
  if (!player) {
    player = new Audio();
    player.src = SILENT_MP3;
    player.play().catch(() => undefined);
  }
  return player;
}

const AUDIO_TIMEOUT_MS = 6000;

/** fetch + blob (not audio.src = url) so the service worker can cache the file for offline use. */
async function fetchAudio(text: string): Promise<Blob> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUDIO_TIMEOUT_MS);
  try {
    const res = await fetch(audioUrl(text, __AUDIO_BASE__), { signal: controller.signal });
    if (!res.ok) throw new Error(`audio ${res.status}`);
    // A firewall's block page or the SPA fallback can answer 200 with HTML.
    if (!(res.headers.get('content-type') ?? '').startsWith('audio/')) throw new Error('not audio');
    return await res.blob();
  } finally {
    clearTimeout(timer);
  }
}

async function playNatural(text: string, rate: number): Promise<void> {
  stopSpeaking();
  // Unlock the shared element inside the tap, before the fetch.
  getPlayer();
  const id = playId;
  const blob = await fetchAudio(text);
  if (id !== playId) return; // superseded or stopped meanwhile
  const url = URL.createObjectURL(blob);
  return playOnPlayer(url, rate).finally(() => URL.revokeObjectURL(url));
}

/** Plays `url` on the shared (iOS-unlocked) element; rejects if playback fails. */
function playOnPlayer(url: string, rate: number): Promise<void> {
  const audio = getPlayer();
  return new Promise<void>((resolve, reject) => {
    const done = (err?: unknown) => {
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('pause', onEnd);
      audio.removeEventListener('error', onError);
      if (err === undefined) resolve();
      else reject(err);
    };
    const onEnd = () => done();
    const onError = () => done(new Error('audio playback failed'));
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onEnd);
    audio.addEventListener('error', onError);
    audio.src = url;
    audio.preservesPitch = true;
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
    audio.play().catch((e: unknown) => done(e ?? new Error('play failed')));
  });
}

/** Plays a recording (object URL) on the same element as the model voice. */
export function playRecording(url: string): Promise<void> {
  stopSpeaking();
  return playOnPlayer(url, 1).catch(() => undefined);
}

export function stopSpeaking(): void {
  playId++;
  player?.pause();
  if (deviceSpeechSupported()) window.speechSynthesis.cancel();
}

// Short tones for right / wrong answers (Web Audio, no files).
let fxCtx: AudioContext | null = null;

export function playEffect(kind: 'right' | 'wrong'): void {
  if (!getPrefs().effects || typeof window === 'undefined') return;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    fxCtx ??= new Ctx();
    const ctx = fxCtx;
    void ctx.resume().catch(() => undefined);
    const notes = kind === 'right' ? [660, 880] : [300, 220];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.12;
      osc.type = kind === 'right' ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch {
    // Effects are optional.
  }
}
