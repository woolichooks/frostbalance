export type Settings = {
  audioVolume: number;
  audioMuted: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  audioVolume: 0.55,
  audioMuted: false,
  dyslexiaFont: false,
  highContrast: false,
  reducedMotion: false,
};

const SETTINGS_KEY = 'frostbalance.settings.v1';
const INTRO_KEY = 'frostbalance.intro.seen.v1';

export const loadSettings = (): Settings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: Settings): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
};

export const introSeen = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return true;
  }
};

export const markIntroSeen = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INTRO_KEY, '1');
  } catch {}
};

// Personal best per real-world date
export type BestRecord = { timeMs: number; tier: number; day: number };

const todayKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `frostbalance.best.${y}-${m}-${day}`;
};

export const loadTodaysBest = (): BestRecord | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(todayKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const recordSolve = (timeMs: number, tier: number, day: number): boolean => {
  if (typeof window === 'undefined') return false;
  const current = loadTodaysBest();
  if (current && current.timeMs <= timeMs) return false;
  try {
    window.localStorage.setItem(todayKey(), JSON.stringify({ timeMs, tier, day }));
    return true;
  } catch {
    return false;
  }
};
