import type { Settings } from '../settings';

type Props = {
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
};

export function SettingsModal({ settings, onChange, onClose }: Props) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal settings-modal"
        role="dialog"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="settings-title">Preferences</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <section className="settings-section">
          <h3>Audio</h3>
          <label className="setting-row">
            <span>Sound</span>
            <button
              type="button"
              className="toggle"
              role="switch"
              aria-checked={!settings.audioMuted}
              onClick={() => set('audioMuted', !settings.audioMuted)}
            >
              {settings.audioMuted ? 'OFF' : 'ON'}
            </button>
          </label>
          <label className="setting-row">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.audioVolume}
              disabled={settings.audioMuted}
              onChange={(e) => set('audioVolume', Number(e.target.value))}
            />
          </label>
        </section>

        <section className="settings-section">
          <h3>Accessibility</h3>
          <label className="setting-row">
            <span>
              Dyslexia-friendly body font
              <span className="setting-hint">Switches body text to Atkinson Hyperlegible.</span>
            </span>
            <button
              type="button"
              className="toggle"
              role="switch"
              aria-checked={settings.dyslexiaFont}
              onClick={() => set('dyslexiaFont', !settings.dyslexiaFont)}
            >
              {settings.dyslexiaFont ? 'ON' : 'OFF'}
            </button>
          </label>
          <label className="setting-row">
            <span>
              High-contrast highlights
              <span className="setting-hint">Selected / correct / wrong rows use patterns + bolder borders.</span>
            </span>
            <button
              type="button"
              className="toggle"
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => set('highContrast', !settings.highContrast)}
            >
              {settings.highContrast ? 'ON' : 'OFF'}
            </button>
          </label>
          <label className="setting-row">
            <span>
              Reduced motion
              <span className="setting-hint">Disables animations.</span>
            </span>
            <button
              type="button"
              className="toggle"
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => set('reducedMotion', !settings.reducedMotion)}
            >
              {settings.reducedMotion ? 'ON' : 'OFF'}
            </button>
          </label>
        </section>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            <span>Done</span>
            <span className="arrow">↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
