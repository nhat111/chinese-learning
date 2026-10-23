/** Commit + build time, injected by vite.config.ts. */
declare const __APP_VERSION__: string;
/**
 * Where the natural-voice MP3s are served from, without a trailing slash
 * ('' = this origin, public/audio). Injected by vite.config.ts from VITE_AUDIO_BASE_URL.
 */
declare const __AUDIO_BASE__: string;
