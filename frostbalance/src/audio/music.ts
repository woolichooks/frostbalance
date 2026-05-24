import { MUSIC_TRACKS, type MusicState } from './config';

let el: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let volume = 0.25;
let muted = false;
let ducked = false;
let fadeId: number | null = null;

const DUCK_FACTOR = 0.35;

const effectiveVolume = (): number => {
  if (muted) return 0;
  return ducked ? volume * DUCK_FACTOR : volume;
};

const ensureEl = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  if (!el) {
    el = new Audio();
    el.loop = true;
    el.volume = effectiveVolume();
    el.preload = 'auto';
  }
  return el;
};

const cancelFade = (): void => {
  if (fadeId !== null) {
    window.clearInterval(fadeId);
    fadeId = null;
  }
};

const fade = (target: number, durationMs: number, onDone?: () => void): void => {
  const node = ensureEl();
  if (!node) return;
  cancelFade();
  const start = node.volume;
  const steps = 16;
  const stepMs = durationMs / steps;
  let i = 0;
  fadeId = window.setInterval(() => {
    i++;
    node.volume = start + (target - start) * (i / steps);
    if (i >= steps) {
      cancelFade();
      node.volume = target;
      onDone?.();
    }
  }, stepMs);
};

export const setMusicState = (state: MusicState): void => {
  const node = ensureEl();
  if (!node) return;
  const url = MUSIC_TRACKS[state];
  // Same URL already playing: keep going — no re-fetch, no restart.
  if (url === currentUrl) return;
  if (!url) {
    currentUrl = null;
    fade(0, 300, () => {
      node.pause();
      node.src = '';
    });
    return;
  }
  fade(0, 250, () => {
    node.src = url;
    node.play().then(() => {
      // Mark as current only after a real start so a blocked-autoplay
      // attempt doesn't poison future retries with the same URL.
      currentUrl = url;
      fade(effectiveVolume(), 600);
    }).catch(() => {
      // Autoplay blocked or load failed. Leave currentUrl unchanged so
      // the next setMusicState call retries the same URL.
    });
  });
};

export const setMusicVolume = (v: number): void => {
  volume = Math.max(0, Math.min(1, v));
  const node = ensureEl();
  if (node) node.volume = effectiveVolume();
};

export const setMusicMuted = (m: boolean): void => {
  muted = m;
  const node = ensureEl();
  if (node) node.volume = effectiveVolume();
};

export const setMusicDucked = (d: boolean): void => {
  if (d === ducked) return;
  ducked = d;
  fade(effectiveVolume(), 400);
};
