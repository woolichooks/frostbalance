// Synthesized SFX via Web Audio API — no audio assets shipped.
// Lazy AudioContext: created on first call so we honor autoplay rules.
//
// Frequency note: phone + laptop speakers can't reproduce much below
// ~250Hz, so every cue is voiced in the midrange or above and uses a
// master compressor for perceived loudness on tiny drivers.

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let volume = 0.7;

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    // master → compressor → makeup gain → destination.
    // The compressor evens out peaks; makeup gain restores (and exceeds)
    // the original level so small speakers actually push air. Without
    // makeup, a compressor only ever makes things quieter.
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 10;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    const makeup = audioCtx.createGain();
    makeup.gain.value = 2.6;
    master = audioCtx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(compressor);
    compressor.connect(makeup);
    makeup.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const ensureAudioReady = (): void => {
  getCtx();
};

export const setSfxVolume = (v: number): void => {
  volume = Math.max(0, Math.min(1, v));
  if (master) master.gain.value = muted ? 0 : volume;
};

export const setSfxMuted = (m: boolean): void => {
  muted = m;
  if (master) master.gain.value = muted ? 0 : volume;
};

const env = (ctx: AudioContext, attack: number, peak: number, decay: number): GainNode => {
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
};

const noiseBuffer = (ctx: AudioContext, durationSec: number, shape: (i: number, len: number) => number): AudioBuffer => {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * durationSec), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * shape(i, data.length);
  }
  return buf;
};

// Soft ice-tap for row clicks / option selection
export const playIceTap = (): void => {
  const ctx = getCtx();
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(2400, t);
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
  const g = env(ctx, 0.005, 0.25, 0.09);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.12);
};

// Heavier thunk for wrong submission — voiced in the midrange so it
// survives a phone speaker. Square wave gives plenty of harmonics
// above the speaker's HPF.
export const playWrongThunk = (): void => {
  const ctx = getCtx();
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = 'square';
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.28);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, t);
  filter.frequency.exponentialRampToValueAtTime(900, t + 0.28);
  const g = env(ctx, 0.005, 0.5, 0.3);
  osc.connect(filter).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.32);
};

// Ascending bell-chord for solve
export const playEurekaChime = (): void => {
  const ctx = getCtx();
  if (!ctx || !master) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.09;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.32, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
    osc.connect(g).connect(master!);
    osc.start(start);
    osc.stop(start + 0.95);
  });
};

// Horn for timeout — moved up into the mid-bass + low-mid so small
// speakers can actually reproduce it. Triangle wave keeps it round.
export const playTimeoutHorn = (): void => {
  const ctx = getCtx();
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  // Fundamental in the low-mid (small speakers handle 300Hz+ fine)
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, t);
  osc.frequency.linearRampToValueAtTime(220, t + 1.4);
  // Fifth above for harmonic weight; also audible on small drivers
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(495, t);
  osc2.frequency.linearRampToValueAtTime(330, t + 1.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.55, t + 0.12);
  g.gain.linearRampToValueAtTime(0.42, t + 1.0);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
  osc.connect(g).connect(master);
  osc2.connect(g);
  osc.start(t);
  osc2.start(t);
  osc.stop(t + 1.65);
  osc2.stop(t + 1.65);
};

// Short tick for last 10s countdown
export const playTick = (): void => {
  const ctx = getCtx();
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 1400;
  const g = env(ctx, 0.001, 0.14, 0.04);
  osc.connect(g).connect(master);
  osc.start();
  osc.stop(ctx.currentTime + 0.06);
};

// Crackle for the "burn a log for a hint" action — bandpass moved up
// so the warmth is in the speaker's responsive range.
export const playHintBurn = (): void => {
  const ctx = getCtx();
  if (!ctx || !master) return;
  const buf = noiseBuffer(ctx, 0.4, (i, len) => Math.exp(-i / (len * 0.25)));
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  filter.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.value = 0.55;
  src.connect(filter).connect(g).connect(master);
  src.start();
};

// Wind whoosh for sleeping through the night — sweep ends in the
// low-mid (350Hz) rather than sub-bass.
export const playSleepWhoosh = (): void => {
  const ctx = getCtx();
  if (!ctx || !master) return;
  const buf = noiseBuffer(ctx, 1.0, () => 0.5);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const t = ctx.currentTime;
  filter.frequency.setValueAtTime(2400, t);
  filter.frequency.exponentialRampToValueAtTime(350, t + 0.9);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.28, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
  src.connect(filter).connect(g).connect(master);
  src.start();
};
