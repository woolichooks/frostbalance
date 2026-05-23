import { MUSIC_TRACKS, type MusicState } from './config';

let el: HTMLAudioElement | null = null;
let currentState: MusicState | null = null;
let volume = 0.25;
let muted = false;
let fadeId: number | null = null;

const ensureEl = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  if (!el) {
    el = new Audio();
    el.loop = true;
    el.volume = muted ? 0 : volume;
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
  if (state === currentState) return;
  currentState = state;
  const node = ensureEl();
  if (!node) return;
  const url = MUSIC_TRACKS[state];
  if (!url) {
    fade(0, 300, () => {
      node.pause();
      node.src = '';
    });
    return;
  }
  fade(0, 250, () => {
    node.src = url;
    node.play().then(() => {
      fade(muted ? 0 : volume, 600);
    }).catch(() => {
      // Autoplay still blocked — will retry on next state change after a gesture.
    });
  });
};

export const setMusicVolume = (v: number): void => {
  volume = Math.max(0, Math.min(1, v));
  const node = ensureEl();
  if (node) node.volume = muted ? 0 : volume;
};

export const setMusicMuted = (m: boolean): void => {
  muted = m;
  const node = ensureEl();
  if (node) node.volume = muted ? 0 : volume;
};
