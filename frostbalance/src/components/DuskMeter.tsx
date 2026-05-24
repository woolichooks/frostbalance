type Props = {
  elapsedMs: number;
  limitMs: number;
};

const padTwo = (n: number): string => String(n).padStart(2, '0');

export function DuskMeter({ elapsedMs, limitMs }: Props) {
  const remaining = Math.max(0, limitMs - elapsedMs);
  const pct = Math.max(0, Math.min(100, (elapsedMs / limitMs) * 100));
  const totalSec = Math.ceil(remaining / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const isDusk = remaining > 0 && remaining <= 10_000;

  const ratio = remaining / limitMs;
  const tier =
    ratio > 2 / 3 ? 'bright' : ratio > 1 / 3 ? 'steady' : remaining > 0 ? 'sundown' : 'cold';

  return (
    <footer className={['app-foot', isDusk ? 'is-dusk' : ''].join(' ')}>
      <span className="dusk-label">Sunrise</span>
      <div className="dusk-meter" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
        <div className="dusk-ticks">
          <i style={{ left: '33%' }} />
          <i style={{ left: '66%' }} />
        </div>
      </div>
      <div className="tiers">
        <span className={['tier-chip', tier === 'bright' ? 'active' : 'passed'].join(' ')}>
          ×3 BRIGHT
        </span>
        <span
          className={[
            'tier-chip',
            tier === 'steady' ? 'active' : tier === 'bright' ? '' : 'passed',
          ].join(' ')}
        >
          ×2 STEADY
        </span>
        <span
          className={[
            'tier-chip',
            tier === 'sundown' ? 'active' : tier === 'cold' ? 'passed' : '',
          ].join(' ')}
        >
          ×1 SUNDOWN
        </span>
      </div>
      <span className="dusk-label">Dusk in</span>
      <span className="dusk-clock">
        {padTwo(mm)}:{padTwo(ss)}
      </span>
    </footer>
  );
}
