import { useState } from 'react';
import { setSfxMuted, setSfxVolume } from '../audio/sfx';
import { setMusicMuted, setMusicVolume } from '../audio/music';

const STORAGE_KEY = 'frostbalance.audio';

type Persisted = {
  volume: number;
  muted: boolean;
};

const load = (): Persisted => {
  if (typeof window === 'undefined') return { volume: 0.4, muted: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { volume: 0.4, muted: false };
};

const save = (p: Persisted): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
};

export function AudioControls() {
  const initial = load();
  const [volume, setVolumeState] = useState(initial.volume);
  const [muted, setMutedState] = useState(initial.muted);

  // Apply initial state on mount
  useState(() => {
    setSfxVolume(volume);
    setMusicVolume(volume * 0.3);
    setSfxMuted(muted);
    setMusicMuted(muted);
  });

  const updateVolume = (v: number) => {
    setVolumeState(v);
    setSfxVolume(v);
    setMusicVolume(v * 0.3);
    save({ volume: v, muted });
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setSfxMuted(next);
    setMusicMuted(next);
    save({ volume, muted: next });
  };

  return (
    <div className="audio-controls" aria-label="Audio controls">
      <button
        type="button"
        className="audio-mute"
        onClick={toggleMute}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? 'SOUND OFF' : 'SOUND ON'}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => updateVolume(Number(e.target.value))}
        disabled={muted}
        aria-label="Volume"
      />
    </div>
  );
}
